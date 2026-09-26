import 'server-only';
import { supabaseAdmin } from './server';
import { DELIVERY_ZONES, getZone } from '@/lib/deliveryZones';
import { fetchSchedule, openDatesBetween, toISODate, parseISODate } from '@/lib/deliverySchedule';
import { BoxWindowFields, inDeliveryWindow, saleState } from '@/lib/boxWindow';
import { dietSummary } from '@/lib/dietary';
import { fetchBoxSizePrices, isTreatCount, sizeText, toTreatCount, type TreatCount } from '@/lib/boxSizes';

/**
 * Creates an order on the SERVER, pricing it from the database.
 *
 * The browser only says WHAT was picked (which box or treat, how many, which zone and day). It never
 * says what things cost: a visitor who edits the page could otherwise pay R$1 for a R$99 box. The price of
 * every line, the delivery fee, the stock and the delivery day are all worked out and checked here, then
 * the order is saved with the service-role key (so the public no longer needs any permission on the
 * orders table beyond leaving a lead).
 */

export class OrderError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export interface OrderInput {
  items: { id?: string; kind?: string; quantity?: number; tasting_box_id?: string; box_size?: number }[];
  customer: { name?: string; email?: string; whatsapp?: string; address?: string };
  fulfillment?: string;
  zoneId?: string;
  date?: string;
  affiliateCode?: string;
  diet?: { tags?: string[]; allergens?: string[]; notes?: string };
  payMethod?: string;
}

export interface CreatedOrder {
  reference: string;
  subtotal: number;
  fee: number;
  total: number;
  lines: { name: string; quantity: number; unit: number }[];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const round2 = (n: number) => Math.round(n * 100) / 100;
const text = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);
const list = (v: unknown, max: number) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.length < 60).slice(0, max) : [];

/** Brazil's calendar day right now (the server runs in UTC, the customers live at UTC-3). */
function brasiliaToday(): Date {
  const shifted = new Date(Date.now() - 3 * 3600 * 1000);
  return new Date(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
}

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

interface BoxRow extends BoxWindowFields { id: string; title: string; price: number; is_active: boolean }
interface TreatRow { id: string; name: string; price: number; is_available: boolean; min_batch_size: number | null; batch_multiplier: number | null }

/** `userToken` is the visitor's session token, if they are signed in (needed for pickup and to link the order to them). */
export async function createOrder(input: OrderInput, userToken: string | null): Promise<CreatedOrder> {
  const db = supabaseAdmin();

  // ---- who
  const name = text(input.customer?.name, 120);
  const email = text(input.customer?.email, 160);
  const whatsapp = text(input.customer?.whatsapp, 40).replace(/\D/g, '');
  const address = text(input.customer?.address, 300);
  if (name.length < 2) throw new OrderError(400, 'Informe seu nome.');
  if (whatsapp.length < 10) throw new OrderError(400, 'Informe seu WhatsApp com DDD.');
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new OrderError(400, 'O e-mail parece estar incompleto.');

  let userId: string | null = null;
  if (userToken) {
    const { data } = await db.auth.getUser(userToken);
    userId = data.user?.id ?? null;
  }

  // ---- what
  const rawItems = Array.isArray(input.items) ? input.items.slice(0, 40) : [];
  if (rawItems.length === 0) throw new OrderError(400, 'O carrinho está vazio.');

  const boxWanted = new Map<string, number>();   // box id -> boxes of every size together (the stock counts boxes)
  const boxBySize = new Map<string, number>();   // `${box id}|${size}` -> boxes of that size
  const treatWanted = new Map<string, number>();
  for (const it of rawItems) {
    const qty = Number(it.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 500) throw new OrderError(400, 'Há uma quantidade inválida no carrinho.');
    if (it.kind === 'box') {
      const id = String(it.tasting_box_id ?? '');
      if (!UUID.test(id)) throw new OrderError(400, 'Uma das caixas do carrinho não é válida.');
      if (it.box_size != null && !isTreatCount(it.box_size)) throw new OrderError(400, 'Escolha uma caixa de 2, 4 ou 6 doces.');
      const size = toTreatCount(it.box_size);
      boxWanted.set(id, (boxWanted.get(id) ?? 0) + qty);
      boxBySize.set(`${id}|${size}`, (boxBySize.get(`${id}|${size}`) ?? 0) + qty);
    } else {
      const id = String(it.id ?? '');
      if (!UUID.test(id)) throw new OrderError(400, 'Um dos itens do carrinho não é válido.');
      treatWanted.set(id, (treatWanted.get(id) ?? 0) + qty);
    }
  }
  const hasBox = boxWanted.size > 0;

  const fulfillment = hasBox && input.fulfillment === 'pickup' ? 'pickup' : 'delivery';
  const isPickup = fulfillment === 'pickup';
  if (isPickup && !userId) throw new OrderError(401, 'Para retirar, entre na sua conta. O endereço aparece lá.');
  if (!isPickup && address.length < 5) throw new OrderError(400, 'Informe o endereço de entrega.');

  // ---- prices come from the database
  const lines: CreatedOrder['lines'] = [];
  let subtotal = 0;
  const reserved: { id: string; qty: number }[] = [];

  const boxRows: BoxRow[] = [];
  if (hasBox) {
    const { data, error } = await db.from('tasting_boxes').select('*').in('id', [...boxWanted.keys()]);
    if (error) throw new OrderError(500, 'Não conseguimos conferir a caixa agora. Tente de novo.');
    boxRows.push(...((data as BoxRow[]) || []));
  }
  const treatRows: TreatRow[] = [];
  if (treatWanted.size > 0) {
    const { data, error } = await db.from('treats').select('id, name, price, is_available, min_batch_size, batch_multiplier').in('id', [...treatWanted.keys()]);
    if (error) throw new OrderError(500, 'Não conseguimos conferir o cardápio agora. Tente de novo.');
    treatRows.push(...((data as TreatRow[]) || []));
  }

  // ---- delivery day
  const today = brasiliaToday();
  const todayISO = toISODate(today);
  const date = text(input.date, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new OrderError(400, 'Escolha o dia da entrega.');

  if (hasBox) {
    const schedule = await fetchSchedule();
    const selectable = openDatesBetween(schedule.rules, schedule.overrides, toISODate(addDays(today, schedule.leadDays)), toISODate(addDays(today, 14 * 7)));
    if (!selectable.includes(date)) throw new OrderError(409, 'Esse dia de entrega não está mais disponível. Escolha outro no calendário.');

    for (const [id, qty] of boxWanted) {
      const row = boxRows.find(b => b.id === id);
      if (!row || !row.is_active) throw new OrderError(409, 'Essa caixa não está mais à venda.');
      const choosable = inDeliveryWindow(selectable, row, selectable);
      const { state } = saleState(row, choosable, todayISO);
      if (state === 'soldout') throw new OrderError(409, `"${row.title}" esgotou.`);
      if (state === 'soon') throw new OrderError(409, `Os pedidos de "${row.title}" ainda não abriram.`);
      if (state === 'closed') throw new OrderError(409, `Os pedidos de "${row.title}" foram encerrados.`);
      if (!inDeliveryWindow([date], row, selectable).length) throw new OrderError(409, 'Esse dia está fora das entregas desta edição. Escolha outro dia.');
      const left = row.total_quantity > 0 ? row.total_quantity - row.sold_quantity : Infinity;
      if (qty > left) throw new OrderError(409, `Restam só ${left} unidades de "${row.title}".`);
    }
    // Every box is priced by its size (2, 4 or 6 treats) from the settings Dolly edits in /admin/caixas.
    const { prices } = await fetchBoxSizePrices(db);
    for (const [key, qty] of boxBySize) {
      const [id, sizeStr] = key.split('|');
      const row = boxRows.find(b => b.id === id)!;
      const size = Number(sizeStr) as TreatCount;
      const unit = Number(prices[size]);
      if (!(unit > 0)) throw new OrderError(500, 'Preço da caixa inválido.');
      subtotal += unit * qty;
      lines.push({ name: `${row.title} (${sizeText(size)})`, quantity: qty, unit });
    }
  } else if (parseISODate(date) < addDays(today, 3)) {
    throw new OrderError(400, 'Encomendas do Menu de Eventos precisam de pelo menos 3 dias de antecedência.');
  }

  for (const [id, qty] of treatWanted) {
    const row = treatRows.find(t => t.id === id);
    if (!row || !row.is_available) throw new OrderError(409, 'Um dos itens do carrinho saiu do cardápio.');
    const min = row.min_batch_size || 1;
    const step = row.batch_multiplier || 1;
    if (qty < min || (qty - min) % step !== 0) {
      throw new OrderError(400, `"${row.name}": pedido mínimo de ${min}, de ${step} em ${step}.`);
    }
    const unit = Number(row.price);
    if (!(unit >= 0)) throw new OrderError(500, 'Preço inválido.');
    subtotal += unit * qty;
    lines.push({ name: row.name, quantity: qty, unit });
  }

  // ---- delivery fee
  // An unknown zone must never quietly become the first one: DELIVERY_ZONES[0] is Itamambuca, which is
  // free and has no minimum, so falling back to it handed free delivery (and no minimum) to anyone whose
  // zone did not match — a stale delivery_zone saved on an old profile was enough to do it by accident.
  const zone = hasBox && !isPickup ? getZone(input.zoneId) : (getZone(input.zoneId) ?? DELIVERY_ZONES[0]);
  if (!zone) throw new OrderError(400, 'Escolha a sua região de entrega.');
  const boxCount = [...boxWanted.values()].reduce((a, b) => a + b, 0);
  if (hasBox && !isPickup && boxCount < zone.minBoxes) {
    throw new OrderError(400, `O pedido mínimo para esta região é de ${zone.minBoxes} caixas.`);
  }
  const fee = hasBox && !isPickup ? zone.fee : 0;
  subtotal = round2(subtotal);
  const total = round2(subtotal + fee);

  // ---- diet and partner code
  const dietTags = list(input.diet?.tags, 20);
  const dietAllergens = list(input.diet?.allergens, 30);
  const dietNotes = text(input.diet?.notes, 500);
  const dietaryNotes = dietSummary(dietTags, dietAllergens, dietNotes) || null;
  const code = text(input.affiliateCode, 30).toUpperCase();
  const affiliate = /^[A-Z0-9_-]{2,30}$/.test(code) ? { affiliate_code: code } : {};

  const reference = `ORD${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`.substring(0, 25);
  const payment_provider = input.payMethod === 'card' ? 'mercadopago' : input.payMethod === 'paypal' ? 'paypal' : 'pix';
  const itemsSummary = lines.map(l => `${l.quantity}x ${l.name}`).join(', ');

  // ---- keep the box counter honest: reserve first, in one safe step per box
  try {
    for (const [id, qty] of boxWanted) {
      const { data, error } = await db.rpc('reserve_box_stock', { p_box_id: id, p_qty: qty });
      if (error) {
        // Migration 22 not run yet: fall back to the old read-then-write so orders keep working.
        if (/reserve_box_stock/.test(error.message) || error.code === 'PGRST202') {
          const row = boxRows.find(b => b.id === id)!;
          await db.from('tasting_boxes').update({ sold_quantity: row.sold_quantity + qty }).eq('id', id);
          reserved.push({ id, qty });
          continue;
        }
        throw new OrderError(500, 'Não conseguimos reservar a caixa agora. Tente de novo.');
      }
      if (data !== true) throw new OrderError(409, 'Acabou de esgotar. Ajuste a quantidade ou escolha outra caixa.');
      reserved.push({ id, qty });
    }

    // ---- save. The extra columns come from later migrations; fall back so an order is never lost.
    const base = {
      customer_name: name,
      customer_email: email,
      customer_whatsapp: whatsapp,
      delivery_address: isPickup ? 'RETIRADA no home bakery' : address,
      requested_date: date,
      total_price: total,
      pix_transaction_id: reference,
      status: 'PENDING',
      // The orders table requires this column (it was created for the first lead forms).
      order_type: hasBox ? 'CAIXA_DEGUSTACAO' : 'EVENTO',
    };
    const rich = {
      ...base, ...affiliate,
      payment_provider,
      order_kind: hasBox ? 'box' : 'events',
      fulfillment,
      user_id: userId,
      delivery_zone: hasBox && !isPickup ? zone.id : null,
      delivery_fee: fee,
      dietary_notes: dietaryNotes,
      items_summary: itemsSummary,
    };
    let saved = !(await db.from('orders').insert([{ ...rich, diet_tags: dietTags, allergens_avoid: dietAllergens }])).error;
    if (!saved) saved = !(await db.from('orders').insert([rich])).error;
    if (!saved) {
      const plain = await db.from('orders').insert([base]);
      if (plain.error) {
        console.error('createOrder: could not save the order:', plain.error);
        throw new OrderError(500, 'Não conseguimos registrar o pedido agora. Tente de novo em instantes.');
      }
    }
  } catch (e) {
    // Give the boxes back so a failed order does not eat the stock.
    for (const r of reserved) {
      const { error } = await db.rpc('release_box_stock', { p_box_id: r.id, p_qty: r.qty });
      if (error) {
        const { data: row } = await db.from('tasting_boxes').select('sold_quantity').eq('id', r.id).single();
        if (row) await db.from('tasting_boxes').update({ sold_quantity: Math.max(0, row.sold_quantity - r.qty) }).eq('id', r.id);
      }
    }
    throw e;
  }

  return { reference, subtotal, fee, total, lines };
}

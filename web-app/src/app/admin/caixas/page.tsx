'use client';

import React, { useState, useEffect } from 'react';
import HeldBoxes from './HeldBoxes';
import ProductionTally from './ProductionTally';
import PresaleGear from './PresaleGear';
import BoxStock from '../BoxStock';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import BoxItemsEditor from '@/components/BoxItemsEditor';
import { BoxItem, newBoxItem } from '@/lib/allergens';
import { parseBoxItems } from '@/components/BoxItemList';
import { BoxSizePrices, DEFAULT_BOX_PRICES, SIZE_KEYS, TREAT_COUNTS, fetchBoxSizePrices } from '@/lib/boxSizes';
import { uploadPublicImage } from '@/lib/imageUpload';
import { pushTreatDetails } from '@/lib/treatSync';
import { BoxWindowFields, SaleState, deliveryWindowLabel, isPresale, longDay, nextBakeBox, saleState, splitActive } from '@/lib/boxWindow';
import { toISODate } from '@/lib/deliverySchedule';
import { brandAlert, brandConfirm } from '@/lib/brandDialog';
import { formatBatchDate, healBatchDate } from '@/lib/batchDate';
import './caixas.css';

interface TastingBox extends BoxWindowFields {
  id: string;
  title: string;
  description: string;
  image_url: string;
  batch_date_label: string;
  total_quantity: number;
  sold_quantity: number;
  price: number;
  is_active: boolean;
  items?: BoxItem[] | null;
  gallery?: string[] | null;
}

const WINDOW_KEYS = ['delivery_from', 'delivery_until', 'orders_open_from', 'orders_close_on'] as const;

/** Box state in the admin list, in words. */
const SALE_LABEL: Record<SaleState, { text: string; color: string; bg: string }> = {
  open: { text: 'Pedidos abertos', color: '#1e6b3c', bg: '#e6f4ec' },
  soon: { text: 'Pedidos ainda não abriram', color: '#1a5276', bg: '#eaf2f8' },
  closed: { text: 'Pedidos encerrados', color: '#7f8c8d', bg: '#f1f2f6' },
  soldout: { text: 'Esgotada', color: '#c0392b', bg: '#fdecea' },
};

/** The steps of the box editor, one question per screen. */
const STEPS = ['Como vender', 'Doces', 'Nome e fotos', 'Entregas', 'Quantidade', 'Revisar'] as const;

export default function AdminCaixas() {
  const [boxes, setBoxes] = useState<TastingBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  /** 'home' = the boxes on the site and the earlier ones; 'edit' = the step-by-step editor. */
  const [view, setView] = useState<'home' | 'edit'>('home');
  const [step, setStep] = useState(0);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [batchDateLabel, setBatchDateLabel] = useState('');
  const [totalQuantity, setTotalQuantity] = useState(30);
  const [soldQuantity, setSoldQuantity] = useState(0);
  const [price, setPrice] = useState(99);
  const [isActive, setIsActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [items, setItems] = useState<BoxItem[]>([]);
  /** Extra photos of this box for the /caixas hero (migration 24). */
  const [gallery, setGallery] = useState<string[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  /** Prices of the 2 / 4 / 6-treat box: one set for every box and for the subscription (migration 24). */
  const [sizePrices, setSizePrices] = useState<BoxSizePrices>(DEFAULT_BOX_PRICES);
  const [sizePricesInDb, setSizePricesInDb] = useState(true);
  const [sizeSaving, setSizeSaving] = useState('');
  // Delivery window (customers pick a day inside it) and ordering window (migration 21).
  const [deliveryFrom, setDeliveryFrom] = useState('');
  const [deliveryUntil, setDeliveryUntil] = useState('');
  const [ordersOpen, setOrdersOpen] = useState('');
  const [ordersClose, setOrdersClose] = useState('');
  /** How this box is sold (migration 35): 'stock' = already baked, 'presale' = next week's, made to order. */
  const [saleMode, setSaleMode] = useState<'stock' | 'presale'>('stock');
  const pre = saleMode === 'presale';
  const [leadDays, setLeadDays] = useState(2);
  /** After saving a box that is live: offer to tell the waiting list and customers. */
  const [announce, setAnnounce] = useState<{ title: string; treats: string; quantity: number } | null>(null);
  /** What is missing on this step, said in the footer next to the button. */
  const [formProblem, setFormProblem] = useState('');

  useEffect(() => {
    fetchBoxes();
    supabase.from('site_settings').select('value').eq('key', 'delivery_lead_days').maybeSingle()
      .then(({ data }) => { if (data) setLeadDays(Number(data.value) || 0); });
    fetchBoxSizePrices(supabase).then(r => { setSizePrices(r.prices); setSizePricesInDb(r.fromDb); });
  }, []);

  const saveSizePrices = async () => {
    setSizeSaving('Salvando…');
    for (const size of TREAT_COUNTS) {
      const value = Number(sizePrices[size]);
      if (!(value > 0)) { setSizeSaving(''); brandAlert(`Informe o preço da caixa de ${size} doces.`); return; }
      const { data, error } = await supabase.from('site_settings')
        .update({ value, updated_at: new Date().toISOString() }).eq('key', SIZE_KEYS[size]).select('key');
      if (error || !data?.length) {
        setSizeSaving('');
        setSizePricesInDb(false);
        brandAlert('Não foi possível salvar os preços. Rode a migration_24_box_sizes_and_names.sql no Supabase primeiro.');
        return;
      }
    }
    setSizePricesInDb(true);
    setSizeSaving('Preços salvos ✓');
    setTimeout(() => setSizeSaving(''), 2500);
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const files = Array.from(input.files || []);
    if (files.length === 0) return;
    setGalleryUploading(true);
    try {
      const urls: string[] = [];
      for (const f of files) urls.push(await uploadPublicImage(f, 'boxes'));
      setGallery(g => [...g, ...urls]);
    } catch (error) {
      brandAlert('Não foi possível enviar uma das fotos. Tente novamente.');
      console.error(error);
    } finally {
      setGalleryUploading(false);
      input.value = '';
    }
  };

  /** The box was typed as one numbered paragraph: turn each line into a treat, so each can get its name. */
  const listInDescription = items.length === 0 ? parseBoxItems(description) : null;
  const importFromDescription = () => {
    if (!listInDescription) return;
    setItems(listInDescription.items.map(line => ({
      ...newBoxItem(), description: line,
      add_to_menu: true, menu_price: 0, menu_min_batch: 10, menu_batch_multiplier: 10,
    })));
    setDescription(listInDescription.intro);
  };

  const fetchBoxes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasting_boxes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    else setBoxes(data || []);
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) return;
      setImageUrl(await uploadPublicImage(e.target.files[0], 'boxes'));
    } catch (error) {
      brandAlert('Error uploading image!');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setImageUrl('');
    setBatchDateLabel('');
    setTotalQuantity(30);
    setSoldQuantity(0);
    setPrice(99);
    setIsActive(false);
    setItems([]);
    setGallery([]);
    setDeliveryFrom('');
    setDeliveryUntil('');
    setOrdersOpen('');
    setOrdersClose('');
    setSaleMode('stock');
  };

  const handleEdit = (box: TastingBox) => {
    setEditingId(box.id);
    setTitle(box.title);
    setDescription(box.description);
    setImageUrl(box.image_url);
    setBatchDateLabel(healBatchDate(box.batch_date_label));
    setTotalQuantity(box.total_quantity);
    setSoldQuantity(box.sold_quantity);
    setPrice(box.price);
    setIsActive(box.is_active);
    setItems(box.items || []);
    setGallery(Array.isArray(box.gallery) ? box.gallery : []);
    setDeliveryFrom(healBatchDate(box.delivery_from || ''));
    setDeliveryUntil(healBatchDate(box.delivery_until || ''));
    setOrdersOpen(healBatchDate(box.orders_open_from || ''));
    setOrdersClose(healBatchDate(box.orders_close_on || ''));
    setSaleMode(isPresale(box) ? 'presale' : 'stock');
    // Editing opens on the summary: every part is one tap away from there.
    setFormProblem('');
    setStep(STEPS.length - 1);
    setView('edit');
    window.scrollTo({ top: 0 });
  };

  /**
   * The quick stock buttons wrote new numbers. Move the list to match, and — if that same box is open
   * in the form — its two quantity fields too, so saving the form does not put the old numbers back.
   */
  const applyStock = (id: string, total: number, sold: number) => {
    setBoxes(list => list.map(b => (b.id === id ? { ...b, total_quantity: total, sold_quantity: sold } : b)));
    if (editingId === id) { setTotalQuantity(total); setSoldQuantity(sold); }
  };

  const hint = (msg: string) =>
    /items|ingredients|contains|emoji/.test(msg) ? ' — Rode as migrations 13 e 14 no Supabase primeiro.' : '';

  const handleSubmit = async () => {
    setFormProblem('');
    const windowProblem =
      deliveryFrom && deliveryUntil && deliveryUntil < deliveryFrom ? 'O último dia de entrega vem antes do primeiro.'
      : pre && (!deliveryFrom || !deliveryUntil) ? 'Na pré-venda, diga o primeiro e o último dia de entrega: só esses dias são oferecidos.'
      : pre && !ordersClose ? 'Na pré-venda, diga até quando as encomendas ficam abertas (o dia em que você precisa da contagem para assar).'
      : pre && ordersClose >= deliveryFrom ? 'As encomendas precisam fechar antes do primeiro dia de entrega.'
      : '';
    if (windowProblem) { brandAlert(windowProblem); return; }
    const unnamed = items.findIndex(i => !i.name.trim() && (i.description.trim() || i.image_url || i.ingredients.length));
    if (unnamed >= 0) { brandAlert(`O doce ${unnamed + 1} ainda não tem nome. Dê um nome divertido a ele (aparece numa caixinha no site).`); return; }
    setSaving(true);
    const hiddenInMenu: string[] = [];

    // 1. Treats ticked "also add to the Menu de Eventos" are created there first, so the box can point at them.
    const cleanItems: BoxItem[] = [];
    for (const it of items.filter(i => i.name.trim())) {
      let treatId = it.treat_id || null;
      if (it.add_to_menu && !treatId) {
        // No price yet: it still goes to the Menu de Eventos, hidden until Dolly prices it there.
        const priced = !!it.menu_price && it.menu_price > 0;
        if (!priced) hiddenInMenu.push(it.name);
        const { data, error } = await supabase.from('treats').insert([{
          name: it.name, description: it.description, image_url: it.image_url, emoji: it.emoji,
          ingredients: it.ingredients, contains: it.contains, may_contain: it.may_contain,
          price: priced ? it.menu_price : 0, min_batch_size: it.menu_min_batch || 1, batch_multiplier: it.menu_batch_multiplier || 1,
          is_available: priced,
        }]).select('id').single();
        if (error || !data) {
          brandAlert(`Erro ao adicionar "${it.name}" ao Menu de Eventos: ${error?.message ?? ''}${hint(error?.message ?? '')}`);
          setSaving(false);
          return;
        }
        treatId = data.id;
      }
      // Editor-only fields never go into the stored box.
      const { add_to_menu, menu_price, menu_min_batch, menu_batch_multiplier, ...stored } = it;
      void add_to_menu; void menu_price; void menu_min_batch; void menu_batch_multiplier;
      cleanItems.push({ ...stored, treat_id: treatId });
    }

    // 2. One ready box and one pre-sale can be live together: switching this one on takes down the
    //    other box of the SAME kind only. (Before migration 35 there are no kinds: all others go down.)
    if (isActive) {
      const others = supabase.from('tasting_boxes').update({ is_active: false }).neq('id', editingId || '00000000-0000-0000-0000-000000000000');
      const { error: modeErr } = await others.eq('sale_mode', saleMode);
      if (modeErr) {
        if (pre) { brandAlert('Para usar a pré-venda, rode a migration_35_box_presale.sql no Supabase primeiro.'); setSaving(false); return; }
        await supabase.from('tasting_boxes').update({ is_active: false }).neq('id', editingId || '00000000-0000-0000-0000-000000000000');
      }
    }

    const payload = {
      title,
      // The treats build the description; the paragraph is just an optional intro.
      description: description.trim() || cleanItems.map(i => `${i.emoji} ${i.name}`).join(' · '),
      items: cleanItems,
      gallery,
      image_url: imageUrl,
      // The edition's date on the site: the first delivery day unless one was set before.
      batch_date_label: batchDateLabel || deliveryFrom || toISODate(new Date()),
      total_quantity: totalQuantity,
      sold_quantity: soldQuantity,
      // The 4-treat price, kept on the box for anything that still reads one price.
      price: sizePrices[4] || price,
      is_active: isActive,
      delivery_from: deliveryFrom || null,
      delivery_until: deliveryUntil || null,
      orders_open_from: ordersOpen || null,
      // The ready box never closes by date (it sells until it runs out); the pre-sale closes on its deadline.
      orders_close_on: pre ? (ordersClose || null) : null,
      sale_mode: saleMode,
    };

    const save = (body: Record<string, unknown>) => editingId
      ? supabase.from('tasting_boxes').update(body).eq('id', editingId)
      : supabase.from('tasting_boxes').insert([body]);
    let { error } = await save(payload);
    if (error && /gallery/.test(error.message)) {
      // Migration 24 not run yet: save without the extra photos.
      const rest: Record<string, unknown> = { ...payload };
      delete rest.gallery;
      ({ error } = await save(rest));
      if (!error && gallery.length) brandAlert('Caixa salva, mas sem as fotos extras. Rode a migration_24_box_sizes_and_names.sql no Supabase e salve de novo.');
    }
    if (error && /sale_mode/.test(error.message) && !pre) {
      // Migration 35 not run yet: a ready box saves exactly as before.
      const rest: Record<string, unknown> = { ...payload };
      delete rest.sale_mode;
      ({ error } = await save(rest));
    }
    if (error && /delivery_from|delivery_until|orders_open_from|orders_close_on/.test(error.message)) {
      // Migration 21 not run yet: save everything else, and say what's missing.
      const rest: Record<string, unknown> = { ...payload };
      WINDOW_KEYS.forEach(k => delete rest[k]);
      ({ error } = await save(rest));
      if (!error) brandAlert('Caixa salva, mas sem as janelas de entrega e de pedidos. Rode a migration_21_box_windows.sql no Supabase e salve de novo.');
    }
    if (error) {
      brandAlert(/sale_mode/.test(error.message)
        ? 'Para salvar uma pré-venda, rode a migration_35_box_presale.sql no Supabase primeiro.'
        : `Erro ao salvar: ${error.message}${hint(error.message)}`);
      setSaving(false);
      return;
    }

    // 3. Treats shared with the Menu de Eventos: push the latest details to the menu and to every other box using them.
    for (const it of cleanItems) {
      if (!it.treat_id) continue;
      const res = await pushTreatDetails(it.treat_id, {
        name: it.name, description: it.description, image_url: it.image_url, emoji: it.emoji,
        ingredients: it.ingredients, contains: it.contains, may_contain: it.may_contain,
        sugars: it.sugars ?? null, caffeine: it.caffeine ?? null,
      });
      if (res.error) console.error('Sync to menu failed:', res.error);
    }

    setSaving(false);
    if (hiddenInMenu.length) {
      const one = hiddenInMenu.length === 1;
      brandAlert(`${hiddenInMenu.map(n => `"${n}"`).join(', ')} ${one ? 'entrou' : 'entraram'} no Menu de Eventos ${one ? 'escondido' : 'escondidos'}, porque ainda não ${one ? 'tem' : 'têm'} preço. Coloque o preço em Menu de Eventos para ${one ? 'ele aparecer' : 'eles aparecerem'}.`);
    }
    setAnnounce(isActive ? { title, treats: cleanItems.map(i => `${i.emoji} ${i.name}`).join('\n'), quantity: totalQuantity } : null);
    resetForm();
    setView('home');
    window.scrollTo({ top: 0 });
    fetchBoxes();
  };

  const handleDelete = async (id: string) => {
    if (!(await brandConfirm('Tem certeza que deseja deletar este lote?', { danger: true, confirmLabel: 'Sim, remover' }))) return;
    const { error } = await supabase.from('tasting_boxes').delete().eq('id', id);
    if (error) brandAlert('Erro ao deletar: ' + error.message);
    else fetchBoxes();
  };

  const live = splitActive(boxes.filter(b => b.is_active));
  const pastBoxes = boxes.filter(b => !b.is_active);

  /** A brand-new box, or a copy of an earlier one to start from (its treats, name and photos; new dates and stock). */
  const startNew = (base?: TastingBox) => {
    resetForm();
    if (base) {
      setTitle(base.title);
      setDescription(base.description || '');
      setImageUrl(base.image_url || '');
      setItems((base.items || []).map(i => ({ ...i })));
      setGallery(Array.isArray(base.gallery) ? base.gallery : []);
      setSaleMode(isPresale(base) ? 'presale' : 'stock');
    }
    setIsActive(true);
    setFormProblem('');
    setStep(0);
    setView('edit');
    window.scrollTo({ top: 0 });
  };

  const stepProblem = (s: number): string => {
    if (s === 2 && !title.trim()) return 'Dê um nome para a caixa.';
    if (s === 3) {
      if (deliveryFrom && deliveryUntil && deliveryUntil < deliveryFrom) return 'O último dia de entrega vem antes do primeiro.';
      if (pre && (!deliveryFrom || !deliveryUntil)) return 'Escolha o primeiro e o último dia de entrega da fornada.';
      if (pre && !ordersClose) return 'Escolha até quando as encomendas ficam abertas.';
      if (pre && ordersClose >= deliveryFrom) return 'As encomendas precisam fechar antes do primeiro dia de entrega.';
    }
    return '';
  };
  const next = () => {
    const p = stepProblem(step);
    if (p) { setFormProblem(p); return; }
    setFormProblem('');
    setStep(s => Math.min(STEPS.length - 1, s + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const back = () => { setFormProblem(''); setStep(s => Math.max(0, s - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const goTo = (s: number) => { setFormProblem(''); setStep(s); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const publish = () => {
    for (let s = 0; s < STEPS.length; s++) {
      const p = stepProblem(s);
      if (p) { setStep(s); setFormProblem(p); return; }
    }
    handleSubmit();
  };

  const treatsNamed = items.filter(i => i.name.trim());
  const windowText = deliveryWindowLabel({ total_quantity: 0, sold_quantity: 0, delivery_from: deliveryFrom || null, delivery_until: deliveryUntil || null });

  // ═══════════════════════════════ THE STEP-BY-STEP EDITOR ═══════════════════════════════
  if (view === 'edit') {
    return (
      <div className="bx">
        <div className="bx-flow">
          <div className="bx-flow__top">
            <span style={{ fontWeight: 800 }}>{editingId ? 'Editando a caixa' : 'Nova caixa'}</span>
            <button type="button" className="bx-btn bx-btn--ghost" onClick={async () => {
              if (await brandConfirm('Sair sem salvar? O que você mudou aqui se perde.', { confirmLabel: 'Sair sem salvar' })) { resetForm(); setView('home'); }
            }}>✕ Sair</button>
          </div>
          <div className="bx-progress" aria-hidden>
            {STEPS.map((_, i) => <span key={i} className={i <= step ? 'is-done' : ''}><i /></span>)}
          </div>

          <div className="bx-step" key={step}>
            <p className="bx-step__kicker">Passo {step + 1} de {STEPS.length}</p>

            {step === 0 && (
              <>
                <h1 className="bx-step__title">Como você vai vender esta caixa?</h1>
                <p className="bx-step__lead">Dá para ter uma de cada no ar ao mesmo tempo.</p>
                <div className="bx-choices">
                  {([
                    ['stock', '🧁', 'Pronta entrega', 'As caixas já estão feitas. Vende até acabar, e as entregas seguem pelo calendário enquanto sobrar caixa.'],
                    ['presale', '🗓️', 'Pré-venda', 'A caixa da próxima semana. O cliente encomenda e paga antes, e você assa só o que foi pedido.'],
                  ] as const).map(([m, icon, t, d]) => (
                    <button key={m} type="button" className={`bx-choice${saleMode === m ? ' is-on' : ''}`} onClick={() => setSaleMode(m)} aria-pressed={saleMode === m}>
                      <span className="bx-choice__icon">{icon}</span>
                      <span className="bx-choice__title">{t}</span>
                      <span className="bx-choice__text">{d}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h1 className="bx-step__title">Quais doces vão na caixa?</h1>
                <p className="bx-step__lead">Um doce de cada vez, com nome, foto e o que ele leva. Ou repita um que já fez antes.</p>
                {listInDescription && (
                  <div className="bx-card" style={{ background: '#fff8e6', borderColor: '#f0d09a', marginBottom: '1rem' }}>
                    <p style={{ margin: '0 0 0.7rem', color: '#8a5a00', lineHeight: 1.5 }}>
                      Os {listInDescription.items.length} doces desta caixa estão escritos como uma lista no texto. Separe em doces e dê um nome divertido a cada um.
                    </p>
                    <button type="button" className="bx-btn bx-btn--gold" onClick={importFromDescription}>✨ Separar em {listInDescription.items.length} doces</button>
                  </div>
                )}
                <BoxItemsEditor key={items.length === 0 ? 'empty' : 'filled'} items={items} onChange={setItems} />
                <details style={{ marginTop: '1.5rem' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Frase de abertura (opcional)</summary>
                  <textarea className="bx-input" style={{ marginTop: '0.75rem' }} rows={2} value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="Uma frase sobre o tema desta edição. Se ficar vazio, usamos a lista dos doces." />
                </details>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="bx-step__title">Agora, um nome e uma foto</h1>
                <p className="bx-step__lead">É o que as pessoas veem primeiro no site. Uma foto bonita da caixa aberta vende muito.</p>
                <label className="bx-field" style={{ marginBottom: '1.5rem' }}>
                  <span>Nome da caixa</span>
                  <input className="bx-input bx-input--big" value={title} onChange={e => setTitle(e.target.value)} placeholder="Chegada da Primavera: Sensações Amarelas" maxLength={90} />
                  <small>Dica: o que vem depois dos dois-pontos aparece em dourado no site.</small>
                </label>
                <label className="bx-drop">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {imageUrl && <img src={imageUrl} alt="" />}
                  {!imageUrl && <span style={{ fontSize: '2.6rem' }}>📷</span>}
                  <span className="bx-drop__label">{uploading ? 'Enviando…' : imageUrl ? 'Trocar a foto principal' : 'Escolher a foto principal'}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} style={{ display: 'none' }} />
                </label>
                <p style={{ fontWeight: 700, margin: '1.5rem 0 0' }}>Mais fotos desta caixa <span style={{ fontWeight: 400, color: '#6a6a6a' }}>(aparecem nos cartões do topo da página)</span></p>
                <div className="bx-thumbs">
                  {gallery.map(src => (
                    <div key={src} className="bx-thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" />
                      <button type="button" aria-label="Remover foto" onClick={() => setGallery(g => g.filter(x => x !== src))}>✕</button>
                    </div>
                  ))}
                  <label className="bx-thumb bx-thumb--add" aria-label="Adicionar fotos">
                    {galleryUploading ? '…' : '+'}
                    <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} disabled={galleryUploading} style={{ display: 'none' }} />
                  </label>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h1 className="bx-step__title">{pre ? 'Quando a fornada sai?' : 'Quando ela chega?'}</h1>
                <p className="bx-step__lead">
                  {pre
                    ? 'Os dias de entrega das encomendas, e o último dia para encomendar (quando você precisa da contagem para assar).'
                    : 'Os dias em que esta leva está planejada para sair. Pode deixar em branco: aí vale qualquer dia aberto do calendário.'}
                </p>
                <div className="bx-dates">
                  <label className="bx-field"><span>Primeiro dia de entrega</span>
                    <input type="date" className="bx-input" value={deliveryFrom} onChange={e => setDeliveryFrom(healBatchDate(e.target.value))} />
                  </label>
                  <label className="bx-field"><span>Último dia de entrega</span>
                    <input type="date" className="bx-input" value={deliveryUntil} min={deliveryFrom || undefined} onChange={e => setDeliveryUntil(healBatchDate(e.target.value))} />
                  </label>
                  {pre && (
                    <label className="bx-field"><span>Encomendas até</span>
                      <input type="date" className="bx-input" value={ordersClose} max={deliveryFrom || undefined} onChange={e => setOrdersClose(healBatchDate(e.target.value))} />
                    </label>
                  )}
                </div>
                <details style={{ marginTop: '1.25rem' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Deixar pronta para abrir num dia futuro</summary>
                  <label className="bx-field" style={{ marginTop: '0.75rem', maxWidth: '260px' }}><span>Pedidos abrem em</span>
                    <input type="date" className="bx-input" value={ordersOpen} onChange={e => setOrdersOpen(healBatchDate(e.target.value))} />
                    <small>Vazio = abre assim que você publicar.</small>
                  </label>
                </details>
                <p className="bx-say">
                  👀 O cliente vai ver: {pre ? <><strong>pré-venda</strong>, </> : ''}
                  {windowText ? <>entregas <strong>{windowText}</strong>. </> : <>qualquer dia aberto do calendário. </>}
                  {pre && ordersClose ? <>Encomendas até <strong>{longDay(ordersClose)}</strong>. </> : ''}
                  {!pre && <>Segue à venda até acabar; se a data passar e sobrar caixa, as entregas continuam.</>}
                </p>
              </>
            )}

            {step === 4 && (
              <>
                <h1 className="bx-step__title">{pre ? 'Quantas cabem nesta fornada?' : 'Quantas caixas você fez?'}</h1>
                <p className="bx-step__lead">
                  {pre ? 'Quando as encomendas chegarem nesse número, a pré-venda fecha sozinha. Sem limite = você assa tudo o que pedirem.' : 'O site conta sozinho a cada pedido e mostra quantas restam.'}
                </p>
                <div className="bx-card">
                  <div className="bx-counter">
                    <div className="bx-counter__label">{pre ? 'Limite de encomendas' : 'Caixas feitas'}<small>Cada caixa conta como uma, seja de 2, 4 ou 6 doces.</small></div>
                    <div className="bx-counter__ctl">
                      <button type="button" className="bx-round" onClick={() => setTotalQuantity(q => Math.max(0, q - 1))} disabled={totalQuantity <= 0} aria-label="Menos">−</button>
                      <span className="bx-counter__value">{pre && totalQuantity === 0 ? '∞' : totalQuantity}</span>
                      <button type="button" className="bx-round" onClick={() => setTotalQuantity(q => q + 1)} aria-label="Mais">+</button>
                    </div>
                  </div>
                  {pre && (
                    <div className="bx-counter">
                      <div className="bx-counter__label">Sem limite</div>
                      <button type="button" className={`bx-switch${totalQuantity === 0 ? ' is-on' : ''}`} style={{ width: 'auto', padding: '0.4rem' }}
                        onClick={() => setTotalQuantity(q => (q === 0 ? 20 : 0))} aria-pressed={totalQuantity === 0}>
                        <span className="bx-switch__knob" />
                      </button>
                    </div>
                  )}
                  {editingId && (
                    <div className="bx-counter">
                      <div className="bx-counter__label">{pre ? 'Encomendas feitas' : 'Já vendidas'}<small>Contado pelos pedidos. Mude só se vendeu por fora ou houve cancelamento.</small></div>
                      <div className="bx-counter__ctl">
                        <button type="button" className="bx-round" onClick={() => setSoldQuantity(q => Math.max(0, q - 1))} disabled={soldQuantity <= 0} aria-label="Menos">−</button>
                        <span className="bx-counter__value">{soldQuantity}</span>
                        <button type="button" className="bx-round" onClick={() => setSoldQuantity(q => q + 1)} aria-label="Mais">+</button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <h1 className="bx-step__title">{editingId ? 'Tudo certo?' : 'Confira e publique'}</h1>
                <p className="bx-step__lead">Toque em “Mudar” para voltar em qualquer parte.</p>
                <div className="bx-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {imageUrl ? <img src={imageUrl} alt="" /> : <span className="bx-preview__ph">📦</span>}
                  <div style={{ minWidth: 0 }}>
                    <span className="bx-chip" style={{ background: pre ? '#f3e8f8' : '#fff5d6', color: pre ? '#7d3c98' : '#8a6d00' }}>{pre ? '🗓️ Pré-venda' : '🧁 Pronta entrega'}</span>
                    <p style={{ fontWeight: 800, fontSize: '1.25rem', margin: '0.4rem 0 0.2rem', overflowWrap: 'anywhere' }}>{title || 'Sem nome'}</p>
                    <p style={{ color: '#6a6a6a', margin: 0 }}>{treatsNamed.map(i => `${i.emoji} ${i.name}`).join(' · ') || 'Nenhum doce ainda'}</p>
                  </div>
                </div>
                <div className="bx-review">
                  {[
                    { s: 0, t: 'Como vender', v: pre ? 'Pré-venda (feita sob encomenda)' : 'Pronta entrega (já feitas)' },
                    { s: 1, t: 'Doces', v: `${treatsNamed.length} ${treatsNamed.length === 1 ? 'doce' : 'doces'}` },
                    { s: 2, t: 'Nome e fotos', v: `${title || '—'} · ${(imageUrl ? 1 : 0) + gallery.length || 'sem'} foto${(imageUrl ? 1 : 0) + gallery.length === 1 ? '' : 's'}` },
                    { s: 3, t: 'Entregas', v: `${windowText || 'qualquer dia aberto do calendário'}${pre && ordersClose ? ` · encomendas até ${longDay(ordersClose)}` : ''}${ordersOpen ? ` · abre ${longDay(ordersOpen)}` : ''}` },
                    { s: 4, t: pre ? 'Limite' : 'Quantidade', v: pre && totalQuantity === 0 ? 'sem limite' : `${totalQuantity} caixas${editingId ? ` · ${soldQuantity} ${pre ? 'encomendadas' : 'vendidas'}` : ''}` },
                  ].map(r => (
                    <div key={r.s} className="bx-review__row">
                      <div style={{ minWidth: 0 }}><strong>{r.t}</strong><span>{r.v}</span></div>
                      <button type="button" className="bx-link" onClick={() => goTo(r.s)}>Mudar</button>
                    </div>
                  ))}
                </div>
                <button type="button" className={`bx-switch${isActive ? ' is-on' : ''}`} style={{ marginTop: '1.25rem' }} onClick={() => setIsActive(a => !a)} aria-pressed={isActive}>
                  <span>
                    <strong style={{ display: 'block', fontSize: '1.05rem' }}>{isActive ? 'No site' : 'Guardada, fora do site'}</strong>
                    <span style={{ color: '#6a6a6a', fontSize: '0.9rem' }}>
                      {isActive
                        ? `Aparece no site ao salvar.${pre ? (live.presale && live.presale.id !== editingId ? ` A pré-venda “${live.presale.title}” sai do site.` : '') : (live.stock && live.stock.id !== editingId ? ` A caixa “${live.stock.title}” sai do site.` : '')}`
                        : 'Fica salva aqui para você publicar depois.'}
                    </span>
                  </span>
                  <span className="bx-switch__knob" />
                </button>
              </>
            )}
          </div>

          <div className="bx-footer">
            {step > 0 ? <button type="button" className="bx-link" onClick={back}>← Voltar</button> : <span />}
            {formProblem && <span className="bx-footer__msg" role="alert">{formProblem}</span>}
            {step < STEPS.length - 1 ? (
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                {editingId && <button type="button" className="bx-btn bx-btn--ghost" onClick={publish} disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</button>}
                <button type="button" className="bx-btn bx-btn--dark" onClick={next}>Avançar</button>
              </div>
            ) : (
              <button type="button" className="bx-btn bx-btn--gold" onClick={publish} disabled={saving}>
                {saving ? 'Salvando…' : editingId ? 'Salvar mudanças' : isActive ? '🚀 Publicar no site' : 'Salvar caixa'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════ HOME: WHAT IS ON THE SITE ═══════════════════════════════
  const listing = (box: TastingBox) => {
    const st = saleState(box, null);
    const presale = isPresale(box);
    const limited = box.total_quantity > 0;
    const left = Math.max(0, box.total_quantity - box.sold_quantity);
    const lbl = SALE_LABEL[st.state];
    const win = deliveryWindowLabel(box);
    return (
      <article className="bx-listing" key={box.id}>
        <div className="bx-listing__photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {box.image_url ? <img src={box.image_url} alt="" /> : <div style={{ display: 'grid', placeItems: 'center', height: '100%', fontSize: '3rem' }}>📦</div>}
          <span className="bx-listing__badge">{presale ? '🗓️ Pré-venda' : '🧁 Pronta entrega'}</span>
        </div>
        <div className="bx-listing__body">
          <span className="bx-chip" style={{ background: lbl.bg, color: lbl.color, justifySelf: 'start' }}>● {lbl.text}</span>
          <h3 className="bx-listing__title">{box.title}</h3>
          <div className="bx-listing__meta">
            <span>🚚 {win ? `Entregas ${win}` : 'Qualquer dia aberto'}</span>
            {presale && box.orders_close_on && <span>⏳ Encomendas até {longDay(box.orders_close_on)}</span>}
            <span>🍫 {(box.items || []).length} doces</span>
          </div>
          {limited ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: '0.4rem' }}>
                <span>{presale ? `${box.sold_quantity} encomendas` : `${left} de ${box.total_quantity} à venda`}</span>
                <span style={{ color: '#6a6a6a' }}>{presale ? `limite ${box.total_quantity}` : `${box.sold_quantity} vendidas`}</span>
              </div>
              <div className="bx-meter"><span style={{ width: `${Math.min(100, (box.sold_quantity / box.total_quantity) * 100)}%` }} /></div>
            </div>
          ) : (
            <p style={{ margin: 0, fontWeight: 700 }}>{box.sold_quantity} {presale ? 'encomendas' : 'vendidas'} · sem limite</p>
          )}
          <div className="bx-listing__actions">
            <button type="button" className="bx-btn bx-btn--dark" onClick={() => handleEdit(box)}>✏️ Editar</button>
            <a className="bx-btn bx-btn--ghost" href={presale ? '/caixas?edicao=pre' : '/caixas?edicao=pronta'} target="_blank" rel="noopener noreferrer">Ver no site ↗</a>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="bx">
      <div className="bx-head">
        <div>
          <h1 className="bx-h1">Suas caixas</h1>
          <p className="bx-sub">O que está no site agora, e tudo o que você já fez.</p>
        </div>
        <button type="button" className="bx-btn bx-btn--dark" onClick={() => startNew()}>＋ Nova caixa</button>
      </div>

      {announce && (
        <div role="status" className="bx-banner bx-banner--ok">
          <div style={{ lineHeight: 1.6 }}>
            <strong>🎉 Caixa salva e no ar.</strong><br />
            Quem está na fila de espera e os clientes que querem saber das caixas ainda não foram avisados.
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <Link className="bx-btn bx-btn--gold" href={`/admin/emails?campaign=box-live&title=${encodeURIComponent(announce.title)}&treats=${encodeURIComponent(announce.treats)}&quantity=${announce.quantity}`}>
              📧 Avisar por e-mail
            </Link>
            <button type="button" className="bx-btn bx-btn--ghost" onClick={() => setAnnounce(null)}>Agora não</button>
          </div>
        </div>
      )}

      {loading ? <p>Carregando…</p> : (live.stock || live.presale) ? (
        <div className="bx-live">
          {live.stock && listing(live.stock)}
          {live.stock && <BoxStock box={live.stock} onChanged={applyStock} />}
          {live.presale && listing(live.presale)}
          {live.presale && <PresaleGear presale={live.presale} stock={live.stock} onChanged={fetchBoxes} />}
        </div>
      ) : (
        <div className="bx-empty">
          <p className="bx-empty__icon">📦</p>
          <h2 style={{ margin: '0 0 0.4rem', fontWeight: 800 }}>Nenhuma caixa no site agora</h2>
          <p style={{ color: '#6a6a6a', margin: '0 0 1.25rem' }}>Crie uma nova, ou repita uma das anteriores aqui embaixo.</p>
          <button type="button" className="bx-btn bx-btn--dark" onClick={() => startNew()}>＋ Nova caixa</button>
        </div>
      )}

      {!live.presale && live.stock && (
        <button type="button" className="bx-card" onClick={() => { startNew(); setSaleMode('presale'); }}
          style={{ marginTop: '1rem', width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', gap: '1rem', alignItems: 'center', borderStyle: 'dashed' }}>
          <span style={{ fontSize: '2rem' }}>🗓️</span>
          <span><strong style={{ display: 'block' }}>Abrir a pré-venda da próxima semana</strong>
            <span style={{ color: '#6a6a6a' }}>Venda antes de assar e faça só o que foi encomendado.</span></span>
        </button>
      )}

      <ProductionTally box={nextBakeBox(boxes.filter(b => b.is_active))} />
      {boxes.filter(b => b.is_active).map(b => <HeldBoxes key={b.id} box={b} onReleased={fetchBoxes} />)}

      <details className="bx-card" style={{ marginTop: '1.5rem' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 800, fontSize: '1.05rem' }}>💰 Preços das caixas <span style={{ fontWeight: 400, color: '#6a6a6a' }}>· {TREAT_COUNTS.map(n => `${n} doces R$ ${sizePrices[n]}`).join(' · ')}</span></summary>
        <p style={{ color: '#6a6a6a', lineHeight: 1.6, margin: '0.9rem 0' }}>Valem para todas as caixas e para a assinatura (cada plano dá o mesmo desconto de sempre em cada tamanho).</p>
        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', maxWidth: '520px' }}>
          {TREAT_COUNTS.map(size => (
            <label key={size} className="bx-field"><span>{size} doces</span>
              <input className="bx-input" type="number" step="0.01" min="1" value={sizePrices[size] || ''} onChange={e => setSizePrices(p => ({ ...p, [size]: Number(e.target.value) }))} />
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.9rem', flexWrap: 'wrap' }}>
          <button type="button" className="bx-btn bx-btn--dark" onClick={saveSizePrices}>Salvar preços</button>
          {sizeSaving && <span style={{ color: '#1e6b3c', fontWeight: 700 }}>{sizeSaving}</span>}
          {!sizePricesInDb && <span style={{ color: '#8a5a00', fontSize: '0.85rem' }}>Para mudar aqui, rode a migration_24 no Supabase.</span>}
        </div>
      </details>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap' }}>
        <h2 className="bx-h2">Caixas anteriores</h2>
        <Link href="/admin/waitlist" style={{ color: '#222', fontWeight: 700 }}>Fila de espera →</Link>
      </div>
      {pastBoxes.length === 0 ? <p style={{ color: '#6a6a6a' }}>As caixas que saírem do site aparecem aqui, prontas para repetir.</p> : (
        <div className="bx-grid">
          {pastBoxes.map(box => (
            <div key={box.id} className="bx-tile">
              <button type="button" className="bx-tile__photo" onClick={() => startNew(box)} title="Repetir esta caixa" style={{ border: 0, padding: 0, cursor: 'pointer' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {box.image_url ? <img src={box.image_url} alt="" loading="lazy" /> : <span style={{ fontSize: '2.5rem' }}>📦</span>}
              </button>
              <p className="bx-tile__title">{box.title}</p>
              <p className="bx-tile__meta">{formatBatchDate(box.batch_date_label) || '—'} · {box.sold_quantity}{box.total_quantity > 0 ? ` de ${box.total_quantity}` : ''} vendidas</p>
              <div className="bx-tile__actions">
                <button type="button" className="bx-link" onClick={() => startNew(box)}>↻ Repetir</button>
                <button type="button" className="bx-link" onClick={() => handleEdit(box)}>Editar</button>
                <button type="button" className="bx-link bx-link--danger" onClick={() => handleDelete(box.id)}>Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

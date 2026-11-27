'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { brandConfirm } from '@/lib/brandDialog';
import { fmtBRL, textOf, type JournalCategory, type JournalRecipe } from '@/lib/journal/journal';

const slugify = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' };
const cell: React.CSSProperties = { padding: '0.55rem 0.5rem', borderBottom: '1px solid #eee', textAlign: 'left', verticalAlign: 'top' };

/* ───────────────────────── Categories ───────────────────────── */

export function Categories({ cats, onChange }: { cats: JournalCategory[]; onChange: () => void }) {
  const [list, setList] = useState(cats);
  const [msg, setMsg] = useState('');
  const [add, setAdd] = useState({ pt: '', en: '', kind: 'tema' as 'tema' | 'dieta' });
  useEffect(() => setList(cats), [cats]);

  const save = async (c: JournalCategory) => {
    const { error } = await supabase.from('journal_categories').update({ name: c.name, kind: c.kind, sort: c.sort }).eq('slug', c.slug);
    setMsg(error ? `Não salvou: ${error.message}` : `✓ “${c.name.pt}” salva.`);
    if (!error) onChange();
  };
  const create = async () => {
    const slug = slugify(add.pt);
    if (!slug) return;
    if (/gl[uú]ten|a[cç][uú]car|sugar/i.test(`${add.pt} ${add.en}`)) { setMsg('✋ Nada de “sem glúten” ou “sem açúcar”: use “Sem trigo” ou “SOS-free”.'); return; }
    const sort = Math.max(0, ...list.map(c => c.sort)) + 10;
    const { error } = await supabase.from('journal_categories').insert([{ slug, kind: add.kind, name: { pt: add.pt.trim(), en: add.en.trim() || add.pt.trim() }, sort }]);
    setMsg(error ? `Não criou: ${error.message}` : `✓ “${add.pt}” criada.`);
    if (!error) { setAdd({ pt: '', en: '', kind: 'tema' }); onChange(); }
  };
  const remove = async (c: JournalCategory) => {
    if (!(await brandConfirm(`Apagar a categoria “${c.name.pt}”? As receitas continuam, só perdem esta etiqueta.`, { confirmLabel: 'Apagar', danger: true }))) return;
    const { error } = await supabase.from('journal_categories').delete().eq('slug', c.slug);
    setMsg(error ? `Não apagou: ${error.message}` : 'Apagada.');
    if (!error) onChange();
  };
  const edit = (slug: string, v: Partial<JournalCategory>) => setList(l => l.map(c => (c.slug === slug ? { ...c, ...v } : c)));

  return (
    <section className="bx-card">
      <p className="bx-sub">Temas aparecem como filtros no Diário; “Como é feita” vira o filtro de dieta (cru, sem forno, sem trigo, SOS-free). Só aparecem no site as que têm pelo menos uma receita.</p>
      {msg && <p className="bx-sub" style={{ fontWeight: 700 }}>{msg}</p>}
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead><tr><th style={cell}>Português</th><th style={cell}>English</th><th style={cell}>Tipo</th><th style={cell}>Ordem</th><th style={cell} /></tr></thead>
          <tbody>
            {list.map(c => (
              <tr key={c.slug}>
                <td style={cell}><input className="bx-input" value={c.name.pt} onChange={e => edit(c.slug, { name: { ...c.name, pt: e.target.value } })} /></td>
                <td style={cell}><input className="bx-input" value={c.name.en} onChange={e => edit(c.slug, { name: { ...c.name, en: e.target.value } })} /></td>
                <td style={cell}>
                  <select className="bx-input" value={c.kind} onChange={e => edit(c.slug, { kind: e.target.value as 'tema' | 'dieta' })}>
                    <option value="tema">Tema</option><option value="dieta">Como é feita</option>
                  </select>
                </td>
                <td style={cell}><input className="bx-input" type="number" style={{ width: 80 }} value={c.sort} onChange={e => edit(c.slug, { sort: Number(e.target.value) })} /></td>
                <td style={{ ...cell, whiteSpace: 'nowrap' }}>
                  <button type="button" className="bx-link" onClick={() => save(c)}>Salvar</button>{' '}
                  <button type="button" className="bx-link bx-link--danger" onClick={() => remove(c)}>Apagar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3 className="bx-h" style={{ marginTop: '1.4rem' }}>+ Nova categoria</h3>
      <div style={{ display: 'grid', gap: '0.6rem', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', alignItems: 'end' }}>
        <label className="bx-field"><span>Nome em português</span><input className="bx-input" value={add.pt} onChange={e => setAdd({ ...add, pt: e.target.value })} placeholder="Dia das Mães" /></label>
        <label className="bx-field"><span>Name in English</span><input className="bx-input" value={add.en} onChange={e => setAdd({ ...add, en: e.target.value })} placeholder="Mother's Day" /></label>
        <label className="bx-field"><span>Tipo</span>
          <select className="bx-input" value={add.kind} onChange={e => setAdd({ ...add, kind: e.target.value as 'tema' | 'dieta' })}><option value="tema">Tema</option><option value="dieta">Como é feita</option></select></label>
        <button type="button" className="bx-btn bx-btn--gold" onClick={create} disabled={!add.pt.trim()}>Criar</button>
      </div>
    </section>
  );
}

/* ───────────────────────── Discount codes ───────────────────────── */

interface Code { code: string; percent_off: number; active: boolean; expires_at: string | null; max_uses: number | null; note: string | null }

export function Codes() {
  const [codes, setCodes] = useState<Code[]>([]);
  const [msg, setMsg] = useState('');
  const [add, setAdd] = useState({ code: '', percent: 20, expires: '', max: '', note: '' });
  const load = useCallback(async () => {
    const { data } = await supabase.from('journal_codes').select('*').order('created_at', { ascending: false });
    setCodes((data || []) as Code[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    const code = add.code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    if (code.length < 3) { setMsg('O cupom precisa de pelo menos 3 letras ou números.'); return; }
    const { error } = await supabase.from('journal_codes').insert([{
      code, percent_off: Math.min(100, Math.max(1, Number(add.percent) || 10)),
      expires_at: add.expires ? new Date(`${add.expires}T23:59:59-03:00`).toISOString() : null,
      max_uses: add.max ? Number(add.max) : null, note: add.note || null,
    }]);
    setMsg(error ? (/duplicate/.test(error.message) ? 'Esse cupom já existe.' : `Não criou: ${error.message}`) : `✓ Cupom ${code} criado.`);
    if (!error) { setAdd({ code: '', percent: 20, expires: '', max: '', note: '' }); load(); }
  };
  const toggle = async (c: Code) => {
    await supabase.from('journal_codes').update({ active: !c.active }).eq('code', c.code);
    load();
  };
  const remove = async (c: Code) => {
    if (!(await brandConfirm(`Apagar o cupom ${c.code}?`, { confirmLabel: 'Apagar', danger: true }))) return;
    await supabase.from('journal_codes').delete().eq('code', c.code);
    load();
  };

  return (
    <section className="bx-card">
      <p className="bx-sub">Um cupom dá uma porcentagem de desconto em qualquer receita premium (e nas coleções). A pessoa digita em “Tem um cupom?” na receita.</p>
      {msg && <p className="bx-sub" style={{ fontWeight: 700 }}>{msg}</p>}
      <div style={{ display: 'grid', gap: '0.6rem', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', alignItems: 'end' }}>
        <label className="bx-field"><span>Cupom</span><input className="bx-input" value={add.code} onChange={e => setAdd({ ...add, code: e.target.value.toUpperCase() })} placeholder="NATAL20" /></label>
        <label className="bx-field"><span>% de desconto</span><input className="bx-input" type="number" min={1} max={100} value={add.percent} onChange={e => setAdd({ ...add, percent: Number(e.target.value) })} /></label>
        <label className="bx-field"><span>Vale até (opcional)</span><input className="bx-input" type="date" value={add.expires} onChange={e => setAdd({ ...add, expires: e.target.value })} /></label>
        <label className="bx-field"><span>Máximo de usos (opcional)</span><input className="bx-input" type="number" min={1} value={add.max} onChange={e => setAdd({ ...add, max: e.target.value })} /></label>
        <label className="bx-field"><span>Nota (para quem é)</span><input className="bx-input" value={add.note} onChange={e => setAdd({ ...add, note: e.target.value })} /></label>
        <button type="button" className="bx-btn bx-btn--gold" onClick={create}>Criar cupom</button>
      </div>
      {codes.length > 0 && (
        <div style={{ overflowX: 'auto', marginTop: '1.2rem' }}>
          <table style={tableStyle}>
            <thead><tr><th style={cell}>Cupom</th><th style={cell}>Desconto</th><th style={cell}>Vale até</th><th style={cell}>Máx.</th><th style={cell}>Nota</th><th style={cell} /></tr></thead>
            <tbody>
              {codes.map(c => (
                <tr key={c.code} style={{ opacity: c.active ? 1 : 0.5 }}>
                  <td style={cell}><strong>{c.code}</strong></td>
                  <td style={cell}>{c.percent_off}%</td>
                  <td style={cell}>{c.expires_at ? new Date(c.expires_at).toLocaleDateString('pt-BR') : '—'}</td>
                  <td style={cell}>{c.max_uses ?? '—'}</td>
                  <td style={cell}>{c.note || ''}</td>
                  <td style={{ ...cell, whiteSpace: 'nowrap' }}>
                    <button type="button" className="bx-link" onClick={() => toggle(c)}>{c.active ? 'Pausar' : 'Ativar'}</button>{' '}
                    <button type="button" className="bx-link bx-link--danger" onClick={() => remove(c)}>Apagar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ───────────────────────── Sales and numbers ───────────────────────── */

interface Order { id: string; created_at: string; customer_name: string; customer_email: string | null; total_price: number; status: string | null; pix_transaction_id: string; payment_provider: string | null; items_summary: string | null }
interface Access { reference: string | null; recipe_id: string | null; collection_id: string | null; code: string | null }

export function Sales({ recipes }: { recipes: JournalRecipe[] }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [inbox, setInbox] = useState<Record<string, string>>({});
  const [access, setAccess] = useState<Access[]>([]);
  const [views30, setViews30] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const [o, a, v] = await Promise.all([
      supabase.from('orders').select('id, created_at, customer_name, customer_email, total_price, status, pix_transaction_id, payment_provider, items_summary').like('pix_transaction_id', 'RJ%').order('created_at', { ascending: false }).limit(500),
      supabase.from('journal_access').select('reference, recipe_id, collection_id, code'),
      supabase.from('journal_views').select('recipe_id, views').gte('day', since),
    ]);
    const list = (o.data || []) as Order[];
    setOrders(list);
    setAccess((a.data || []) as Access[]);
    const vv: Record<string, number> = {};
    for (const x of (v.data || []) as { recipe_id: string; views: number }[]) vv[x.recipe_id] = (vv[x.recipe_id] || 0) + x.views;
    setViews30(vv);
    if (list.length) {
      const { data } = await supabase.from('inbox_status').select('source_id, status').eq('source_table', 'orders').in('source_id', list.map(x => x.id));
      setInbox(Object.fromEntries(((data || []) as { source_id: string; status: string }[]).map(x => [x.source_id, x.status])));
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const stateOf = (o: Order): 'pago' | 'aguardando' | 'reembolsado' => {
    const s = String(o.status || '').toUpperCase();
    if (s === 'REFUNDED' || inbox[o.id] === 'cancelled') return 'reembolsado';
    if (s === 'PAID' || (inbox[o.id] && inbox[o.id] !== 'new')) return 'pago';
    return 'aguardando';
  };
  const paid = orders.filter(o => stateOf(o) === 'pago');
  const revenue = paid.reduce((s, o) => s + Number(o.total_price || 0), 0);
  const paid30 = paid.filter(o => Date.now() - new Date(o.created_at).getTime() < 30 * 86400000);
  const totalViews30 = Object.values(views30).reduce((s, x) => s + x, 0);

  const perRecipe = useMemo(() => recipes.map(r => {
    const refs = new Set(access.filter(a => a.recipe_id === r.id).map(a => a.reference));
    const sold = paid.filter(o => refs.has(o.pix_transaction_id));
    return { r, views: r.views, views30: views30[r.id] || 0, sales: sold.length, revenue: sold.reduce((s, o) => s + Number(o.total_price || 0), 0) };
  }).sort((a, b) => b.revenue - a.revenue || b.views - a.views), [recipes, access, paid, views30]);

  const confirmPix = async (o: Order) => {
    if (!(await brandConfirm(`O Pix de ${fmtBRL(Number(o.total_price))} de ${o.customer_name} caiu? Confirmar abre a receita para a pessoa e manda o e-mail.`, { confirmLabel: 'Caiu, confirmar' }))) return;
    await supabase.from('inbox_status').upsert({ source_table: 'orders', source_id: o.id, status: 'confirmed', updated_at: new Date().toISOString() }, { onConflict: 'source_table,source_id' });
    const { data } = await supabase.auth.getSession();
    if (data.session) await fetch('/api/admin/ebook-paid', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` }, body: JSON.stringify({ orderId: o.id }) }).catch(() => {});
    setMsg(`✓ Confirmado. ${o.customer_name} já pode abrir a receita.`);
    load();
  };
  const refund = async (o: Order) => {
    if (!(await brandConfirm(`Marcar o pedido ${o.pix_transaction_id} como reembolsado? A pessoa perde o acesso à receita. Devolva o dinheiro no Mercado Pago, Stripe ou Pix (isso não é automático).`, { confirmLabel: 'Marcar reembolsado', danger: true }))) return;
    const { error } = await supabase.from('orders').update({ status: 'REFUNDED' }).eq('id', o.id);
    setMsg(error ? `Não mudou: ${error.message}` : '✓ Marcado como reembolsado. O acesso foi tirado.');
    load();
  };

  const tile = (label: string, value: string, hint?: string) => (
    <div className="bx-card" style={{ padding: '1rem' }}>
      <div className="bx-sub" style={{ margin: 0 }}>{label}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{value}</div>
      {hint && <div className="bx-sub" style={{ margin: 0, fontSize: '0.8rem' }}>{hint}</div>}
    </div>
  );

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {msg && <div className="bx-banner bx-banner--ok"><span>{msg}</span><button type="button" className="bx-link" onClick={() => setMsg('')}>Ok</button></div>}
      <div style={{ display: 'grid', gap: '0.8rem', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        {tile('Vendido (tudo)', fmtBRL(revenue), `${paid.length} compras pagas`)}
        {tile('Últimos 30 dias', fmtBRL(paid30.reduce((s, o) => s + Number(o.total_price || 0), 0)), `${paid30.length} compras`)}
        {tile('Visitas às receitas (30 dias)', String(totalViews30), 'uma por pessoa por dia')}
        {tile('Conversão (30 dias)', totalViews30 ? `${((paid30.length / totalViews30) * 100).toFixed(1)}%` : '—', 'compras ÷ visitas')}
      </div>

      <section className="bx-card">
        <h2 className="bx-h">Por receita</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead><tr><th style={cell}>Receita</th><th style={cell}>Visitas (30d)</th><th style={cell}>Visitas (tudo)</th><th style={cell}>Vendas</th><th style={cell}>R$</th></tr></thead>
            <tbody>{perRecipe.map(x => (
              <tr key={x.r.id}><td style={cell}>{textOf(x.r, 'pt').title}{x.r.is_free ? ' 🎁' : ''}</td><td style={cell}>{x.views30}</td><td style={cell}>{x.views}</td><td style={cell}>{x.r.is_free ? '—' : x.sales}</td><td style={cell}>{x.r.is_free ? '—' : fmtBRL(x.revenue)}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <section className="bx-card">
        <h2 className="bx-h">Compras</h2>
        {orders.length === 0 ? <p className="bx-sub">Nenhuma compra ainda.</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead><tr><th style={cell}>Quando</th><th style={cell}>Quem</th><th style={cell}>O quê</th><th style={cell}>Valor</th><th style={cell}>Situação</th><th style={cell} /></tr></thead>
              <tbody>{orders.map(o => {
                const st = stateOf(o);
                return (
                  <tr key={o.id}>
                    <td style={cell}>{new Date(o.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td style={cell}>{o.customer_name}<br /><small>{o.customer_email}</small></td>
                    <td style={cell}>{(o.items_summary || '').replace(/^1x /, '')}<br /><small>{o.pix_transaction_id} · {o.payment_provider === 'mercadopago' ? 'Mercado Pago' : o.payment_provider === 'stripe' ? 'Stripe' : 'Pix direto'}</small></td>
                    <td style={cell}>{fmtBRL(Number(o.total_price))}</td>
                    <td style={cell}>{st === 'pago' ? '✅ Pago' : st === 'reembolsado' ? '↩️ Reembolsado' : '⏳ Aguardando'}</td>
                    <td style={{ ...cell, whiteSpace: 'nowrap' }}>
                      {st === 'aguardando' && o.payment_provider === 'pix' && <button type="button" className="bx-link" onClick={() => confirmPix(o)}>Pix caiu</button>}
                      {st === 'pago' && <button type="button" className="bx-link bx-link--danger" onClick={() => refund(o)}>Reembolsado</button>}
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        )}
        <p className="bx-sub">Cartão e Pix pelo Mercado Pago confirmam sozinhos. “Pix direto” (o QR code nosso) precisa do “Pix caiu” aqui ou na Caixa de Entrada.</p>
      </section>
    </div>
  );
}

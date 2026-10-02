'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { brandAlert, brandConfirm } from '@/lib/brandDialog';
import { getSiteSetting } from '@/lib/siteSettings';
import { IMMERSION_FEE_PER_GUEST_PER_NIGHT, quoteRetreatPackage, type RetreatRoom } from '@/lib/retreatPricing';
import { DEFAULT_BONUS, DEFAULT_INCLUDED, brl, firstName, type Offer, type OfferKind, type OfferLang } from '@/lib/offers';

/**
 * Propostas: a personal payment page for someone interested in a course or a retreat (migration 36).
 * Dolly fills it in (prices come from the course list or the same retreat calculator the site uses), saves,
 * and sends the link on WhatsApp. The client sees /proposta/<id> and pays there; the payment lands in the inbox
 * as an order (PRP…), and this list shows it as paid.
 */

interface Course { id: string; title: string; price: number; image_url: string | null }
interface Row extends Offer { paid: boolean }

const input: React.CSSProperties = { width: '100%', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '8px', fontSize: '0.98rem' };
const label: React.CSSProperties = { display: 'block', fontWeight: 700, color: '#2c3e50', marginBottom: '0.35rem', fontSize: '0.9rem' };
const card: React.CSSProperties = { background: 'white', borderRadius: '12px', padding: 'clamp(1.1rem, 3vw, 1.6rem)', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' };
const chip = (on: boolean): React.CSSProperties => ({
  padding: '0.5rem 0.95rem', borderRadius: '999px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
  border: `2px solid ${on ? '#d4af37' : '#e5e5e5'}`, background: on ? '#fffdf3' : 'white', color: '#2c3e50',
});

const plusDays = (n: number) => {
  const d = new Date(Date.now() - 3 * 3600 * 1000 + n * 86400000);
  return d.toISOString().slice(0, 10);
};
const waNumber = (v: string | null | undefined) => {
  const d = (v || '').replace(/\D/g, '');
  return d ? (d.length <= 11 ? `55${d}` : d) : '';
};
const linkOf = (id: string) => `${typeof window !== 'undefined' ? window.location.origin : 'https://thetropicalbakery.com'}/proposta/${id}`;
const waMessage = (o: { customer_name: string; title: string; lang: OfferLang; id: string }) => o.lang === 'en'
  ? `Hi ${firstName(o.customer_name)}! I put together a proposal just for you: ${o.title}. Everything is here, and you can secure your spot on the same page: ${linkOf(o.id)}`
  : `Oi ${firstName(o.customer_name)}! Preparei uma proposta especial só para você: ${o.title}. Está tudo aqui, e você garante sua vaga na mesma página: ${linkOf(o.id)}`;

function Propostas() {
  const q = useSearchParams();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [rooms, setRooms] = useState<RetreatRoom[]>([]);
  const [fee, setFee] = useState(IMMERSION_FEE_PER_GUEST_PER_NIGHT);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState<Row | null>(null);
  const [copiedId, setCopiedId] = useState('');

  // The form
  const [kind, setKind] = useState<OfferKind>('retiro');
  const [lang, setLang] = useState<OfferLang>('pt');
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [dates, setDates] = useState('');
  const [price, setPrice] = useState('');
  const [anchor, setAnchor] = useState('');
  const [included, setIncluded] = useState(DEFAULT_INCLUDED.retiro.pt.join('\n'));
  const [bonuses, setBonuses] = useState(DEFAULT_BONUS.pt);
  const [note, setNote] = useState('');
  const [expires, setExpires] = useState(plusDays(5));
  const [imageUrl, setImageUrl] = useState('');
  const [lead, setLead] = useState<{ source: string; id: string } | null>(null);
  // Retreat calculator
  const [roomId, setRoomId] = useState('');
  const [nights, setNights] = useState(3);
  const [guests, setGuests] = useState(2);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('payment_offers').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) { setTableMissing(true); setLoading(false); return; }
    const offers = (data || []) as Offer[];
    const refs = offers.map(o => o.order_reference).filter(Boolean) as string[];
    let paidRefs = new Set<string>();
    if (refs.length) {
      const { data: orders } = await supabase.from('orders').select('pix_transaction_id, status').in('pix_transaction_id', refs);
      paidRefs = new Set(((orders || []) as { pix_transaction_id: string; status: string }[])
        .filter(o => String(o.status).toUpperCase() === 'PAID').map(o => o.pix_transaction_id));
    }
    setRows(offers.map(o => ({ ...o, price: Number(o.price), paid: !!o.order_reference && paidRefs.has(o.order_reference) })));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    supabase.from('courses').select('id, title, price, image_url').order('title').then(({ data }) => setCourses((data || []) as Course[]));
    supabase.from('retreat_rooms').select('id, name, airbnb_nightly_rate, max_guests').then(({ data }) => {
      const list = ((data || []) as RetreatRoom[]).map(r => ({ ...r, airbnb_nightly_rate: Number(r.airbnb_nightly_rate) || 0, max_guests: r.max_guests || 2 }));
      setRooms(list);
      if (list[0]) setRoomId(list[0].id);
    });
    getSiteSetting('retreat_immersion_fee_per_guest_per_night', IMMERSION_FEE_PER_GUEST_PER_NIGHT).then(setFee);
  }, [load]);

  // Opened from a lead (Inscrições or the inbox): fill in who it is for.
  useEffect(() => {
    const from = q.get('from') || '';
    const [source, id] = from.split(':');
    if (!id || !['course_registrations', 'contact_leads'].includes(source)) return;
    (async () => {
      const { data } = await supabase.from(source).select('*').eq('id', id).maybeSingle();
      if (!data) return;
      setLead({ source, id });
      if (source === 'course_registrations') {
        setName(data.customer_name || '');
        setWhatsapp(data.customer_whatsapp || '');
        setEmail(data.email || '');
        const k: OfferKind = data.interest_type === 'retiro' ? 'retiro' : 'curso';
        switchKind(k);
        if (data.group_size) setGuests(Number(data.group_size) || 2);
        if (data.specific_interest) setTitle(String(data.specific_interest));
      } else {
        setName(data.name || '');
        setWhatsapp(data.whatsapp || '');
        setEmail(data.email || '');
        switchKind(/retiro|retreat/i.test(data.topic || '') ? 'retiro' : 'curso');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  /** The included list and the gift follow the kind and the language, unless Dolly already changed them. */
  const switchKind = (k: OfferKind, l: OfferLang = lang) => {
    setIncluded(cur => {
      const defaults = (['retiro', 'curso'] as OfferKind[]).flatMap(x => (['pt', 'en'] as OfferLang[]).map(y => DEFAULT_INCLUDED[x][y].join('\n')));
      return !cur.trim() || defaults.includes(cur) ? DEFAULT_INCLUDED[k][l].join('\n') : cur;
    });
    setBonuses(cur => (!cur.trim() || cur === DEFAULT_BONUS.pt || cur === DEFAULT_BONUS.en ? DEFAULT_BONUS[l] : cur));
    setKind(k);
  };
  const switchLang = (l: OfferLang) => { setLang(l); switchKind(kind, l); };

  const room = rooms.find(r => r.id === roomId) || rooms[0];
  const quote = room ? quoteRetreatPackage(room, nights, Math.min(guests, room.max_guests), fee) : null;
  const applyQuote = () => {
    if (!room || !quote) return;
    setPrice(String(quote.total));
    const g = Math.min(guests, room.max_guests);
    setTitle(lang === 'en'
      ? `Tropical Retreat: ${nights} nights in Itamambuca`
      : `Retiro Tropical: ${nights} noites em Itamambuca`);
    setIncluded(cur => {
      const first = lang === 'en' ? `${room.name} for ${g} ${g === 1 ? 'guest' : 'guests'}, ${nights} nights` : `${room.name} para ${g} ${g === 1 ? 'pessoa' : 'pessoas'}, ${nights} noites`;
      const lines = cur.split('\n').filter(Boolean);
      return [first, ...lines.filter(l => !/^(Suíte|Cobertura|Penthouse|Suite)/i.test(l) && !l.includes(' noites') && !l.includes(' nights'))].join('\n');
    });
  };
  const pickCourse = (c: Course) => {
    setTitle(c.title);
    if (Number(c.price) > 0) setPrice(String(Number(c.price)));
    setImageUrl(c.image_url || '');
  };

  const reset = () => {
    setName(''); setWhatsapp(''); setEmail(''); setTitle(''); setDates(''); setPrice(''); setAnchor('');
    setNote(''); setExpires(plusDays(5)); setImageUrl(''); setLead(null);
    setIncluded(DEFAULT_INCLUDED[kind][lang].join('\n')); setBonuses(DEFAULT_BONUS[lang]);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(String(price).replace(',', '.'));
    if (!name.trim() || !title.trim()) { brandAlert('Preencha o nome do cliente e o título da proposta.'); return; }
    if (!(value > 0)) { brandAlert('Informe o valor da proposta.'); return; }
    const anchorValue = Number(String(anchor).replace(',', '.')) || null;
    setSaving(true);
    const { data, error } = await supabase.from('payment_offers').insert([{
      kind, lang,
      customer_name: name.trim(), customer_whatsapp: whatsapp.trim() || null, customer_email: email.trim() || null,
      title: title.trim(), dates_label: dates.trim() || null,
      price: value, anchor_price: anchorValue && anchorValue > value ? anchorValue : null,
      included: included.split('\n').map(s => s.trim()).filter(Boolean),
      bonuses: bonuses.split('\n').map(s => s.trim()).filter(Boolean),
      note: note.trim() || null, image_url: imageUrl || null, expires_on: expires || null,
      lead_source: lead?.source ?? null, lead_id: lead?.id ?? null,
    }]).select('*').single();
    setSaving(false);
    if (error || !data) {
      brandAlert(/payment_offers/.test(error?.message || '')
        ? 'Rode a migration_36_payment_offers.sql no Supabase primeiro.'
        : `Não foi possível salvar: ${error?.message ?? ''}`);
      return;
    }
    const row = { ...(data as Offer), price: Number(data.price), paid: false };
    setJustSaved(row);
    reset();
    load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copy = async (id: string) => {
    try { await navigator.clipboard.writeText(linkOf(id)); setCopiedId(id); setTimeout(() => setCopiedId(''), 2000); } catch { /* old browser */ }
  };

  const cancel = async (r: Row) => {
    if (!(await brandConfirm(`Cancelar a proposta de ${r.customer_name}? O link deixa de aceitar pagamento.`, { danger: true, confirmLabel: 'Sim, cancelar' }))) return;
    const { error } = await supabase.from('payment_offers').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', r.id);
    if (error) brandAlert(`Não foi possível cancelar: ${error.message}`); else load();
  };

  const today = plusDays(0);
  const stateOf = (r: Row) => r.paid ? { t: 'Paga ✓', c: '#1e6b3c', bg: '#e6f4ec' }
    : r.status === 'cancelled' ? { t: 'Cancelada', c: '#7f8c8d', bg: '#f1f2f6' }
    : r.expires_on && today > r.expires_on ? { t: 'Expirou', c: '#a04000', bg: '#fdf0e6' }
    : r.order_reference ? { t: 'Abriu o pagamento', c: '#1a5276', bg: '#eaf2f8' }
    : { t: 'Enviada', c: '#8a6d00', bg: '#fff8e1' };

  const actions = (r: Row) => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {waNumber(r.customer_whatsapp) && (
        <a href={`https://wa.me/${waNumber(r.customer_whatsapp)}?text=${encodeURIComponent(waMessage(r))}`} target="_blank" rel="noopener noreferrer"
          style={{ background: '#25D366', color: 'white', padding: '0.6rem 1rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 700 }}>
          💬 Enviar no WhatsApp
        </a>
      )}
      <button type="button" onClick={() => copy(r.id)} style={{ background: '#2c3e50', color: 'white', border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
        {copiedId === r.id ? 'Copiado ✓' : '🔗 Copiar link'}
      </button>
      <a href={`/proposta/${r.id}`} target="_blank" rel="noopener noreferrer" style={{ background: 'white', color: '#2c3e50', border: '1px solid #dfe4ea', padding: '0.6rem 1rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 700 }}>
        👀 Ver página
      </a>
    </div>
  );

  const sentCount = useMemo(() => ({ total: rows.length, paid: rows.filter(r => r.paid).length }), [rows]);

  return (
    <div style={{ maxWidth: '1100px' }}>
      <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '0.4rem' }}>Propostas de Pagamento</h1>
      <p style={{ color: '#7f8c8d', marginBottom: '1.5rem', lineHeight: 1.7 }}>
        Para quem se interessou por um curso ou retiro: monte uma proposta pessoal e mande o link. A pessoa vê uma página só dela,
        com tudo o que está incluído, e paga ali mesmo (Pix, cartão, cartão internacional ou PayPal). O pagamento chega na Caixa de Entrada.
      </p>

      {tableMissing && (
        <div style={{ ...card, background: '#fff8e6', border: '1px solid #f0d09a', marginBottom: '1.5rem', color: '#8a5a00' }}>
          Para usar as propostas, rode a <strong>migration_36_payment_offers.sql</strong> no Supabase.
        </div>
      )}

      {justSaved && (
        <div role="status" style={{ ...card, background: '#e6f4ec', border: '1px solid #b7e1c6', marginBottom: '1.5rem', display: 'grid', gap: '0.8rem' }}>
          <strong style={{ color: '#1e6b3c' }}>✅ Proposta pronta para {justSaved.customer_name}. Agora é só mandar:</strong>
          <code style={{ background: 'white', padding: '0.5rem 0.7rem', borderRadius: '6px', overflowWrap: 'anywhere', fontSize: '0.88rem' }}>{linkOf(justSaved.id)}</code>
          {actions(justSaved)}
        </div>
      )}

      <form onSubmit={save} style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', alignItems: 'start', marginBottom: '2.5rem' }}>
        <div style={{ display: 'grid', gap: '1.25rem', minWidth: 0 }}>
          <div style={{ ...card, display: 'grid', gap: '0.9rem' }}>
            <h3 style={{ margin: 0, color: '#2c3e50' }}>👤 Para quem</h3>
            {lead && <p style={{ margin: 0, fontSize: '0.85rem', color: '#1e6b3c' }}>Preenchido a partir do contato que chegou pelo site.</p>}
            <div><label style={label}>Nome</label><input style={input} value={name} onChange={e => setName(e.target.value)} placeholder="Nome do cliente" /></div>
            <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 170px), 1fr))' }}>
              <div><label style={label}>WhatsApp</label><input style={input} value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(12) 99999-9999" /></div>
              <div><label style={label}>E-mail (opcional)</label><input style={input} type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div>
                <label style={label}>É um</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" style={chip(kind === 'retiro')} onClick={() => switchKind('retiro')}>🏝️ Retiro</button>
                  <button type="button" style={chip(kind === 'curso')} onClick={() => switchKind('curso')}>🎓 Curso</button>
                </div>
              </div>
              <div>
                <label style={label}>Página em</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" style={chip(lang === 'pt')} onClick={() => switchLang('pt')}>🇧🇷 Português</button>
                  <button type="button" style={chip(lang === 'en')} onClick={() => switchLang('en')}>🇬🇧 English</button>
                </div>
              </div>
            </div>
          </div>

          {kind === 'retiro' && room && quote && (
            <div style={{ ...card, background: '#fdf7ee', border: '1px solid #e8e1d7', display: 'grid', gap: '0.8rem' }}>
              <h3 style={{ margin: 0, color: '#2c3e50' }}>🧮 Calcular o pacote</h3>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {rooms.map(r => <button key={r.id} type="button" style={chip(r.id === room.id)} onClick={() => setRoomId(r.id)}>{r.name}</button>)}
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <label style={{ ...label, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>Noites
                  <input type="number" min={1} max={30} value={nights} onChange={e => setNights(Math.max(1, Number(e.target.value) || 1))} style={{ ...input, width: '80px' }} />
                </label>
                <label style={{ ...label, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>Pessoas
                  <input type="number" min={1} max={room.max_guests} value={guests} onChange={e => setGuests(Math.max(1, Number(e.target.value) || 1))} style={{ ...input, width: '80px' }} />
                </label>
              </div>
              <p style={{ margin: 0, color: '#594a42', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Suíte {brl(quote.roomSubtotal)} + imersão {brl(quote.immersionSubtotal)} = <strong>{brl(quote.total)}</strong>
                {room.airbnb_nightly_rate === 0 && <><br /><span style={{ color: '#a04000' }}>Esta suíte ainda não tem diária cadastrada em Retiros: fotos e preços.</span></>}
              </p>
              <button type="button" onClick={applyQuote} style={{ justifySelf: 'start', background: '#d4af37', color: 'white', border: 'none', padding: '0.6rem 1.1rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                Usar este valor na proposta
              </button>
            </div>
          )}

          {kind === 'curso' && courses.length > 0 && (
            <div style={{ ...card, background: '#fdf7ee', border: '1px solid #e8e1d7', display: 'grid', gap: '0.7rem' }}>
              <h3 style={{ margin: 0, color: '#2c3e50' }}>🎓 Escolher o curso</h3>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {courses.map(c => (
                  <button key={c.id} type="button" style={chip(title === c.title)} onClick={() => pickCourse(c)}>
                    {c.title}{Number(c.price) > 0 ? ` · ${brl(Number(c.price))}` : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ ...card, display: 'grid', gap: '0.9rem' }}>
            <h3 style={{ margin: 0, color: '#2c3e50' }}>💌 Seu recado</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#7f8c8d', lineHeight: 1.55 }}>
              Aparece com a sua foto, logo depois do título. Fale com a pessoa: o que ela te contou, por que vai ser especial para ela.
            </p>
            <textarea style={input} rows={5} value={note} onChange={e => setNote(e.target.value)}
              placeholder={lang === 'en' ? 'Hi! I loved talking to you…' : 'Oi! Adorei conversar com você…'} />
          </div>
        </div>

        <div style={{ display: 'grid', gap: '1.25rem', minWidth: 0 }}>
          <div style={{ ...card, display: 'grid', gap: '0.9rem' }}>
            <h3 style={{ margin: 0, color: '#2c3e50' }}>🎁 A oferta</h3>
            <div><label style={label}>Título</label><input style={input} value={title} onChange={e => setTitle(e.target.value)} placeholder="Retiro Tropical: 3 noites em Itamambuca" /></div>
            <div><label style={label}>Datas (como o cliente vai ler)</label><input style={input} value={dates} onChange={e => setDates(e.target.value)} placeholder={lang === 'en' ? 'November 12 to 15' : '12 a 15 de novembro'} /></div>
            <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))' }}>
              <div><label style={label}>Valor (R$)</label><input style={input} inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} placeholder="0,00" /></div>
              <div>
                <label style={label}>Valor de referência <span style={{ fontWeight: 400, color: '#95a5a6' }}>(riscado, opcional)</span></label>
                <input style={input} inputMode="decimal" value={anchor} onChange={e => setAnchor(e.target.value)} placeholder="só se for maior" />
              </div>
            </div>
            <div>
              <label style={label}>O que está incluído <span style={{ fontWeight: 400, color: '#95a5a6' }}>(um por linha)</span></label>
              <textarea style={input} rows={5} value={included} onChange={e => setIncluded(e.target.value)} />
            </div>
            <div>
              <label style={label}>Presentes / bônus <span style={{ fontWeight: 400, color: '#95a5a6' }}>(um por linha, pode apagar)</span></label>
              <textarea style={input} rows={2} value={bonuses} onChange={e => setBonuses(e.target.value)} />
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: '#7f8c8d' }}>Se mantiver o e-book de presente, mande o PDF para a pessoa depois do pagamento.</p>
            </div>
            <div>
              <label style={label}>Reservado até</label>
              <input type="date" style={{ ...input, maxWidth: '220px' }} value={expires} min={plusDays(0)} onChange={e => setExpires(e.target.value)} />
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: '#7f8c8d' }}>Um prazo curto ajuda a pessoa a decidir. Depois dele o link não aceita mais pagamento.</p>
            </div>
          </div>

          <button type="submit" disabled={saving || tableMissing} style={{ background: '#d4af37', color: 'white', border: 'none', padding: '1rem', borderRadius: '10px', fontWeight: 800, fontSize: '1.05rem', cursor: saving ? 'wait' : 'pointer', opacity: saving || tableMissing ? 0.7 : 1 }}>
            {saving ? 'Criando…' : '✨ Criar proposta e pegar o link'}
          </button>
        </div>
      </form>

      <h2 style={{ fontSize: '1.4rem', color: '#2c3e50', marginBottom: '0.3rem' }}>Propostas enviadas</h2>
      <p style={{ color: '#7f8c8d', margin: '0 0 1rem' }}>{sentCount.total} enviada(s) · {sentCount.paid} paga(s)</p>
      {loading ? <p>Carregando…</p> : rows.length === 0 ? (
        <div style={{ ...card, color: '#7f8c8d', textAlign: 'center' }}>Nenhuma proposta ainda. Os contatos quentes estão em <Link href="/admin/inscricoes">Inscrições</Link> e na <Link href="/admin/inbox">Caixa de Entrada</Link>.</div>
      ) : (
        <div style={{ display: 'grid', gap: '0.9rem' }}>
          {rows.map(r => {
            const st = stateOf(r);
            return (
              <div key={r.id} style={{ ...card, display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', borderLeft: `5px solid ${st.c}` }}>
                <div style={{ minWidth: 0, flex: '1 1 280px' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                    <strong style={{ color: '#2c3e50', fontSize: '1.05rem' }}>{r.customer_name}</strong>
                    <span style={{ background: st.bg, color: st.c, fontWeight: 800, fontSize: '0.78rem', padding: '0.15rem 0.55rem', borderRadius: '6px' }}>{st.t}</span>
                  </div>
                  <div style={{ color: '#576574', fontSize: '0.92rem', overflowWrap: 'anywhere' }}>
                    {r.kind === 'retiro' ? '🏝️' : '🎓'} {r.title} · <strong>{brl(r.price)}</strong>{r.dates_label ? ` · ${r.dates_label}` : ''}
                  </div>
                  <div style={{ color: '#95a5a6', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                    Criada em {new Date(r.created_at).toLocaleDateString('pt-BR')}{r.expires_on ? ` · reservada até ${new Date(r.expires_on + 'T12:00:00').toLocaleDateString('pt-BR')}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {!r.paid && r.status === 'open' && actions(r)}
                  {r.paid && <a href={`/proposta/${r.id}`} target="_blank" rel="noopener noreferrer" style={{ color: '#2c3e50', fontWeight: 700 }}>Ver página</a>}
                  {!r.paid && r.status === 'open' && (
                    <button type="button" onClick={() => cancel(r)} style={{ background: 'none', border: 'none', color: '#c0392b', fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PropostasAdmin() {
  return (
    <Suspense fallback={<p style={{ padding: '2rem' }}>Carregando…</p>}>
      <Propostas />
    </Suspense>
  );
}

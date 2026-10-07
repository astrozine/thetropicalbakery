'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { FUNNEL } from '@/lib/funnel';

/**
 * Funil de Receitas: how the free-recipes funnel is doing. Who signed up (and from which ad), how many took the
 * order bump, the offer on the thank-you page or the welcome price from the e-mails, who is around Ubatuba / Paraty
 * and what they said they would love. Reads `funnel_leads` (migration 43) and the e-book orders (EBK…).
 * Read-only: the e-mails are switched on in Admin › E-mails (rule "Receitas grátis: sequência de e-mails").
 */

interface Lead {
  id: string;
  created_at: string;
  email: string;
  first_name: string | null;
  lang: string;
  segment: 'local' | 'visiting' | 'away';
  interest: 'box' | 'course' | 'brunch' | 'events' | null;
  book_ref: string | null;
  book_offer: 'bump' | 'oto' | 'welcome' | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
}

interface BookOrder { id: string; ref: string; email: string; total: number; paid: boolean; welcome: boolean; created_at: string }

const PERIODS = [
  { id: '7', label: '7 dias', days: 7 },
  { id: '30', label: '30 dias', days: 30 },
  { id: 'all', label: 'Tudo', days: 3650 },
];
const SEGMENT_LABEL = { local: '🌴 Ubatuba / Paraty', visiting: '🧳 Vai visitar', away: '🌍 Outro lugar' };
const INTEREST_LABEL = { box: '📦 Caixa / assinatura', brunch: '🥂 Brunch', course: '👩‍🍳 Cursos', events: '🎉 Eventos' };
const OFFER_LABEL = { bump: 'Order bump (no formulário)', oto: 'Oferta da página de obrigado', welcome: 'Preço de boas-vindas (e-mail)' };

const card: React.CSSProperties = { background: 'white', borderRadius: '12px', padding: '1.1rem 1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const pill = (on: boolean): React.CSSProperties => ({ border: '1px solid #dfe4ea', padding: '0.45rem 0.9rem', borderRadius: '999px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', background: on ? '#2f3542' : 'white', color: on ? 'white' : '#2f3542' });
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '—');
const brl = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export default function AdminFreeRecipesPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [orders, setOrders] = useState<BookOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [period, setPeriod] = useState('30');
  const [copied, setCopied] = useState('');
  const [now] = useState(() => Date.now());

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('funnel_leads').select('*').order('created_at', { ascending: false }).limit(5000);
      if (error) { setMissing(true); setLoading(false); return; }
      setLeads((data || []) as Lead[]);

      const { data: o } = await supabase.from('orders').select('id, pix_transaction_id, customer_email, status, total_price, items_summary, created_at')
        .like('pix_transaction_id', 'EBK%').order('created_at', { ascending: false }).limit(5000);
      const rows = (o || []) as Record<string, unknown>[];
      // A Pix counts as paid once Dolly moves it past "new" in the inbox (the rule the download page uses).
      const open = rows.filter(r => String(r.status ?? '').toUpperCase() !== 'PAID').map(r => String(r.id));
      const confirmed = new Set<string>();
      for (let i = 0; i < open.length; i += 200) {
        const { data: inbox } = await supabase.from('inbox_status').select('source_id, status').eq('source_table', 'orders').in('source_id', open.slice(i, i + 200));
        (inbox || []).forEach(x => { if (x.status !== 'new' && x.status !== 'cancelled') confirmed.add(String(x.source_id)); });
      }
      setOrders(rows.map(r => ({
        id: String(r.id),
        ref: String(r.pix_transaction_id),
        email: String(r.customer_email ?? '').toLowerCase(),
        total: Number(r.total_price ?? 0),
        paid: String(r.status ?? '').toUpperCase() === 'PAID' || confirmed.has(String(r.id)),
        welcome: /boas-vindas/.test(String(r.items_summary ?? '')),
        created_at: String(r.created_at ?? ''),
      })));
      setLoading(false);
    })();
  }, []);

  const s = useMemo(() => {
    const since = now - (PERIODS.find(p => p.id === period)?.days ?? 30) * 86400000;
    const list = leads.filter(l => Date.parse(l.created_at) >= since);
    const emails = new Set(list.map(l => l.email.toLowerCase()));
    const byRef = new Map(orders.map(o => [o.ref, o]));

    // Who bought the book through the funnel, and through which door.
    const offers = { bump: { tried: 0, paid: 0, money: 0 }, oto: { tried: 0, paid: 0, money: 0 }, welcome: { tried: 0, paid: 0, money: 0 } };
    for (const l of list) {
      if (!l.book_ref || !l.book_offer || l.book_offer === 'welcome') continue;
      const o = byRef.get(l.book_ref);
      offers[l.book_offer].tried += 1;
      if (o?.paid) { offers[l.book_offer].paid += 1; offers[l.book_offer].money += o.total; }
    }
    for (const o of orders) {
      if (!o.welcome || !emails.has(o.email)) continue;
      offers.welcome.tried += 1;
      if (o.paid) { offers.welcome.paid += 1; offers.welcome.money += o.total; }
    }
    const buyers = new Set<string>();
    for (const l of list) if (l.book_ref && byRef.get(l.book_ref)?.paid) buyers.add(l.email.toLowerCase());
    for (const o of orders) if (o.welcome && o.paid && emails.has(o.email)) buyers.add(o.email);

    const count = <K extends string>(key: (l: Lead) => K | null) => {
      const m = new Map<K, number>();
      list.forEach(l => { const k = key(l); if (k) m.set(k, (m.get(k) || 0) + 1); });
      return [...m.entries()].sort((a, b) => b[1] - a[1]);
    };
    // Per ad: sign-ups and how many of them ended up buying the book.
    const ads = new Map<string, { leads: number; buyers: number }>();
    for (const l of list) {
      const k = [l.utm_source, l.utm_campaign, l.utm_content].filter(Boolean).join(' · ') || '(sem UTM: direto / orgânico)';
      const a = ads.get(k) || { leads: 0, buyers: 0 };
      a.leads += 1;
      if (buyers.has(l.email.toLowerCase())) a.buyers += 1;
      ads.set(k, a);
    }
    const money = offers.bump.money + offers.oto.money + offers.welcome.money;
    return {
      list, offers, buyers: buyers.size, money,
      nearby: list.filter(l => l.segment !== 'away').length,
      segments: count(l => l.segment),
      interests: count(l => l.interest),
      langs: count(l => l.lang),
      ads: [...ads.entries()].sort((a, b) => b[1].leads - a[1].leads),
    };
  }, [leads, orders, period, now]);

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(text); setTimeout(() => setCopied(''), 2000); } catch { /* shown, copy by hand */ }
  };

  const site = 'https://thetropicalbakery.com';
  const links = [
    { label: 'Anúncio em português (Meta)', url: `${site}${FUNNEL.pagePath.pt}?utm_source=meta&utm_campaign=receitas-pt` },
    { label: 'Anúncio em inglês (Meta)', url: `${site}${FUNNEL.pagePath.en}?utm_source=meta&utm_campaign=recipes-en` },
    { label: 'Link da bio do Instagram', url: `${site}${FUNNEL.pagePath.pt}?utm_source=instagram&utm_campaign=bio` },
    { label: 'Post / story orgânico', url: `${site}${FUNNEL.pagePath.pt}?utm_source=instagram&utm_campaign=post` },
  ];

  if (loading) return <p style={{ padding: '2rem' }}>Carregando…</p>;

  return (
    <div style={{ display: 'grid', gap: '1.2rem', maxWidth: 1100 }}>
      <div>
        <h1 style={{ margin: '0 0 0.3rem' }}>🍓 Funil de Receitas</h1>
        <p style={{ margin: 0, color: '#57606f' }}>
          Anúncios → <a href={FUNNEL.pagePath.pt} target="_blank" rel="noopener">/receitas</a> (2 receitas grátis + o livro como order bump) → página de obrigado
          (oferta do livro, e para quem está na região: caixa, assinatura, brunch, cursos, eventos) → 5 e-mails.
        </p>
      </div>

      {missing ? (
        <div style={{ ...card, background: '#fff4e0' }}>
          <b>Falta um passo:</b> rode <code>migration_43_free_recipes_funnel.sql</code> no Supabase (SQL Editor). A página já entrega as receitas
          mesmo sem ela, mas sem a tabela não dá para contar ninguém.
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {PERIODS.map(p => <button key={p.id} type="button" style={pill(period === p.id)} onClick={() => setPeriod(p.id)}>{p.label}</button>)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.8rem' }}>
            {[
              { n: String(s.list.length), l: 'baixaram as receitas' },
              { n: String(s.buyers), l: `compraram o livro (${pct(s.buyers, s.list.length)})` },
              { n: brl(s.money), l: 'em livros pelo funil' },
              { n: String(s.nearby), l: `estão na região (${pct(s.nearby, s.list.length)})` },
            ].map(x => (
              <div key={x.l} style={{ ...card, textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2f3542' }}>{x.n}</div>
                <div style={{ fontSize: '0.85rem', color: '#57606f' }}>{x.l}</div>
              </div>
            ))}
          </div>

          <div style={card}>
            <h2 style={{ margin: '0 0 0.8rem', fontSize: '1.1rem' }}>📖 Vendas do livro por porta</h2>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {(Object.keys(OFFER_LABEL) as (keyof typeof OFFER_LABEL)[]).map(k => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', borderBottom: '1px solid #f1f2f6', paddingBottom: '0.45rem' }}>
                  <span>{OFFER_LABEL[k]}</span>
                  <span style={{ color: '#57606f' }}>
                    {s.offers[k].tried} pedido(s) · <b style={{ color: '#1e6b3c' }}>{s.offers[k].paid} pago(s)</b> · {brl(s.offers[k].money)}
                    {k === 'bump' && <> · <b>{pct(s.offers.bump.tried, s.list.length)}</b> marcaram o bump</>}
                  </span>
                </div>
              ))}
            </div>
            <p style={{ margin: '0.7rem 0 0', fontSize: '0.82rem', color: '#747d8c' }}>
              Pix fica como &quot;pedido&quot; até ser confirmado na Caixa de Entrada. Vale dar um toque no WhatsApp de quem pediu e não pagou.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.8rem' }}>
            <div style={card}>
              <h2 style={{ margin: '0 0 0.6rem', fontSize: '1.05rem' }}>📍 Onde estão</h2>
              {s.segments.map(([k, n]) => <p key={k} style={{ margin: '0.25rem 0' }}>{SEGMENT_LABEL[k as keyof typeof SEGMENT_LABEL] ?? k}: <b>{n}</b></p>)}
              <h2 style={{ margin: '1rem 0 0.6rem', fontSize: '1.05rem' }}>💛 O que a região quer</h2>
              {s.interests.length ? s.interests.map(([k, n]) => <p key={k} style={{ margin: '0.25rem 0' }}>{INTEREST_LABEL[k as keyof typeof INTEREST_LABEL] ?? k}: <b>{n}</b></p>)
                : <p style={{ color: '#747d8c', margin: 0 }}>Ninguém respondeu ainda.</p>}
            </div>
            <div style={card}>
              <h2 style={{ margin: '0 0 0.6rem', fontSize: '1.05rem' }}>📣 Qual anúncio funciona</h2>
              {s.ads.length ? s.ads.map(([k, a]) => (
                <p key={k} style={{ margin: '0.3rem 0', fontSize: '0.9rem' }}>{k}: <b>{a.leads}</b> cadastro(s), <b style={{ color: '#1e6b3c' }}>{a.buyers}</b> compraram ({pct(a.buyers, a.leads)})</p>
              )) : <p style={{ color: '#747d8c', margin: 0 }}>Sem cadastros neste período.</p>}
              <h2 style={{ margin: '1rem 0 0.6rem', fontSize: '1.05rem' }}>🌐 Idioma</h2>
              <p style={{ margin: 0 }}>{s.langs.map(([k, n]) => `${k.toUpperCase()} ${n}`).join(' · ') || '—'}</p>
            </div>
          </div>

          <div style={card}>
            <h2 style={{ margin: '0 0 0.8rem', fontSize: '1.1rem' }}>🙋 Últimos cadastros</h2>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {s.list.slice(0, 60).map(l => {
                const o = l.book_ref ? orders.find(x => x.ref === l.book_ref) : undefined;
                return (
                  <div key={l.id} style={{ display: 'flex', gap: '0.5rem 1rem', flexWrap: 'wrap', alignItems: 'baseline', borderBottom: '1px solid #f1f2f6', paddingBottom: '0.45rem', fontSize: '0.9rem', minWidth: 0 }}>
                    <b>{l.first_name || '—'}</b>
                    <span style={{ color: '#57606f', overflowWrap: 'anywhere' }}>{l.email}</span>
                    <span>{SEGMENT_LABEL[l.segment]}</span>
                    {l.interest && <span>{INTEREST_LABEL[l.interest]}</span>}
                    {l.book_offer && <span style={{ color: o?.paid ? '#1e6b3c' : '#8a5a00' }}>📖 {o?.paid ? 'livro pago' : 'livro pedido'} ({l.book_offer})</span>}
                    <span style={{ color: '#a4b0be', marginLeft: 'auto' }}>{new Date(l.created_at).toLocaleDateString('pt-BR')} · {l.lang.toUpperCase()}{l.utm_campaign ? ` · ${l.utm_campaign}` : ''}</span>
                  </div>
                );
              })}
              {!s.list.length && <p style={{ color: '#747d8c', margin: 0 }}>Ninguém ainda neste período.</p>}
            </div>
          </div>
        </>
      )}

      <div style={card}>
        <h2 style={{ margin: '0 0 0.6rem', fontSize: '1.1rem' }}>🔗 Links para anúncios e posts</h2>
        <p style={{ margin: '0 0 0.7rem', color: '#57606f', fontSize: '0.9rem' }}>Use um link por anúncio: é assim que o quadro &quot;Qual anúncio funciona&quot; sabe de onde veio cada pessoa.</p>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {links.map(x => (
            <div key={x.url} style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap', minWidth: 0 }}>
              <span style={{ fontWeight: 600, minWidth: 200 }}>{x.label}</span>
              <code style={{ background: '#f1f2f6', padding: '0.3rem 0.5rem', borderRadius: 6, fontSize: '0.8rem', overflowWrap: 'anywhere', flex: '1 1 240px' }}>{x.url}</code>
              <button type="button" style={pill(copied === x.url)} onClick={() => copy(x.url)}>{copied === x.url ? 'Copiado!' : 'Copiar'}</button>
            </div>
          ))}
        </div>
        <p style={{ margin: '0.9rem 0 0', fontSize: '0.9rem' }}>
          ✉️ Os e-mails depois do cadastro estão em <Link href="/admin/emails">E-mails</Link> → regra <b>&quot;Receitas grátis: sequência de e-mails&quot;</b> (começa desligada).
        </p>
      </div>
    </div>
  );
}

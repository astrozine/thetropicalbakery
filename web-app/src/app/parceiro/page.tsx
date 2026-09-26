'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import LoginPanel from '@/components/LoginPanel';
import { formatBRL } from '@/lib/deliveryZones';
import {
  Partner, RestockRequest, PARTNER_STATUS, RESTOCK_STATUS, partnerKind,
} from '@/lib/portals';
import { exactEmail, isAdmin, previewIdFromUrl } from '@/lib/portalPreview';
import PreviewBanner from '@/components/PreviewBanner';
import { DEMO_AFFILIATE, DEMO_PARTNERS, DEMO_RESTOCKS, isDemoId } from '@/lib/demoPortals';

const STORE_WHATSAPP = '5511932119196';

const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #e8e1d7', borderRadius: '20px',
  padding: 'clamp(1.25rem, 3vw, 2rem)', boxShadow: '0 8px 24px rgba(60,42,33,0.05)',
};
const label: React.CSSProperties = {
  display: 'block', fontSize: '0.75rem', letterSpacing: '0.14em', textTransform: 'uppercase',
  color: '#a6832b', fontWeight: 700, marginBottom: '0.4rem',
};
const input: React.CSSProperties = {
  width: '100%', padding: '0.85rem 1rem', border: '1px solid rgba(212,175,55,0.5)',
  borderRadius: '8px', background: 'rgba(255,255,255,0.9)', fontFamily: 'var(--font-body)', fontSize: '1rem',
};

/** The same numbers as the database's affiliate_summary(), worked out for any partner (admin preview). */
async function affiliateSummaryFor(p: Partner) {
  if (!p.affiliate_code) return { data: { orders_count: 0, revenue: 0, commission: 0 } };
  const { data } = await supabase.from('orders').select('total_price').ilike('affiliate_code', exactEmail(p.affiliate_code));
  const revenue = (data || []).reduce((sum, o: { total_price: number | null }) => sum + Number(o.total_price || 0), 0);
  return { data: { orders_count: (data || []).length, revenue, commission: Math.round(revenue * (p.commission_pct || 0)) / 100 } };
}

/**
 * The partner's own area: where their parceria stands, what Dolly wrote to them,
 * a restock request that reaches the bakery's inbox, and — for affiliates — what
 * their code has brought in.
 */
export default function PartnerPortalPage() {
  const { user } = useAuth();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [requests, setRequests] = useState<RestockRequest[]>([]);
  const [affiliate, setAffiliate] = useState<{ orders_count: number; revenue: number; commission: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notSetUp, setNotSetUp] = useState(false);
  /** An admin looking at someone else's portal: everything is shown, nothing can be sent. */
  const [preview, setPreview] = useState(false);

  const [form, setForm] = useState({ items: '', wanted_date: '', notes: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const load = async () => {
      const previewId = previewIdFromUrl();
      const asAdmin = !!previewId && await isAdmin();
      setPreview(asAdmin);

      // A made-up partner from "Ver como": no database involved.
      if (asAdmin && isDemoId(previewId)) {
        const demo = DEMO_PARTNERS.find(d => d.id === previewId) || null;
        setPartner(demo);
        setRequests(demo ? DEMO_RESTOCKS.filter(r => r.partner_id === demo.id) : []);
        if (demo && (demo.kind === 'afiliado' || demo.affiliate_code)) setAffiliate(DEMO_AFFILIATE);
        setLoading(false);
        return;
      }

      // Always the signed-in person's own row, matched by e-mail. (Admins can read every row, so
      // without this filter an admin would have seen whichever partner happened to come first.)
      const query = asAdmin
        ? supabase.from('partners').select('*').eq('id', previewId!)
        : supabase.from('partners').select('*').ilike('email', exactEmail(user.email || ''));
      const { data, error } = await query.limit(1).maybeSingle();
      if (error && /partners/.test(error.message)) setNotSetUp(true);
      const row = (data as Partner) || null;
      setPartner(row);

      if (row) {
        const hasCode = row.kind === 'afiliado' || !!row.affiliate_code;
        const [reqs, aff] = await Promise.all([
          supabase.from('partner_restock_requests').select('*').eq('partner_id', row.id).order('created_at', { ascending: false }),
          !hasCode ? Promise.resolve({ data: null })
            : asAdmin ? affiliateSummaryFor(row)
            : supabase.rpc('affiliate_summary'),
        ]);
        setRequests((reqs.data as RestockRequest[]) || []);
        const a = Array.isArray(aff.data) ? aff.data[0] : aff.data;
        if (a) setAffiliate(a);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const submitRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (preview) { setError('Pré-visualização: nada é enviado em nome do parceiro.'); return; }
    if (!partner || !form.items.trim()) return;
    setSending(true);
    setError('');
    const { error } = await supabase.from('partner_restock_requests').insert([{
      partner_id: partner.id,
      items: form.items.trim(),
      notes: form.notes.trim() || null,
      wanted_date: form.wanted_date || null,
    }]);
    setSending(false);
    if (error) {
      setError('Não conseguimos enviar seu pedido. Tente de novo ou fale com a gente no WhatsApp.');
      return;
    }
    setForm({ items: '', wanted_date: '', notes: '' });
    setSent(true);
    const { data } = await supabase.from('partner_restock_requests').select('*').eq('partner_id', partner.id).order('created_at', { ascending: false });
    setRequests((data as RestockRequest[]) || []);
  };

  // ---------------------------------------------------------------- states
  if (loading) {
    return <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a6a61' }}>Carregando…</main>;
  }

  if (!user) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--color-background)', padding: 'clamp(4.5rem, 12vw, 9rem) 1rem 4rem' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', color: 'var(--color-primary)', marginBottom: '1rem' }}>
            Portal do Parceiro
          </h1>
          <p style={{ color: '#594a42', lineHeight: 1.8, marginBottom: '2rem' }}>
            Entre com o e-mail que você usou para fazer a parceria com a gente.
          </p>
          <div style={card}><LoginPanel message="Entrar no portal" subMessage="Use o mesmo e-mail cadastrado na parceria." /></div>
        </div>
      </main>
    );
  }

  if (!partner) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--color-background)', padding: 'clamp(4.5rem, 12vw, 9rem) 1rem 4rem' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', ...card, textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.6rem, 4.5vw, 2.2rem)', color: 'var(--color-primary)', marginBottom: '1rem' }}>
            Ainda não achamos sua parceria
          </h1>
          <p style={{ color: '#594a42', lineHeight: 1.8, marginBottom: '1.5rem' }}>
            {notSetUp
              ? 'O portal está sendo preparado. Fale com a gente no WhatsApp e resolvemos na hora.'
              : <>A conta <strong>{user.email}</strong> não está ligada a nenhuma parceria. Se você usa outro e-mail com a gente, entre com ele — ou peça a parceria em uma das páginas de parcerias.</>}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/b2b/hotels" className="btn btn-primary" style={{ padding: '0.9rem 1.6rem' }}>Ver as parcerias</Link>
            <a href={`https://wa.me/${STORE_WHATSAPP}?text=Ol%C3%A1%21%20Quero%20acessar%20o%20Portal%20do%20Parceiro.`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.9rem 1.6rem' }}>
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </main>
    );
  }

  const status = PARTNER_STATUS[partner.status];
  const kind = partnerKind(partner.kind);
  const delivered = requests.filter(r => r.status === 'entregue').length;
  const goalPct = partner.monthly_goal > 0 ? Math.min(100, Math.round((delivered / partner.monthly_goal) * 100)) : 0;

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-background)', padding: 'clamp(4.5rem, 12vw, 9rem) 1rem 4rem' }}>
      {preview && <PreviewBanner who={partner.business_name} area="Portal do Parceiro" />}
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{ ...label, display: 'block' }}>Portal do Parceiro</span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.9rem, 5vw, 3rem)', color: 'var(--color-primary)', lineHeight: 1.15, marginBottom: '0.75rem' }}>
            {kind.emoji} {partner.business_name}
          </h1>
          <span style={{ display: 'inline-block', background: status.bg, color: status.color, padding: '0.35rem 1rem', borderRadius: '30px', fontSize: '0.85rem', fontWeight: 700 }}>
            {status.label}
          </span>
          <p style={{ color: '#7a6a61', marginTop: '0.75rem', fontSize: '0.95rem' }}>{status.hint}</p>
        </div>

        {/* A note from Dolly */}
        {partner.portal_message && (
          <div style={{ ...card, marginBottom: '1.25rem', background: '#fdf7ee', borderColor: 'rgba(212,175,55,0.5)' }}>
            <span style={label}>Recado da Dolly</span>
            <p style={{ color: '#594a42', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{partner.portal_message}</p>
          </div>
        )}

        <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', alignItems: 'start' }}>

          {/* Our agreement */}
          <div style={card}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: 'var(--color-primary)', marginBottom: '1.25rem' }}>Nossa parceria</h2>
            <dl style={{ margin: 0, display: 'grid', gap: '0.9rem' }}>
              <div><dt style={label}>Tipo</dt><dd style={{ margin: 0, color: '#3c2a21' }}>{kind.label}</dd></div>
              {partner.contact_name && <div><dt style={label}>Contato</dt><dd style={{ margin: 0, color: '#3c2a21' }}>{partner.contact_name}</dd></div>}
              {(partner.address || partner.neighborhood) && (
                <div><dt style={label}>Endereço</dt><dd style={{ margin: 0, color: '#3c2a21' }}>{[partner.address, partner.neighborhood].filter(Boolean).join(' — ')}</dd></div>
              )}
              {partner.commission_pct > 0 && (
                <div><dt style={label}>{partner.kind === 'afiliado' ? 'Sua comissão' : 'Sua margem'}</dt>
                  <dd style={{ margin: 0, color: '#3c2a21', fontWeight: 700 }}>{partner.commission_pct}%</dd></div>
              )}
              {partner.affiliate_code && (
                <div>
                  <dt style={label}>Seu código</dt>
                  <dd style={{ margin: 0 }}>
                    <code style={{ background: '#f5efe2', color: '#8a6d1f', padding: '0.4rem 0.9rem', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                      {partner.affiliate_code}
                    </code>
                    <span style={{ display: 'block', color: '#7a6a61', fontSize: '0.85rem', marginTop: '0.5rem', lineHeight: 1.6 }}>
                      Quem digitar este código no checkout conta como sua indicação.
                    </span>
                  </dd>
                </div>
              )}
            </dl>

            {partner.monthly_goal > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <span style={label}>Meta do mês</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#594a42', marginBottom: '0.4rem' }}>
                  <span>{delivered} de {partner.monthly_goal} reposições entregues</span>
                  <strong>{goalPct}%</strong>
                </div>
                <div style={{ width: '100%', height: '10px', background: '#f0e9dd', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${goalPct}%`, height: '100%', background: 'linear-gradient(90deg, #f4c542, #e2792a)', transition: 'width 0.4s' }} />
                </div>
              </div>
            )}
          </div>

          {/* Affiliate numbers */}
          {affiliate && (
            <div style={card}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: 'var(--color-primary)', marginBottom: '1.25rem' }}>Suas indicações</h2>
              <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
                <div>
                  <span style={label}>Pedidos</span>
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.9rem', color: '#3c2a21' }}>{affiliate.orders_count}</p>
                </div>
                <div>
                  <span style={label}>Vendas</span>
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.9rem', color: '#3c2a21' }}>{formatBRL(affiliate.revenue || 0)}</p>
                </div>
                <div>
                  <span style={label}>Sua comissão</span>
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.9rem', color: '#0b6b3a' }}>{formatBRL(affiliate.commission || 0)}</p>
                </div>
              </div>
              <p style={{ color: '#a89a90', fontSize: '0.8rem', lineHeight: 1.7, marginTop: '1.25rem' }}>
                Conta os pedidos feitos no site com o seu código. O pagamento das comissões é combinado com a Dolly no WhatsApp.
              </p>
            </div>
          )}

          {/* Restock */}
          <div style={{ ...card, gridColumn: affiliate ? '1 / -1' : undefined }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Pedir reposição</h2>
            <p style={{ color: '#7a6a61', fontSize: '0.92rem', lineHeight: 1.7, marginBottom: '1.25rem' }}>
              Diga o que está faltando. O pedido cai direto na caixa de entrada da padaria e a Dolly confirma com você.
            </p>

            {partner.status !== 'ativo' ? (
              <p style={{ background: status.bg, color: status.color, borderRadius: '12px', padding: '1rem 1.15rem', lineHeight: 1.7 }}>
                {partner.status === 'pendente'
                  ? 'Assim que a parceria for aprovada, o pedido de reposição aparece aqui.'
                  : 'A parceria está pausada. Fale com a gente para retomar os pedidos.'}
              </p>
            ) : (
              <form onSubmit={submitRestock} style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={label} htmlFor="items">O que você precisa</label>
                  <textarea id="items" required rows={3} value={form.items} onChange={e => { setForm({ ...form, items: e.target.value }); setSent(false); }}
                    placeholder="Ex: 20 brownies de cacau, 10 tortinhas de maracujá" style={{ ...input, resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 180px' }}>
                    <label style={label} htmlFor="wanted">Para quando</label>
                    <input id="wanted" type="date" value={form.wanted_date} onChange={e => setForm({ ...form, wanted_date: e.target.value })} style={input} />
                  </div>
                  <div style={{ flex: '2 1 240px' }}>
                    <label style={label} htmlFor="notes">Observações</label>
                    <input id="notes" type="text" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Horário melhor para entrega, quem recebe…" style={input} />
                  </div>
                </div>
                {error && <p style={{ color: '#c0392b', fontSize: '0.9rem' }}>{error}</p>}
                {sent && <p style={{ color: '#0b6b3a', fontWeight: 700 }}>Pedido enviado ✓ A Dolly já recebeu.</p>}
                <button type="submit" disabled={sending} className="btn btn-primary" style={{ padding: '1rem 1.75rem', justifySelf: 'start' }}>
                  {sending ? 'Enviando…' : 'Enviar pedido'}
                </button>
              </form>
            )}

            {requests.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <span style={label}>Seus pedidos</span>
                <div style={{ display: 'grid', gap: '0.6rem', marginTop: '0.75rem' }}>
                  {requests.map(r => {
                    const st = RESTOCK_STATUS[r.status];
                    return (
                      <div key={r.id} style={{ border: '1px solid #f0e9dd', borderRadius: '12px', padding: '0.85rem 1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ flex: 1, minWidth: '200px', color: '#3c2a21', lineHeight: 1.6 }}>{r.items}</span>
                        {r.wanted_date && (
                          <span style={{ color: '#7a6a61', fontSize: '0.85rem' }}>
                            para {new Date(r.wanted_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </span>
                        )}
                        <span style={{ background: st.bg, color: st.color, fontSize: '0.78rem', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: '20px' }}>{st.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Help */}
        <div style={{ ...card, marginTop: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <p style={{ color: '#594a42', lineHeight: 1.7, margin: 0 }}>
            Qualquer coisa fora disso — volumes, preços, um evento no seu espaço — é só chamar.
          </p>
          <a href={`https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(`Olá! Sou parceiro (${partner.business_name}) e queria falar sobre `)}`}
            target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.85rem 1.5rem', whiteSpace: 'nowrap' }}>
            Falar com a Dolly
          </a>
        </div>

        <p style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link href="/" style={{ color: '#7a6a61', fontSize: '0.9rem' }}>← Voltar para o site</Link>
        </p>
      </div>
    </main>
  );
}

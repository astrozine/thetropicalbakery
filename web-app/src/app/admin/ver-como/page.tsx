'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import LoginPanel from '@/components/LoginPanel';
import { DEMO_PARTNERS, DEMO_WORKERS } from '@/lib/demoPortals';
import { PARTNER_STATUS, partnerKind, workerRole, type Partner, type Worker } from '@/lib/portals';

/**
 * "Ver como": every private area of the site, seen through the eyes of the person who uses it.
 *
 * - Where each kind of person signs in (the audit).
 * - The sign-in screen itself, in demo mode (nothing is sent).
 * - Customer, partner and staff areas, live in a frame. Partner and staff previews open that
 *   person's real area read-only (`?preview=<id>`, allowed for admins only by the database).
 */

type Tab = 'login' | 'cliente' | 'parceiro' | 'equipe';

const AREAS: { who: string; emoji: string; where: string; how: string; sees: string }[] = [
  { who: 'Clientes', emoji: '🛍️', where: '/minha-conta', how: 'Google, Facebook, código por WhatsApp/SMS ou link por e-mail. O login também aparece no checkout e no botão "Entrar" do topo.', sees: 'Dados salvos (nome, WhatsApp, endereço), preferências de dieta, retiradas com o endereço liberado após o pagamento, assinatura e a newsletter.' },
  { who: 'Parceiros B2B', emoji: '🤝', where: '/parceiro', how: 'Os mesmos métodos, com o e-mail cadastrado em Parceiros B2B. Sem esse e-mail a pessoa vê "Ainda não achamos sua parceria".', sees: 'Status da parceria, recado da Dolly, pedidos de reposição, meta do mês e, para afiliados, vendas e comissão do código.' },
  { who: 'Equipe', emoji: '📋', where: '/equipe', how: 'Os mesmos métodos, com o e-mail cadastrado em Escala da Equipe (só quem está "ativo").', sees: 'Próximos turnos, horas e pagamento do mês, e o recado da Dolly.' },
  { who: 'Administradores', emoji: '🔑', where: '/admin/login', how: 'Só e-mails na lista de Administradores.', sees: 'Este painel.' },
];

export default function VerComoPage() {
  const [tab, setTab] = useState<Tab>('login');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [width, setWidth] = useState<'phone' | 'desktop'>('phone');
  const [frameKey, setFrameKey] = useState(0);

  useEffect(() => {
    supabase.from('partners').select('*').order('business_name').then(({ data }) => setPartners((data as Partner[]) || []));
    supabase.from('workers').select('*').order('full_name').then(({ data }) => setWorkers((data as Worker[]) || []));
  }, []);

  const src = tab === 'cliente' ? '/minha-conta'
    : tab === 'parceiro' && selected ? `/parceiro?preview=${selected}`
    : tab === 'equipe' && selected ? `/equipe?preview=${selected}`
    : null;

  // Partner and staff tabs open on the first example, so there is always something to look at.
  const pick = (t: Tab) => {
    setTab(t);
    setSelected(t === 'parceiro' ? DEMO_PARTNERS[0].id : t === 'equipe' ? DEMO_WORKERS[0].id : null);
    setFrameKey(k => k + 1);
  };

  const tabBtn = (t: Tab, label: string) => (
    <button key={t} type="button" onClick={() => pick(t)} aria-pressed={tab === t}
      style={{ padding: '0.65rem 1.1rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.92rem',
        background: tab === t ? '#2c3e50' : '#fff', color: tab === t ? '#fff' : '#2c3e50', boxShadow: '0 2px 5px rgba(0,0,0,0.06)' }}>
      {label}
    </button>
  );

  const personBtn = (id: string, title: string, sub: string, badge?: { label: string; color: string; bg: string }) => (
    <button key={id} type="button" onClick={() => { setSelected(id); setFrameKey(k => k + 1); }}
      style={{ width: '100%', textAlign: 'left', padding: '0.75rem 0.9rem', borderRadius: '10px', cursor: 'pointer',
        border: selected === id ? '2px solid #d4af37' : '1px solid #eef1f4', background: selected === id ? '#fdf7ee' : '#fff' }}>
      <strong style={{ display: 'block', color: '#2c3e50' }}>{title}</strong>
      <span style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>{sub}</span>
      {badge && <span style={{ marginLeft: '0.4rem', fontSize: '0.72rem', fontWeight: 700, color: badge.color, background: badge.bg, padding: '0.1rem 0.45rem', borderRadius: '6px' }}>{badge.label}</span>}
    </button>
  );

  return (
    <div style={{ maxWidth: '1400px' }}>
      <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '0.5rem' }}>👀 Ver como</h1>
      <p style={{ color: '#7f8c8d', marginBottom: '1.75rem', maxWidth: '760px', lineHeight: 1.7 }}>
        O que clientes, parceiros e a equipe veem quando entram no site. As pré-visualizações são só para olhar: nada é enviado em nome de ninguém.
      </p>

      {/* The audit: where each person signs in */}
      <div style={{ display: 'grid', gap: '0.9rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginBottom: '2rem' }}>
        {AREAS.map(a => (
          <div key={a.who} style={{ background: '#fff', borderRadius: '12px', padding: '1.1rem 1.2rem', boxShadow: '0 3px 6px rgba(0,0,0,0.05)' }}>
            <p style={{ fontWeight: 800, color: '#2c3e50', marginBottom: '0.35rem' }}>{a.emoji} {a.who}</p>
            <a href={a.where} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#a6832b', fontWeight: 700 }}>{a.where} ↗</a>
            <p style={{ fontSize: '0.84rem', color: '#594a42', lineHeight: 1.6, margin: '0.5rem 0 0.35rem' }}><strong>Como entra:</strong> {a.how}</p>
            <p style={{ fontSize: '0.84rem', color: '#594a42', lineHeight: 1.6, margin: 0 }}><strong>O que vê:</strong> {a.sees}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {tabBtn('login', '🔐 Tela de login')}
        {tabBtn('cliente', '🛍️ Cliente')}
        {tabBtn('parceiro', `🤝 Parceiros (${partners.length})`)}
        {tabBtn('equipe', `📋 Equipe (${workers.length})`)}
      </div>

      <div className="ver-como-grid">
        {/* Left: who to look at */}
        <aside style={{ display: 'grid', gap: '0.5rem', alignContent: 'start' }}>
          {tab === 'login' && (
            <p style={{ color: '#594a42', fontSize: '0.9rem', lineHeight: 1.7 }}>
              É a mesma tela nas três áreas e no checkout. Só aparecem os métodos ligados no Supabase. Aqui é uma demonstração: dá para clicar em tudo e nada é enviado.
            </p>
          )}
          {tab === 'cliente' && (
            <p style={{ color: '#594a42', fontSize: '0.9rem', lineHeight: 1.7 }}>
              Esta é <strong>a sua própria</strong> Minha Conta, que é exatamente a tela que qualquer cliente vê com os dados dele. Para ver a versão de quem ainda não entrou, use a aba Tela de login.
            </p>
          )}
          {tab === 'parceiro' && (<>
            <p style={{ color: '#7f8c8d', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Exemplos inventados</p>
            {DEMO_PARTNERS.map(p => personBtn(p.id, `${partnerKind(p.kind).emoji} ${p.business_name}`, `${p.contact_name} · exemplo`, PARTNER_STATUS[p.status]))}
            <p style={{ color: '#7f8c8d', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0.6rem 0 0' }}>Parceiros de verdade</p>
            {partners.length === 0
              ? <p style={{ color: '#7f8c8d', fontSize: '0.88rem', margin: 0 }}>Nenhum parceiro cadastrado ainda. Cadastre em Parceiros B2B.</p>
              : partners.map(p => personBtn(p.id, `${partnerKind(p.kind).emoji} ${p.business_name}`, p.email, PARTNER_STATUS[p.status]))}
          </>)}
          {tab === 'equipe' && (<>
            <p style={{ color: '#7f8c8d', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Exemplos inventados</p>
            {DEMO_WORKERS.map(w => personBtn(w.id, w.full_name, `${workerRole(w.role).label} · ${w.notes}`))}
            <p style={{ color: '#7f8c8d', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0.6rem 0 0' }}>Equipe de verdade</p>
            {workers.length === 0
              ? <p style={{ color: '#7f8c8d', fontSize: '0.88rem', margin: 0 }}>Ninguém na equipe ainda. Cadastre em Escala da Equipe.</p>
              : workers.map(w => personBtn(w.id, w.full_name, `${workerRole(w.role).label} · ${w.email}`,
                  w.status === 'ativo' ? undefined : { label: 'Inativo: não consegue entrar', color: '#c0392b', bg: '#fdecea' }))}
          </>)}
          {(tab === 'parceiro' || tab === 'equipe') && !selected && (
            <p style={{ color: '#7f8c8d', fontSize: '0.85rem' }}>Escolha alguém para ver a área dessa pessoa.</p>
          )}
        </aside>

        {/* Right: the preview */}
        <section style={{ background: '#e9edf1', borderRadius: '16px', padding: '1rem', minHeight: '520px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
            <div role="group" aria-label="Tamanho da tela" style={{ display: 'inline-flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cfd6dd' }}>
              {(['phone', 'desktop'] as const).map(w => (
                <button key={w} type="button" onClick={() => setWidth(w)} aria-pressed={width === w}
                  style={{ padding: '0.45rem 0.9rem', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', background: width === w ? '#2c3e50' : '#fff', color: width === w ? '#fff' : '#2c3e50' }}>
                  {w === 'phone' ? '📱 Celular' : '🖥️ Computador'}
                </button>
              ))}
            </div>
            {src && <a href={src} target="_blank" rel="noopener noreferrer" style={{ color: '#2c3e50', fontWeight: 800, fontSize: '0.88rem' }}>Abrir em nova aba ↗</a>}
          </div>

          <div style={{ margin: '0 auto', width: width === 'phone' ? '390px' : '100%', maxWidth: '100%', background: '#fdfaf3', borderRadius: width === 'phone' ? '28px' : '10px', border: width === 'phone' ? '10px solid #2c3e50' : '1px solid #cfd6dd', overflow: 'hidden' }}>
            {tab === 'login' ? (
              <div style={{ padding: '1.5rem 1rem', minHeight: '480px' }}>
                <LoginPanel demo message="Entrar no portal" subMessage="Use o mesmo e-mail cadastrado." />
              </div>
            ) : src ? (
              <iframe key={`${src}-${frameKey}`} src={src} title="Pré-visualização" style={{ display: 'block', width: '100%', height: '760px', border: 0 }} />
            ) : (
              <div style={{ minHeight: '480px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#95a5a6', padding: '2rem', textAlign: 'center' }}>
                A pré-visualização aparece aqui.
              </div>
            )}
          </div>
        </section>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .ver-como-grid { display: grid; gap: 1.5rem; grid-template-columns: minmax(0, 1fr); align-items: start; }
        @media (min-width: 1000px) { .ver-como-grid { grid-template-columns: 300px minmax(0, 1fr); } }
      ` }} />
    </div>
  );
}

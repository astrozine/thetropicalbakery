'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import LoginPanel from '@/components/LoginPanel';
import { formatBRL } from '@/lib/deliveryZones';
import { MONTH_NAMES, SHIFT_STATUS, Worker, WorkShift, monthPay, shiftHours, workerRole } from '@/lib/portals';

const STORE_WHATSAPP = '5511932119196';

const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #e8e1d7', borderRadius: '20px',
  padding: 'clamp(1.25rem, 3vw, 2rem)', boxShadow: '0 8px 24px rgba(60,42,33,0.05)',
};
const label: React.CSSProperties = {
  display: 'block', fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase',
  color: '#a6832b', fontWeight: 700, marginBottom: '0.4rem',
};

const fmtDay = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

const hhmm = (t: string | null) => (t ? t.slice(0, 5) : '');

/** Staff area: the shifts you have coming, what you've done this month, and what it pays. */
export default function WorkerPortalPage() {
  const { user } = useAuth();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [notSetUp, setNotSetUp] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const load = async () => {
      const { data, error } = await supabase.from('workers').select('*').limit(1).maybeSingle();
      if (error && /workers/.test(error.message)) setNotSetUp(true);
      const row = (data as Worker) || null;
      setWorker(row);
      if (row) {
        const { data: s } = await supabase.from('work_shifts').select('*').order('shift_date');
        setShifts((s as WorkShift[]) || []);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const view = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const monthPrefix = `${view.getFullYear()}-${String(view.getMonth() + 1).padStart(2, '0')}`;
  const monthShifts = shifts.filter(s => s.shift_date.startsWith(monthPrefix));
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = shifts.filter(s => s.shift_date >= today && s.status === 'agendado').slice(0, 5);
  const pay = worker ? monthPay(worker, monthShifts) : null;

  if (loading) {
    return <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a6a61' }}>Carregando…</main>;
  }

  if (!user) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--color-background)', padding: 'clamp(7rem, 12vw, 9rem) 1rem 4rem' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', color: 'var(--color-primary)', marginBottom: '1rem' }}>
            Área da Equipe
          </h1>
          <p style={{ color: '#594a42', lineHeight: 1.8, marginBottom: '2rem' }}>
            Entre com o e-mail que a Dolly cadastrou para você.
          </p>
          <div style={card}><LoginPanel message="Entrar na área da equipe" subMessage="Mesmo e-mail que você deu para a Tropical Bakery." /></div>
        </div>
      </main>
    );
  }

  if (!worker) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--color-background)', padding: 'clamp(7rem, 12vw, 9rem) 1rem 4rem' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', ...card, textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.6rem, 4.5vw, 2.2rem)', color: 'var(--color-primary)', marginBottom: '1rem' }}>
            Esta conta não está na equipe
          </h1>
          <p style={{ color: '#594a42', lineHeight: 1.8, marginBottom: '1.5rem' }}>
            {notSetUp
              ? 'A área da equipe está sendo preparada. Fale com a Dolly no WhatsApp.'
              : <>Não encontramos <strong>{user.email}</strong> na equipe. Se você usa outro e-mail, entre com ele. Quer trabalhar com a gente?</>}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/trabalhe-conosco" className="btn btn-primary" style={{ padding: '0.9rem 1.6rem' }}>Ver as vagas</Link>
            <a href={`https://wa.me/${STORE_WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.9rem 1.6rem' }}>Falar no WhatsApp</a>
          </div>
        </div>
      </main>
    );
  }

  const role = workerRole(worker.role);
  const firstName = worker.full_name.split(' ')[0];

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-background)', padding: 'clamp(7rem, 12vw, 9rem) 1rem 4rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{ ...label, display: 'block' }}>Área da Equipe</span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.9rem, 5vw, 3rem)', color: 'var(--color-primary)', lineHeight: 1.15, marginBottom: '0.5rem' }}>
            Oi, {firstName}!
          </h1>
          <p style={{ color: '#7a6a61' }}>{role.emoji} {role.label}</p>
        </div>

        {worker.portal_message && (
          <div style={{ ...card, marginBottom: '1.25rem', background: '#fdf7ee', borderColor: 'rgba(212,175,55,0.5)' }}>
            <span style={label}>Recado da Dolly</span>
            <p style={{ color: '#594a42', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{worker.portal_message}</p>
          </div>
        )}

        {/* Next shifts */}
        <div style={{ ...card, marginBottom: '1.25rem' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: 'var(--color-primary)', marginBottom: '1rem' }}>Seus próximos turnos</h2>
          {upcoming.length === 0 ? (
            <p style={{ color: '#7a6a61', lineHeight: 1.7 }}>
              Nenhum turno agendado por enquanto. Quando a Dolly montar a escala, ela aparece aqui.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '0.7rem' }}>
              {upcoming.map(s => (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
                  border: '1px solid rgba(212,175,55,0.4)', background: 'rgba(212,175,55,0.07)',
                  borderRadius: '14px', padding: '0.9rem 1.1rem',
                }}>
                  <span aria-hidden style={{ fontSize: '1.6rem' }}>📅</span>
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <p style={{ color: '#3c2a21', fontWeight: 700, textTransform: 'capitalize' }}>{fmtDay(s.shift_date)}</p>
                    <p style={{ color: '#7a6a61', fontSize: '0.9rem' }}>
                      {s.start_time && s.end_time ? `${hhmm(s.start_time)} às ${hhmm(s.end_time)}` : 'horário a combinar'}
                      {s.task ? ` · ${s.task}` : ''}
                    </p>
                  </div>
                  {shiftHours(s) > 0 && <span style={{ color: '#8a6d1f', fontWeight: 700 }}>{shiftHours(s)}h</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* This month */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: 'var(--color-primary)', flex: 1, textTransform: 'capitalize' }}>
              {MONTH_NAMES[view.getMonth()]} de {view.getFullYear()}
            </h2>
            <button type="button" onClick={() => setMonthOffset(m => m - 1)} aria-label="Mês anterior"
              style={{ width: '38px', height: '38px', borderRadius: '50%', border: '1px solid rgba(212,175,55,0.6)', background: '#fff', cursor: 'pointer', color: '#3c2a21' }}>‹</button>
            <button type="button" onClick={() => setMonthOffset(m => m + 1)} disabled={monthOffset >= 0} aria-label="Próximo mês"
              style={{ width: '38px', height: '38px', borderRadius: '50%', border: '1px solid rgba(212,175,55,0.6)', background: '#fff', cursor: monthOffset >= 0 ? 'default' : 'pointer', opacity: monthOffset >= 0 ? 0.35 : 1, color: '#3c2a21' }}>›</button>
          </div>

          {pay && (
            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', marginBottom: '1.5rem' }}>
              <div>
                <span style={label}>Turnos feitos</span>
                <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', color: '#3c2a21' }}>{pay.shifts}</p>
              </div>
              <div>
                <span style={label}>Horas</span>
                <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', color: '#3c2a21' }}>{pay.hours}h</p>
              </div>
              <div>
                <span style={label}>{pay.isMonthly ? 'Salário do mês' : 'A receber pelas horas'}</span>
                <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', color: '#0b6b3a' }}>{formatBRL(pay.pay)}</p>
              </div>
              {!pay.isMonthly && pay.pending > 0 && (
                <div>
                  <span style={label}>Ainda não pago</span>
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', color: '#e2792a' }}>{formatBRL(pay.pending)}</p>
                </div>
              )}
            </div>
          )}

          {monthShifts.length === 0 ? (
            <p style={{ color: '#7a6a61' }}>Nenhum turno neste mês.</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {monthShifts.map(s => {
                const st = SHIFT_STATUS[s.status];
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap', borderBottom: '1px solid #f4efe6', padding: '0.6rem 0' }}>
                    <span aria-hidden>{st.emoji}</span>
                    <span style={{ color: '#3c2a21', minWidth: '110px' }}>
                      {new Date(s.shift_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </span>
                    <span style={{ color: '#7a6a61', fontSize: '0.9rem', flex: 1, minWidth: '140px' }}>
                      {s.start_time && s.end_time ? `${hhmm(s.start_time)}–${hhmm(s.end_time)}` : '—'}{s.task ? ` · ${s.task}` : ''}
                    </span>
                    <span style={{ background: st.bg, color: st.color, fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.65rem', borderRadius: '20px' }}>{st.label}</span>
                    {s.status === 'feito' && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: s.paid ? '#0b6b3a' : '#e2792a' }}>
                        {s.paid ? 'pago' : 'a pagar'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <p style={{ color: '#a89a90', fontSize: '0.8rem', lineHeight: 1.7, marginTop: '1.5rem' }}>
            Os valores aqui são o que combinamos por hora ou por mês, antes de descontos. Qualquer diferença, fale com a Dolly —
            vale sempre o que está no seu contrato.
          </p>
        </div>

        <div style={{ ...card, marginTop: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <p style={{ color: '#594a42', lineHeight: 1.7, margin: 0 }}>Precisa trocar um turno, avisar de um atraso ou pedir folga?</p>
          <a href={`https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(`Oi Dolly! Sou ${worker.full_name} e queria falar sobre `)}`}
            target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '0.85rem 1.5rem', whiteSpace: 'nowrap' }}>
            Chamar no WhatsApp
          </a>
        </div>

        <p style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link href="/" style={{ color: '#7a6a61', fontSize: '0.9rem' }}>← Voltar para o site</Link>
        </p>
      </div>
    </main>
  );
}

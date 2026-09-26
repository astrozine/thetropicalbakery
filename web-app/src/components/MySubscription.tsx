'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Subscription, SubscriptionPlan, STATUS_LABELS, DIETARY_FIELDS } from '@/lib/subscriptions';
import { formatBRL } from '@/lib/deliveryZones';
import DeliveryCalendar from '@/components/DeliveryCalendar';

interface Delivery {
  id: string;
  delivery_date: string;
  status: string;
  boxes: number;
}

const DELIVERY_STATUS: Record<string, { label: string; icon: string }> = {
  scheduled: { label: 'Agendada', icon: '📦' },
  prepared: { label: 'Preparada', icon: '👩‍🍳' },
  delivered: { label: 'Entregue', icon: '✅' },
  skipped: { label: 'Pulada', icon: '⏭️' },
};

const WEEKDAY = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export default function MySubscription() {
  const [sub, setSub] = useState<(Subscription & { plan: SubscriptionPlan }) | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    await supabase.rpc('claim_my_subscriptions');

    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*, plan:subscription_plans(*)')
      .order('created_at', { ascending: false });

    const current = (subs || []).find(s => s.status !== 'cancelled') || subs?.[0] || null;
    setSub(current as any);

    if (current) {
      const { data: dels } = await supabase
        .from('subscription_deliveries')
        .select('*')
        .eq('subscription_id', current.id)
        .order('delivery_date');
      setDeliveries(dels || []);
    }
    setLoading(false);
  };

  if (loading || !sub) return null;

  const status = STATUS_LABELS[sub.status];
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = deliveries.filter(d => d.delivery_date >= today);
  const nextDelivery = upcoming[0];
  const visible = deliveries.slice(Math.max(0, deliveries.findIndex(d => d.delivery_date >= today) - 1), deliveries.length).slice(0, 8);
  const activeDietary = DIETARY_FIELDS.filter(f => (sub as any)[f.key]);
  const selectedDelivery = deliveries.find(d => d.delivery_date === selected);

  const whatsappMessage = (intent: string) => encodeURIComponent(
    `Olá! Sou assinante da ${sub.plan?.name || 'Caixa de Degustação'} e gostaria de ${intent}.`
  );

  return (
    <div className="liquid-glass-card fade-in" style={{ padding: 0, overflow: 'hidden', marginBottom: '2rem', border: '1px solid rgba(212,175,55,0.4)' }}>
      {/* Header with box photo */}
      <div style={{ position: 'relative', height: '160px' }}>
        <Image
          src={sub.plan?.image_url || '/box2.jpg'}
          alt={sub.plan?.name || 'Caixa de Degustação'}
          fill
          style={{ objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(60,42,33,0.1) 0%, rgba(60,42,33,0.85) 100%)' }} />
        <div style={{ position: 'absolute', bottom: '1rem', left: '1.5rem', right: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <p style={{ color: 'rgba(253,250,243,0.75)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>
              Sua assinatura
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', color: '#fdfaf3' }}>
              {sub.plan?.name || 'Caixa de Degustação'}
            </h2>
          </div>
          <span style={{ background: status.bg, color: status.color, padding: '0.3rem 0.9rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700 }}>
            {status.label}
          </span>
        </div>
      </div>

      <div style={{ padding: 'clamp(1.25rem, 4vw, 2rem)' }}>
        {/* Next delivery highlight */}
        {nextDelivery && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.35)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '1.8rem' }}>📦</div>
            <div>
              <p style={{ fontWeight: 700, color: '#3c2a21', fontSize: '1rem' }}>
                {daysUntil(nextDelivery.delivery_date) === 0 ? 'Sua caixa chega hoje!' :
                 daysUntil(nextDelivery.delivery_date) === 1 ? 'Sua caixa chega amanhã!' :
                 `Sua próxima caixa chega em ${daysUntil(nextDelivery.delivery_date)} dias`}
              </p>
              <p style={{ color: '#7a6a61', fontSize: '0.85rem' }}>
                {new Date(nextDelivery.delivery_date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
        )}

        {/* Calendar strip */}
        {visible.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
              Calendário de entregas
            </p>
            <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {visible.map(d => {
                const date = new Date(d.delivery_date + 'T00:00:00');
                const isNext = nextDelivery?.id === d.id;
                const isPast = d.delivery_date < today;
                const meta = DELIVERY_STATUS[d.status] || DELIVERY_STATUS.scheduled;
                const isSelected = selected === d.delivery_date;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelected(isSelected ? null : d.delivery_date)}
                    style={{
                      flexShrink: 0, width: '68px', padding: '0.75rem 0.4rem', borderRadius: '12px',
                      border: isNext ? '2px solid #d4af37' : '1px solid #e8e1d7',
                      background: isNext ? 'rgba(212,175,55,0.15)' : isPast ? '#f7f4ec' : '#fff',
                      opacity: isPast && d.status !== 'delivered' ? 0.6 : 1,
                      cursor: 'pointer', textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: '#a89a90', textTransform: 'uppercase' }}>{WEEKDAY[date.getDay()]}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#3c2a21' }}>{date.getDate()}</div>
                    <div style={{ fontSize: '1rem' }}>{meta.icon}</div>
                  </button>
                );
              })}
            </div>
            {selectedDelivery && (
              <div style={{ marginTop: '0.85rem', fontSize: '0.85rem', color: '#594a42', background: '#fdf7ee', padding: '0.65rem 1rem', borderRadius: '8px' }}>
                {new Date(selectedDelivery.delivery_date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })} ·{' '}
                {DELIVERY_STATUS[selectedDelivery.status]?.label || selectedDelivery.status} · {selectedDelivery.boxes} caixa(s)
              </div>
            )}
          </div>
        )}

        {/* The shared, cheerful box calendar — your own deliveries are the teal stars */}
        <div style={{ marginBottom: '1.5rem' }}>
          <DeliveryCalendar
            title="Dias de caixa"
            highlight={upcoming.filter(d => d.status !== 'skipped').map(d => d.delivery_date)}
          />
        </div>

        {/* Plan facts */}
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', fontSize: '0.9rem', color: '#594a42' }}>
          <div><strong style={{ color: '#3c2a21' }}>{sub.boxes_per_week}x</strong> por semana</div>
          <div><strong style={{ color: '#3c2a21' }}>{formatBRL(sub.monthly_price || 0)}</strong>/mês</div>
          {activeDietary.length > 0 && (
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {activeDietary.map(f => (
                <span key={f.key} style={{ background: '#fdf7ee', color: '#8a6d1f', padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {f.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a href={`https://wa.me/5511932119196?text=${whatsappMessage('pular a próxima entrega')}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}>
            Pular próxima entrega
          </a>
          <a href={`https://wa.me/5511932119196?text=${whatsappMessage('pausar minha assinatura')}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}>
            Pausar assinatura
          </a>
          <a href={`https://wa.me/5511932119196?text=${whatsappMessage('falar sobre minha assinatura')}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}>
            Falar com a Dolly
          </a>
        </div>
      </div>
    </div>
  );
}

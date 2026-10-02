'use client';

import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { BoxItem } from '@/lib/allergens';
import { boxPlan, namesText, surpriseText } from '@/lib/boxPicks';
import { toTreatCount } from '@/lib/boxSizes';
import BoxTreatPicker from '@/components/BoxTreatPicker';
import { nextBakeBox } from '@/lib/boxWindow';

interface Props {
  subscriptionId: string;
  boxSize: number | null | undefined;
}

interface ActiveBox { id: string; title: string; items: BoxItem[] | null }

/**
 * "Escolha os doces da sua caixa": a subscriber chooses this week's favourites (2-box) or extras
 * (6-box) from the active box, or rolls the dice and Dolly chooses. Saved as soon as the box is full,
 * through set_subscription_picks (migration 28), which checks it is their subscription and their size.
 * Hidden when there is no active box with treats, or before the migration has run.
 */
export default function SubscriberPicks({ subscriptionId, boxSize }: Props) {
  const [box, setBox] = useState<ActiveBox | null>(null);
  const [ready, setReady] = useState(false);
  const [picks, setPicks] = useState<string[]>([]);
  const [surprise, setSurprise] = useState(false);
  const [saved, setSaved] = useState<'none' | 'saved' | 'saving' | 'error'>('none');
  const [message, setMessage] = useState('');
  const loadedFor = useRef('');

  const size = toTreatCount(boxSize);
  const treats = (Array.isArray(box?.items) ? box!.items! : []).filter(i => i && i.id && i.name);
  const plan = boxPlan(treats.length, size);

  useEffect(() => {
    if (loadedFor.current === subscriptionId) return;
    loadedFor.current = subscriptionId;
    (async () => {
      // Next week's pre-sale when there is one: that is the box their treats are baked in.
      const { data: live } = await supabase.from('tasting_boxes').select('*').eq('is_active', true);
      const active = nextBakeBox(live as (ActiveBox & { sale_mode?: string | null })[] | null);
      if (!active) { setReady(true); return; }
      const { data: row, error } = await supabase
        .from('subscription_picks').select('picks, surprise')
        .eq('subscription_id', subscriptionId).eq('tasting_box_id', active.id).maybeSingle();
      if (error) { setReady(true); return; } // migration 28 not run yet: say nothing
      setBox(active as ActiveBox);
      if (row) {
        setPicks(Array.isArray(row.picks) ? row.picks.map(String) : []);
        setSurprise(!!row.surprise);
        setSaved('saved');
      }
      setReady(true);
    })();
  }, [subscriptionId]);

  const save = async (nextPicks: string[], nextSurprise: boolean) => {
    if (!box) return;
    setSaved('saving');
    setMessage('');
    const { error } = await supabase.rpc('set_subscription_picks', {
      p_subscription_id: subscriptionId, p_box_id: box.id, p_picks: nextSurprise ? [] : nextPicks, p_surprise: nextSurprise,
    });
    if (error) {
      console.error(error);
      setSaved('error');
      setMessage(error.message && !/function|schema|permission/i.test(error.message) ? error.message : 'Não conseguimos salvar agora. Tente de novo.');
      return;
    }
    setSaved('saved');
  };

  if (!ready || !box || treats.length === 0) return null;

  const onPicks = (p: string[]) => {
    setSurprise(false);
    setPicks(p);
    if (p.length === plan.picks) save(p, false);
    else setSaved('none'); // an unfinished choice is not saved; the last full one still stands on the server
  };
  const onSurprise = (on: boolean) => {
    setSurprise(on);
    if (on) { setPicks([]); save([], true); } else setSaved('none');
  };

  const names = picks.map(id => treats.find(t => t.id === id)?.name).filter(Boolean) as string[];
  const chosen = plan.picks === 0 || saved === 'saved';

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', marginBottom: '0.75rem', borderRadius: '12px',
        background: chosen ? 'rgba(46,125,79,0.08)' : '#d4af37', color: chosen ? '#2e7d4f' : '#3c2a21',
        border: chosen ? '1px solid rgba(46,125,79,0.3)' : 'none',
      }}>
        <span style={{ fontSize: '1.5rem' }} aria-hidden>{chosen ? '✅' : '🍫'}</span>
        <div style={{ lineHeight: 1.4 }}>
          <p style={{ fontWeight: 800, fontSize: '0.98rem' }}>
            {plan.picks === 0 ? 'Sua caixa desta semana' : chosen ? 'Escolha salva' : 'Escolha os doces da sua próxima caixa'}
          </p>
          <p style={{ fontSize: '0.85rem', opacity: 0.9 }}>
            {plan.picks === 0 ? box.title
              : chosen ? (surprise ? surpriseText(plan) : `${plan.fixed > 0 ? 'completa + ' : ''}${namesText(names)}`) + '. Pode mudar enquanto esta caixa estiver aberta.'
              : `${box.title}. Sem escolha, a Dolly escolhe por você 🎲`}
          </p>
        </div>
      </div>

      <BoxTreatPicker
        items={treats} plan={plan} picks={surprise ? [] : picks.slice(0, plan.picks)}
        onChange={onPicks} surprise={surprise} onSurprise={onSurprise}
        kicker={`Caixa de ${size} doces · ${box.title}`}
      />

      {saved === 'saving' && <p style={{ fontSize: '0.85rem', color: '#7a6a61', marginTop: '0.5rem', textAlign: 'center' }}>Salvando…</p>}
      {saved === 'error' && <p style={{ fontSize: '0.88rem', color: '#c0392b', marginTop: '0.5rem', textAlign: 'center' }}>{message}</p>}
    </div>
  );
}

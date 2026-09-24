'use client';

import React, { useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ALLERGENS, ALLERGEN_GROUPS, BoxItem, summarizeAllergens } from '@/lib/allergens';
import { DIET_TAGS, matchDiet } from '@/lib/dietary';

export interface DietTargetingValue {
  /** Only people who marked at least one of these. */
  tags: string[];
  /** Only people who avoid at least one of these. */
  avoiding: string[];
  /** What the box / treats this message is about really contain. */
  contains: string[];
  mayContain: string[];
  /** Leave the people it clashes with out of this send. */
  skipConflicts: boolean;
}

export const EMPTY_TARGETING: DietTargetingValue = {
  tags: [], avoiding: [], contains: [], mayContain: [], skipConflicts: false,
};

export interface DietContact {
  diet_tags?: string[] | null;
  allergens_avoid?: string[] | null;
}

interface Props {
  value: DietTargetingValue;
  onChange: (v: DietTargetingValue) => void;
  /** The people who could already receive this campaign, for the counts. */
  audience: DietContact[];
}

const chip = (on: boolean, n: number, color = '#d4af37'): React.CSSProperties => ({
  padding: '0.35rem 0.75rem', borderRadius: '999px', cursor: 'pointer', fontSize: '0.8rem',
  border: `1px solid ${on ? color : '#dfe4ea'}`,
  background: on ? color : '#fff',
  color: on ? '#fff' : n ? '#2c3e50' : '#b2bec3',
  fontWeight: on ? 800 : 600, fontFamily: 'inherit',
});

const sub: React.CSSProperties = {
  fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase',
  color: '#95a5a6', fontWeight: 800, margin: '0 0 0.45rem',
};

const fold = (open: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', textAlign: 'left',
  padding: '0.6rem 0.85rem', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit',
  border: '1px dashed #dfe4ea', background: open ? '#f8f9fa' : '#fff', color: '#2c3e50',
  fontSize: '0.88rem', fontWeight: 700,
});

/**
 * Aiming a campaign at the people it is actually for, and telling each of them
 * how it sits with their own restrictions.
 *
 * The allergen ids here are the same ones the treats carry, so "o que esta
 * caixa leva" can be pulled straight from the box Dolly already built.
 */
export default function DietTargeting({ value, onChange, audience }: Props) {
  const [openWho, setOpenWho] = useState(false);
  const [openWhat, setOpenWhat] = useState(false);
  const [loadingBox, setLoadingBox] = useState(false);
  const [boxNote, setBoxNote] = useState('');

  const set = (patch: Partial<DietTargetingValue>) => onChange({ ...value, ...patch });
  const toggle = (key: 'tags' | 'avoiding' | 'contains' | 'mayContain', id: string) => {
    const list = value[key];
    set({ [key]: list.includes(id) ? list.filter(x => x !== id) : [...list, id] } as Partial<DietTargetingValue>);
  };

  const tagCounts = useMemo(() => {
    const c: Record<string, number> = {};
    audience.forEach(p => (p.diet_tags || []).forEach(t => { c[t] = (c[t] || 0) + 1; }));
    return c;
  }, [audience]);

  const avoidCounts = useMemo(() => {
    const c: Record<string, number> = {};
    audience.forEach(p => (p.allergens_avoid || []).forEach(a => { c[a] = (c[a] || 0) + 1; }));
    return c;
  }, [audience]);

  const described = value.contains.length > 0 || value.mayContain.length > 0;

  // Who this message would worry, and who it reassures.
  const clash = useMemo(() => {
    if (!described) return { conflicts: 0, traces: 0, reassured: 0 };
    let conflicts = 0, traces = 0, reassured = 0;
    audience.forEach(p => {
      const n = (p.allergens_avoid || []).length;
      if (!n) return;
      const m = matchDiet(p.allergens_avoid, value.contains, value.mayContain);
      if (m.status === 'unsafe') conflicts += 1;
      else if (m.status === 'may') traces += 1;
      else reassured += 1;
    });
    return { conflicts, traces, reassured };
  }, [audience, value.contains, value.mayContain, described]);

  /** Pull the allergens straight from the newest box, so nothing is typed twice. */
  const loadFromBox = async () => {
    setLoadingBox(true);
    setBoxNote('');
    const { data, error } = await supabase
      .from('tasting_boxes')
      .select('title, items')
      .order('created_at', { ascending: false })
      .limit(1);
    setLoadingBox(false);
    const box = data?.[0];
    if (error || !box) {
      setBoxNote('Não encontrei nenhuma caixa. Você pode marcar à mão abaixo.');
      return;
    }
    const items = (Array.isArray(box.items) ? box.items : []) as BoxItem[];
    if (!items.length) {
      setBoxNote(`"${box.title}" ainda não tem doces cadastrados com alérgenos.`);
      return;
    }
    const { contains, mayContain } = summarizeAllergens(items);
    set({ contains: contains.map(a => a.id), mayContain: mayContain.map(a => a.id) });
    setOpenWhat(true);
    setBoxNote(`Puxado de "${box.title}" — ${items.length} doce(s).`);
  };

  const allergenChips = (key: 'avoiding' | 'contains' | 'mayContain', counts?: Record<string, number>) => (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      {ALLERGEN_GROUPS.map(g => {
        const items = ALLERGENS.filter(a => a.group === g.id);
        return (
          <div key={g.id}>
            <p style={sub}>{g.label}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {items.map(a => {
                const n = counts ? (counts[a.id] || 0) : 0;
                return (
                  <button key={a.id} type="button" onClick={() => toggle(key, a.id)}
                    style={chip(value[key].includes(a.id), counts ? n : 1, key === 'avoiding' ? '#2980b9' : '#c0392b')}>
                    {a.emoji} {a.label}{counts ? ` (${n})` : ''}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={{ borderTop: '1px solid #eef1f4', paddingTop: '1rem', display: 'grid', gap: '0.75rem' }}>
      <div>
        <p style={{ ...sub, color: '#2c3e50', fontSize: '0.8rem' }}>🍽️ Falar com quem tem restrição</p>
        <p style={{ fontSize: '0.83rem', color: '#7f8c8d', lineHeight: 1.6, margin: 0 }}>
          Opcional. Use para mandar só para um grupo, e para avisar cada pessoa se o que você está anunciando
          combina (ou não) com o que ela evita.
        </p>
      </div>

      {/* ---- narrow the audience */}
      <div>
        <button type="button" onClick={() => setOpenWho(o => !o)} style={fold(openWho)}>
          <span aria-hidden>{openWho ? '▾' : '▸'}</span>
          Mandar só para um grupo
          <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#7f8c8d', fontWeight: 600 }}>
            {value.tags.length + value.avoiding.length || 'todos'}
          </span>
        </button>
        {openWho && (
          <div style={{ padding: '0.9rem 0.25rem 0', display: 'grid', gap: '0.9rem' }}>
            <div>
              <p style={sub}>Quem marcou (qualquer uma)</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {DIET_TAGS.map(t => {
                  const n = tagCounts[t.id] || 0;
                  return (
                    <button key={t.id} type="button" onClick={() => toggle('tags', t.id)} style={chip(value.tags.includes(t.id), n)}>
                      {t.emoji} {t.label} ({n})
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p style={sub}>Quem evita (qualquer uma)</p>
              {allergenChips('avoiding', avoidCounts)}
            </div>
            {(value.tags.length || value.avoiding.length) ? (
              <button type="button" onClick={() => set({ tags: [], avoiding: [] })}
                style={{ justifySelf: 'start', border: 'none', background: 'none', color: '#2980b9', cursor: 'pointer', fontSize: '0.83rem', fontWeight: 700, padding: 0 }}>
                Limpar e mandar para todos
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* ---- what it contains */}
      <div>
        <button type="button" onClick={() => setOpenWhat(o => !o)} style={fold(openWhat)}>
          <span aria-hidden>{openWhat ? '▾' : '▸'}</span>
          O que esta caixa / doce leva
          <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#7f8c8d', fontWeight: 600 }}>
            {described ? `${value.contains.length} + ${value.mayContain.length} traços` : 'não informado'}
          </span>
        </button>
        {openWhat && (
          <div style={{ padding: '0.9rem 0.25rem 0', display: 'grid', gap: '0.9rem' }}>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button type="button" onClick={loadFromBox} disabled={loadingBox}
                style={{ border: 'none', background: '#2c3e50', color: '#fff', borderRadius: '8px', padding: '0.55rem 1rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.83rem' }}>
                {loadingBox ? 'Buscando…' : '📦 Puxar da caixa mais recente'}
              </button>
              {described && (
                <button type="button" onClick={() => set({ contains: [], mayContain: [] })}
                  style={{ border: 'none', background: 'none', color: '#7f8c8d', cursor: 'pointer', fontSize: '0.83rem', fontWeight: 700 }}>
                  Limpar
                </button>
              )}
              {boxNote && <span style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>{boxNote}</span>}
            </div>

            <div>
              <p style={sub}>Contém</p>
              {allergenChips('contains')}
            </div>
            <div>
              <p style={sub}>Pode conter (traços / mesma cozinha)</p>
              {allergenChips('mayContain')}
            </div>
          </div>
        )}
      </div>

      {described && (
        <div style={{ background: clash.conflicts ? '#fdf0e8' : '#f0faf4', border: `1px solid ${clash.conflicts ? '#f0c9ae' : '#b7e1c6'}`, borderRadius: '10px', padding: '0.85rem 1rem', lineHeight: 1.75, fontSize: '0.87rem', color: '#3c2a21' }}>
          Cada pessoa vai ler uma linha feita para ela:{' '}
          {clash.reassured > 0 && <><strong>{clash.reassured}</strong> recebem um “✅ conferimos, pode comer”. </>}
          {clash.traces > 0 && <><strong>{clash.traces}</strong> recebem um aviso de traços. </>}
          {clash.conflicts > 0
            ? <><strong>{clash.conflicts}</strong> evitam algo que isto leva.</>
            : <>Ninguém da lista evita o que isto leva. 🎉</>}
          {clash.conflicts > 0 && (
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: '0.6rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={value.skipConflicts} onChange={e => set({ skipConflicts: e.target.checked })} style={{ marginTop: '0.25rem' }} />
              <span>
                Não mandar para essas {clash.conflicts} pessoa(s).{' '}
                <span style={{ color: '#7f8c8d' }}>
                  Se deixar desmarcado, elas recebem com um aviso claro no topo — normalmente é melhor assim.
                </span>
              </span>
            </label>
          )}
        </div>
      )}
    </div>
  );
}

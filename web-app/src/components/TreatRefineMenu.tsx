'use client';

import React, { useMemo, useState } from 'react';
import { ALLERGENS, ALLERGEN_GROUPS } from '@/lib/allergens';

/** The bits of a treat the refine menu looks at. */
export interface RefinableTreat {
  name: string;
  is_available: boolean;
  ingredients?: string[] | null;
  contains?: string[] | null;
  may_contain?: string[] | null;
}

export type RefineMode = 'contains' | 'may' | 'free';

export interface RefineState {
  search: string;
  mode: RefineMode;
  allergens: string[];
  ingredients: string[]; // stored lower-case
  status: string[];      // 'menu' | 'hidden' | 'incomplete'
}

export const emptyRefine: RefineState = { search: '', mode: 'contains', allergens: [], ingredients: [], status: [] };

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });
const norm = (s: string) => s.trim().toLowerCase();
const isIncomplete = (t: RefinableTreat) =>
  (t.ingredients?.length || 0) + (t.contains?.length || 0) + (t.may_contain?.length || 0) === 0;

/** Treats a "free of" search hides because nobody has filled in their allergens yet. */
export const unknownHidden = (treats: RefinableTreat[], r: RefineState) =>
  r.mode === 'free' && r.allergens.length + r.ingredients.length > 0 ? treats.filter(isIncomplete).length : 0;

export const refineCount = (r: RefineState) =>
  r.allergens.length + r.ingredients.length + r.status.length + (r.search.trim() ? 1 : 0);

const STATUSES = [
  { id: 'menu', label: '✅ No menu' },
  { id: 'hidden', label: '🙈 Fora do menu' },
  { id: 'incomplete', label: '📝 Falta preencher' },
];

/** True when the treat passes every active refinement. */
export function matchesRefine(t: RefinableTreat, r: RefineState, opts: { hideUnknownWhenFree?: boolean } = {}): boolean {
  if (r.search.trim() && !norm(t.name).includes(norm(r.search))) return false;

  if (r.status.length > 0) {
    const ok = r.status.some(s =>
      s === 'menu' ? t.is_available : s === 'hidden' ? !t.is_available : isIncomplete(t));
    if (!ok) return false;
  }

  const ing = (t.ingredients || []).map(norm);
  const con = t.contains || [];
  const may = t.may_contain || [];

  if (r.mode === 'free') {
    // A treat with nothing filled in is "unknown", not "free". Customers must never see it as safe.
    if (opts.hideUnknownWhenFree && (r.allergens.length + r.ingredients.length > 0) && isIncomplete(t)) return false;
    // Free of: none of the selected allergens declared (contains or may contain), none of the ingredients.
    if (r.allergens.some(a => con.includes(a) || may.includes(a))) return false;
    if (r.ingredients.some(i => ing.includes(i))) return false;
    return true;
  }
  const list = r.mode === 'contains' ? con : may;
  if (!r.allergens.every(a => list.includes(a))) return false;
  if (!r.ingredients.every(i => ing.includes(i))) return false;
  return true;
}

const MODES: { id: RefineMode; label: string; help: string }[] = [
  { id: 'contains', label: '⚠️ Contém', help: 'Mostra os doces que têm TODOS os itens marcados.' },
  { id: 'may', label: '🔸 Pode conter', help: 'Mostra os doces que podem conter (contaminação cruzada) TODOS os alérgenos marcados.' },
  { id: 'free', label: '🌱 Livre de', help: 'Mostra os doces que não têm NENHUM dos itens marcados, nem como traço.' },
];

export default function TreatRefineMenu({ treats, value, onChange, shown, variant = 'admin', defaultOpen = false }: {
  treats: RefinableTreat[]; value: RefineState; onChange: (next: RefineState) => void; shown: number;
  /** 'public' is the customer-facing look: no admin-only folder, friendlier wording, open by default. */
  variant?: 'admin' | 'public';
  /** Start expanded (the public look always does). Used when it sits in a side column. */
  defaultOpen?: boolean;
}) {
  const isPublic = variant === 'public';
  const [open, setOpen] = useState(isPublic || defaultOpen);
  const [openFolders, setOpenFolders] = useState<string[]>([]);

  const toggleFolder = (id: string) =>
    setOpenFolders(f => (f.includes(id) ? f.filter(x => x !== id) : [...f, id]));

  const toggle = (key: 'allergens' | 'ingredients' | 'status', id: string) =>
    onChange({ ...value, [key]: value[key].includes(id) ? value[key].filter(x => x !== id) : [...value[key], id] });

  // How many treats declare each allergen, and how many use each ingredient.
  const counts = useMemo(() => {
    const allergen = new Map<string, number>();
    const ingredient = new Map<string, { label: string; n: number }>();
    treats.forEach(t => {
      new Set([...(t.contains || []), ...(t.may_contain || [])]).forEach(a => allergen.set(a, (allergen.get(a) || 0) + 1));
      const seen = new Set<string>();
      (t.ingredients || []).forEach(i => {
        const k = norm(i);
        if (!k || seen.has(k)) return;
        seen.add(k);
        const cur = ingredient.get(k);
        ingredient.set(k, { label: cur?.label || i.trim(), n: (cur?.n || 0) + 1 });
      });
    });
    return { allergen, ingredient };
  }, [treats]);

  const ingredientList = useMemo(
    () => [...counts.ingredient.entries()]
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => collator.compare(a.label, b.label)),
    [counts],
  );

  const statusCount = (id: string) =>
    treats.filter(t => (id === 'menu' ? t.is_available : id === 'hidden' ? !t.is_available : isIncomplete(t))).length;

  const active = refineCount(value);
  const modes = isPublic
    ? [
        { id: 'free' as const, label: '🌱 Sem', help: 'Mostra só os doces que não têm NENHUM dos itens marcados, nem como traço.' },
        { id: 'contains' as const, label: '⚠️ Com', help: 'Mostra os doces que têm TODOS os itens marcados.' },
        { id: 'may' as const, label: '🔸 Pode conter', help: 'Mostra os doces que podem conter (por contaminação cruzada) TODOS os alérgenos marcados.' },
      ]
    : MODES;
  const mode = modes.find(m => m.id === value.mode)!;
  const hiddenUnknown = isPublic ? unknownHidden(treats, value) : 0;

  const chip = (on: boolean, tone: 'allergen' | 'ingredient' | 'status'): React.CSSProperties => {
    const palette = tone === 'ingredient'
      ? { bg: '#f0faf4', border: '#27ae60', color: '#1e6b3c' }
      : tone === 'status'
        ? { bg: '#eaf2fb', border: '#3b82c4', color: '#245d94' }
        : value.mode === 'free'
          ? { bg: '#eaf7ee', border: '#27ae60', color: '#1e6b3c' }
          : value.mode === 'may'
            ? { bg: '#fff4e0', border: '#e6a23c', color: '#8a5a00' }
            : { bg: '#fdecea', border: '#e74c3c', color: '#c0392b' };
    return {
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.82rem', cursor: 'pointer',
      border: `1px solid ${on ? palette.border : '#dfe4ea'}`, background: on ? palette.bg : '#fff', color: on ? palette.color : '#7f8c8d', fontWeight: on ? 700 : 500,
    };
  };
  const countBadge: React.CSSProperties = { fontSize: '0.7rem', opacity: 0.7, fontWeight: 600 };
  const chipRow: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '0.4rem' };

  const folder = (id: string, title: string, selected: number, children: React.ReactNode) => {
    const isOpen = openFolders.includes(id);
    return (
      <div key={id} style={{ border: '1px solid #eef1f4', borderRadius: '10px', background: '#fff', overflow: 'hidden' }}>
        <button type="button" onClick={() => toggleFolder(id)} aria-expanded={isOpen}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 1rem', background: isOpen ? '#fdf7ee' : '#fff', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.95rem', fontWeight: 700, color: '#3c2a21' }}>
          <span aria-hidden style={{ display: 'inline-block', transition: 'transform .15s', transform: isOpen ? 'rotate(90deg)' : 'none', color: '#a6832b' }}>▸</span>
          <span>{isOpen ? '📂' : '📁'} {title}</span>
          {selected > 0 && (
            <span style={{ marginLeft: 'auto', background: '#d4af37', color: '#fff', borderRadius: '10px', padding: '0.05rem 0.55rem', fontSize: '0.75rem' }}>{selected}</span>
          )}
        </button>
        {isOpen && <div style={{ padding: '0.25rem 1rem 1rem' }}>{children}</div>}
      </div>
    );
  };

  return (
    <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '1.5rem', overflow: 'hidden' }}>
      {/* A filled, mid-brown bar so it reads as something to press (light enough to keep the emoji visible). */}
      <style>{`.trm-toggle { transition: filter .15s; } .trm-toggle:hover { filter: brightness(1.12); }`}</style>
      <button type="button" className="trm-toggle" onClick={() => setOpen(o => !o)} aria-expanded={open}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', padding: '1rem 1.25rem', background: 'linear-gradient(135deg, #7a5540 0%, #93694f 100%)', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <span aria-hidden style={{ display: 'inline-block', transition: 'transform .15s', transform: open ? 'rotate(90deg)' : 'none', color: '#f4d675', fontSize: '1.05rem' }}>▸</span>
        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{isPublic ? '🔎 Encontre o doce ideal: alergias e preferências' : '🔎 Refinar busca'}</span>
        {active > 0 && (
          <span style={{ background: '#f4d675', color: '#3c2a21', borderRadius: '10px', padding: '0.05rem 0.6rem', fontSize: '0.78rem', fontWeight: 800 }}>
            {active} {active === 1 ? 'filtro' : 'filtros'}
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'rgba(255,255,255,0.88)', fontWeight: 600 }}>
          Mostrando {shown} de {treats.length} doces · {open ? 'fechar' : 'abrir'}
        </span>
      </button>

      {open && (
        <div style={{ padding: '0 1.25rem 1.25rem', display: 'grid', gap: '1rem', borderTop: '1px solid #eef1f4' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', paddingTop: '1rem' }}>
            <input type="search" value={value.search} onChange={e => onChange({ ...value, search: e.target.value })}
              placeholder="Buscar pelo nome do doce…"
              style={{ flex: '1 1 240px', padding: '0.65rem 0.8rem', border: '1px solid #ccc', borderRadius: '6px', fontSize: '0.95rem' }} />
            <div role="group" aria-label="Como usar os itens marcados" style={{ display: 'inline-flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid #dfe4ea' }}>
              {modes.map(m => (
                <button key={m.id} type="button" onClick={() => onChange({ ...value, mode: m.id })} aria-pressed={value.mode === m.id}
                  style={{ padding: '0.6rem 0.9rem', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, background: value.mode === m.id ? '#3c2a21' : '#fff', color: value.mode === m.id ? '#fff' : '#7f8c8d' }}>
                  {m.label}
                </button>
              ))}
            </div>
            {active > 0 && (
              <button type="button" onClick={() => onChange({ ...emptyRefine, mode: value.mode })}
                style={{ padding: '0.6rem 1rem', background: '#ecf0f1', color: '#2c3e50', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>
                Limpar filtros
              </button>
            )}
          </div>
          <p style={{ fontSize: '0.82rem', color: '#7f8c8d', margin: '-0.4rem 0 0' }}>{mode.help} Abra as pastas abaixo e clique nos itens.</p>
          {isPublic && value.mode === 'free' && value.allergens.length + value.ingredients.length > 0 && (
            <p style={{ fontSize: '0.82rem', color: '#8a5a00', background: '#fff4e0', border: '1px solid #f0d09a', borderRadius: '8px', padding: '0.6rem 0.8rem', margin: 0, lineHeight: 1.6 }}>
              ⚠️ Baseado no que informamos para cada doce. Tudo é feito na mesma cozinha, então em caso de alergia grave fale com a gente no WhatsApp antes de pedir.
              {hiddenUnknown > 0 && <> {hiddenUnknown} {hiddenUnknown === 1 ? 'doce ainda sem' : 'doces ainda sem'} informação de alérgenos {hiddenUnknown === 1 ? 'foi ocultado' : 'foram ocultados'} desta busca.</>}
            </p>
          )}

          <div style={{ display: 'grid', gap: '0.6rem' }}>
            {!isPublic && folder('status', 'Situação', value.status.length,
              <div style={chipRow}>
                {STATUSES.map(s => (
                  <button key={s.id} type="button" onClick={() => toggle('status', s.id)} style={chip(value.status.includes(s.id), 'status')}>
                    {s.label} <span style={countBadge}>{statusCount(s.id)}</span>
                  </button>
                ))}
              </div>,
            )}

            {[...ALLERGEN_GROUPS].sort((a, b) => collator.compare(a.label, b.label)).map(g => {
              const items = ALLERGENS.filter(a => a.group === g.id).sort((a, b) => collator.compare(a.label, b.label));
              return folder(g.id, g.label, items.filter(a => value.allergens.includes(a.id)).length,
                <div style={chipRow}>
                  {items.map(a => (
                    <button key={a.id} type="button" title={a.hint} onClick={() => toggle('allergens', a.id)} style={chip(value.allergens.includes(a.id), 'allergen')}>
                      {a.emoji} {a.label} <span style={countBadge}>{counts.allergen.get(a.id) || 0}</span>
                    </button>
                  ))}
                </div>,
              );
            })}

            {folder('ingredients', 'Ingredientes', value.ingredients.length,
              ingredientList.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>Nenhum ingrediente cadastrado ainda.</p>
              ) : (
                <div style={chipRow}>
                  {ingredientList.map(i => (
                    <button key={i.key} type="button" onClick={() => toggle('ingredients', i.key)} style={chip(value.ingredients.includes(i.key), 'ingredient')}>
                      {i.label} <span style={countBadge}>{i.n}</span>
                    </button>
                  ))}
                </div>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}

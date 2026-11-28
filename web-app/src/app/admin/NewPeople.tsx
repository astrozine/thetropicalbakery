'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BOOK_LABEL, LANG_FLAG, flagOf, loadRecipeLeads, sequenceLine, type RecipeLead } from './recipeLeads';

const ago = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'hoje';
  if (days === 1) return 'ontem';
  return `há ${days} dias`;
};

/** The e-mail sequence as a row of little steps: green = sent, gold ring = next, grey = later. */
function Steps({ lead }: { lead: RecipeLead }) {
  return (
    <span className="np-steps" aria-label={sequenceLine(lead)}>
      <span className={`np-step${lead.pdf ? ' np-step--sent' : lead.pdf === false ? ' np-step--fail' : ''}`} title={lead.pdf === false ? 'E-mail das receitas falhou' : 'E-mail com as receitas'}>PDF</span>
      {lead.steps.map(d => {
        const sent = lead.sent.includes(d);
        const next = lead.next?.day === d;
        return (
          <span key={d} className={`np-step${sent ? ' np-step--sent' : next ? ' np-step--next' : ''}`} title={`E-mail do dia ${d}${sent ? ': enviado' : next ? ': próximo' : ''}`}>
            {d}
          </span>
        );
      })}
    </span>
  );
}

/**
 * "Novas pessoas" on the Overview: everyone who asked for the free recipes lately (from the ads or the Amazon
 * detour), where they are in the follow-up e-mails, and whether they bought the book. The people Andrew most
 * wants to see, without a trip to the CRM.
 */
export default function NewPeople({ limit = 6 }: { limit?: number }) {
  const [leads, setLeads] = useState<RecipeLead[] | null>(null);

  useEffect(() => {
    loadRecipeLeads({ days: 60 }).then(setLeads).catch(() => setLeads([]));
  }, []);

  const week = (leads || []).filter(l => Date.now() - new Date(l.createdAt).getTime() < 7 * 86400000).length;
  const buyers = (leads || []).filter(l => l.book === 'paid').length;
  const shown = (leads || []).slice(0, limit);

  return (
    <section className="np" aria-label="Novas pessoas">
      <div className="np-head">
        <h2 className="np-title">⭐ Novas pessoas</h2>
        <Link href="/admin/crm" className="np-all">Ver todas no CRM →</Link>
      </div>
      <p className="np-sub">
        {leads === null ? 'Carregando...' : leads.length === 0
          ? 'Ninguém pediu as receitas grátis nos últimos 60 dias ainda.'
          : <><strong className="np-total">{leads[0].total}</strong> {leads[0].total === 1 ? 'pessoa na nossa lista' : 'pessoas na nossa lista'} · <strong>{week}</strong> esta semana · <strong>{buyers}</strong> {buyers === 1 ? 'comprou' : 'compraram'} o e-book</>}
      </p>

      {shown.length > 0 && (
        <ul className="np-list">
          {shown.map(l => {
            const b = BOOK_LABEL[l.book];
            return (
              <li key={l.id} className="np-card">
                <div className="np-top">
                  {l.number > 0 && <span className="np-num">{l.number}</span>}
                  <strong className="np-name">{l.name}</strong>
                  {l.country
                    ? <span className="np-flag" title={`País: ${l.country} · idioma: ${l.lang}`}>{flagOf(l.country)}</span>
                    : <span className="np-flag" title={`Idioma: ${l.lang}`}>{LANG_FLAG[l.lang] || l.lang}</span>}
                  <span className="np-when">{ago(l.createdAt)}</span>
                </div>
                <a href={`mailto:${l.email}`} className="np-email">{l.email}</a>
                <div className="np-tags">
                  <span className="np-tag" style={{ color: b.color, background: b.bg }}>{b.text}</span>
                  <span className="np-tag np-tag--from">{l.from === 'Amazon' ? '🛒 Veio da Amazon' : l.from ? `📣 ${l.from}` : '🔗 Visita direta'}</span>
                </div>
                <div className="np-seq">
                  <Steps lead={l} />
                  <span className="np-seqline">{sequenceLine(l)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .np { background: #fff; border-radius: 18px; border: 1px solid #f0dfb8; box-shadow: 0 2px 10px rgba(42,26,18,0.06); padding: 1.1rem 1.1rem 0.9rem; margin-top: 1.25rem; }
        .np-head { display: flex; align-items: baseline; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; }
        .np-title { font-size: 1.3rem; color: #2c3e50; margin: 0; }
        .np-all { color: #8a6d1f; font-weight: 800; text-decoration: none; font-size: 0.9rem; }
        .np-sub { color: #7f8c8d; font-size: 0.9rem; margin: 0.3rem 0 0.9rem; line-height: 1.5; }
        .np-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.7rem; grid-template-columns: minmax(0, 1fr); }
        @media (min-width: 700px) { .np-list { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        .np-card { background: #faf5ec; border: 1px solid #efe5cc; border-left: 6px solid #d4a72c; border-radius: 12px; padding: 0.75rem 0.85rem; min-width: 0; }
        .np-top { display: flex; align-items: center; gap: 0.45rem; }
        .np-name { font-size: 1.08rem; color: #2c3e50; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .np-num { background: #8a6d1f; color: #fff; font-weight: 900; font-size: 0.78rem; border-radius: 999px; padding: 0.1rem 0.5rem; flex-shrink: 0; }
        .np-total { font-size: 1.15rem; color: #8a6d1f; }
        .np-when { margin-left: auto; color: #95a5a6; font-size: 0.78rem; white-space: nowrap; }
        .np-email { display: block; color: #5d6d7e; font-size: 0.84rem; text-decoration: none; overflow-wrap: anywhere; margin-top: 0.1rem; }
        .np-tags { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.5rem; }
        .np-tag { font-size: 0.75rem; font-weight: 800; border-radius: 999px; padding: 0.2rem 0.6rem; }
        .np-tag--from { background: #eef2f6; color: #4a5a6a; font-weight: 700; overflow-wrap: anywhere; }
        .np-seq { margin-top: 0.55rem; display: flex; flex-direction: column; gap: 0.3rem; }
        .np-steps { display: flex; gap: 0.25rem; flex-wrap: wrap; }
        .np-step { min-width: 1.6rem; text-align: center; font-size: 0.7rem; font-weight: 800; border-radius: 6px; padding: 0.12rem 0.3rem; background: #eceff2; color: #95a5a6; border: 1px solid transparent; }
        .np-step--sent { background: #e6f4ec; color: #0b6b3a; border-color: #b9e0c8; }
        .np-step--next { background: #fff; color: #8a6d1f; border-color: #d4a72c; }
        .np-step--fail { background: #fdecea; color: #c0392b; border-color: #f3b8b1; }
        .np-seqline { font-size: 0.78rem; color: #7f8c8d; }
      ` }} />
    </section>
  );
}

'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

/**
 * Todos os e-mails: every e-mail the site sends, as the customer sees it, with made-up example data. The list comes
 * from src/lib/email/catalog.ts through /api/admin/email-catalog, so new campaigns appear here by themselves and the
 * automatic e-mails preview through the same code that sends them. Read-only: nothing here sends anything.
 */

interface Variant { id: string; label: string }
interface Entry {
  id: string; group: string; name: string; when: string; to: 'cliente' | 'equipe'; automatic: boolean; rule?: string;
  langs: string[]; variants?: Variant[];
}
interface Catalog { groups: string[]; emails: Entry[]; unlisted: { template: string; count: number }[] }

const LANG_NAME: Record<string, string> = { pt: 'Português', en: 'English', es: 'Español', nl: 'Nederlands', de: 'Deutsch' };

const card: React.CSSProperties = { background: 'white', borderRadius: '12px', padding: 'clamp(1rem, 3vw, 1.5rem)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const chip = (on: boolean): React.CSSProperties => ({
  padding: '0.35rem 0.8rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.82rem',
  border: on ? '2px solid #c9a257' : '1px solid #dfe4ea', background: on ? '#fdf6dd' : '#fff', color: '#2c3e50', fontWeight: on ? 'bold' : 'normal',
});

const EMAIL_WIDTH = 640;
function ScaledPreview({ html }: { html: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setScale(Math.min(1, el.clientWidth / EMAIL_WIDTH));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const realHeight = scale < 1 ? 1500 : 900;
  return (
    <div ref={box} style={{ width: '100%', height: realHeight * scale, overflow: 'hidden', borderRadius: '10px', border: '1px solid #e8e1d7', background: '#faf5ec' }}>
      <iframe title="Prévia do e-mail" srcDoc={html} scrolling={scale < 1 ? 'no' : 'auto'}
        style={{ width: scale < 1 ? EMAIL_WIDTH : '100%', height: realHeight, border: 0, display: 'block', transform: `scale(${scale})`, transformOrigin: 'top left' }} />
    </div>
  );
}

async function api(query: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`/api/admin/email-catalog${query}`, { headers: { Authorization: `Bearer ${session?.access_token ?? ''}` } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Não deu para carregar.');
  return json;
}

export default function AllEmailsPage() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState('');
  const [id, setId] = useState('');
  const [lang, setLang] = useState('');
  const [variant, setVariant] = useState('');
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api('').then((c: Catalog) => { setCatalog(c); if (c.emails[0]) pick(c.emails[0]); }).catch(e => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entry = useMemo(() => catalog?.emails.find(e => e.id === id), [catalog, id]);

  const pick = (e: Entry, scroll = false) => {
    setId(e.id);
    setLang(e.langs[0]);
    setVariant(e.variants?.[0]?.id ?? '');
    if (scroll && window.innerWidth < 900) setTimeout(() => previewRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  useEffect(() => {
    if (!id) return;
    let live = true;
    setLoading(true);
    api(`?id=${encodeURIComponent(id)}&lang=${lang}&variant=${encodeURIComponent(variant)}`)
      .then(p => { if (live) { setPreview(p); setError(''); } })
      .catch(e => { if (live) setError(e.message); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [id, lang, variant]);

  return (
    <div style={{ maxWidth: '1400px' }}>
      <p style={{ marginBottom: '0.5rem' }}><Link href="/admin/emails" style={{ color: '#a8843f' }}>← E-mails</Link></p>
      <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '0.5rem' }}>Todos os e-mails</h1>
      <p style={{ color: '#7f8c8d', marginBottom: '1.5rem', lineHeight: 1.7, maxWidth: '820px' }}>
        Todos os e-mails que o site manda, do jeito que chegam, com dados de exemplo (Maria Souza, pedidos de mentira).
        Toque em um para ver. Nada aqui envia e-mail. A lista se atualiza sozinha quando um e-mail novo entra no site.
      </p>

      {error && <div style={{ padding: '1rem', borderRadius: '10px', marginBottom: '1rem', background: '#fff4e5', color: '#7a4a00', border: '1px solid #f0d9b5' }}>⚠️ {error}</div>}

      {!!catalog?.unlisted.length && (
        <div style={{ padding: '1rem', borderRadius: '10px', marginBottom: '1rem', background: '#fff1ec', color: '#7a3a1f', border: '1px solid #ffc9b5', lineHeight: 1.6 }}>
          Estes e-mails saíram do site mas ainda não têm prévia aqui (peça ao Claude para incluir):{' '}
          {catalog.unlisted.map(u => `${u.template} (${u.count})`).join(', ')}
        </div>
      )}

      {!catalog && !error && <p style={{ color: '#7f8c8d' }}>Carregando…</p>}

      {catalog && (
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {catalog.groups.map(g => {
              const list = catalog.emails.filter(e => e.group === g);
              if (!list.length) return null;
              return (
                <div key={g} style={card}>
                  <h2 style={{ fontSize: '1.05rem', color: '#2c3e50', marginBottom: '0.75rem' }}>{g} <span style={{ color: '#95a5a6', fontWeight: 'normal' }}>({list.length})</span></h2>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {list.map(e => {
                      const on = e.id === id;
                      return (
                        <button key={e.id} type="button" onClick={() => pick(e, true)}
                          style={{ textAlign: 'left', padding: '0.7rem 0.9rem', borderRadius: '10px', cursor: 'pointer',
                            border: on ? '2px solid #c9a257' : '1px solid #dfe4ea', background: on ? '#fdf6dd' : '#fff' }}>
                          <strong style={{ display: 'block', color: '#2c3e50', marginBottom: '0.2rem' }}>{e.name}</strong>
                          <span style={{ display: 'block', fontSize: '0.8rem', color: '#7f8c8d', lineHeight: 1.5 }}>{e.when}</span>
                          <span style={{ display: 'inline-block', marginTop: '0.4rem', fontSize: '0.72rem', color: '#8a6d1f', background: 'rgba(212,175,55,0.15)', padding: '0.15rem 0.5rem', borderRadius: '20px' }}>
                            {e.to === 'equipe' ? 'Para vocês' : e.rule ? `Sai sozinho com a regra “${e.rule}” ligada` : e.automatic ? 'Sai sozinho' : 'Você envia'} · {e.langs.map(l => l.toUpperCase()).join(' ')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div ref={previewRef} style={{ ...card, position: 'sticky', top: '1rem' }}>
            {entry && (
              <>
                <h2 style={{ fontSize: '1.1rem', color: '#2c3e50', marginBottom: '0.6rem' }}>{entry.name}</h2>
                {entry.langs.length > 1 && (
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                    {entry.langs.map(l => <button key={l} type="button" style={chip(l === lang)} onClick={() => setLang(l)}>{LANG_NAME[l] || l}</button>)}
                  </div>
                )}
                {!!entry.variants?.length && (
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                    {entry.variants.map(v => <button key={v.id} type="button" style={chip(v.id === variant)} onClick={() => setVariant(v.id)}>{v.label}</button>)}
                  </div>
                )}
                {preview && (
                  <>
                    <p style={{ fontSize: '0.85rem', color: '#2c3e50', margin: '0.4rem 0 0.8rem', opacity: loading ? 0.5 : 1 }}>
                      <strong>Assunto:</strong> {preview.subject}
                    </p>
                    <div style={{ opacity: loading ? 0.5 : 1 }}><ScaledPreview html={preview.html} /></div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

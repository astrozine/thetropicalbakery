'use client';

import React, { useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadPublicImage } from '@/lib/imageUpload';
import { RETREAT_ROOMS } from '@/lib/retreatRooms';

export interface RoomPhotoRow {
  id: string;
  name: string;
  image_url: string;
  gallery: string[] | null;
  gallery_library?: string[] | null;
}

interface Photo { url: string; visible: boolean }

interface Props {
  room: RoomPhotoRow;
  /** Called after a successful save so the page can refresh its own copy. */
  onSaved: (patch: { gallery: string[]; gallery_library: string[]; image_url: string }) => void;
  notify: (type: 'success' | 'error', text: string) => void;
}

const unique = (list: string[]) => Array.from(new Set(list.filter(Boolean)));

/**
 * Turns what the database stores into the list the editor works with.
 *   gallery          = what the site shows, in order (first = hero)
 *   gallery_library  = every photo ever attached (shown or hidden), in Dolly's order
 * With neither, the room is still on the site's built-in photos: all shown.
 */
function buildPhotos(room: RoomPhotoRow): Photo[] {
  const defaults = RETREAT_ROOMS.find(r => r.dbId === room.id)?.photos ?? [];
  const gallery = room.gallery || [];
  const library = room.gallery_library || [];

  if (!gallery.length) {
    return unique([...library, ...defaults]).map(url => ({ url, visible: true }));
  }
  const shown = new Set(gallery);
  // Library order if we have it; otherwise the published photos first, then the rest hidden.
  const order = library.length
    ? unique([...library, ...gallery])
    : unique([...gallery, ...defaults]);
  return order.map(url => ({ url, visible: shown.has(url) }));
}

const same = (a: Photo[], b: Photo[]) =>
  a.length === b.length && a.every((p, i) => p.url === b[i].url && p.visible === b[i].visible);

const roundBtn = (bg: string, color: string): React.CSSProperties => ({
  border: 'none', background: bg, color, borderRadius: '8px', cursor: 'pointer',
  padding: '0.4rem 0.6rem', fontSize: '0.78rem', fontWeight: 700, lineHeight: 1.2, fontFamily: 'inherit',
});

export default function RoomPhotoManager({ room, onSaved, notify }: Props) {
  const initial = useMemo(() => buildPhotos(room), [room]);
  const [photos, setPhotos] = useState<Photo[]>(initial);
  const [saved, setSaved] = useState<Photo[]>(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [urlInput, setUrlInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const dirty = !same(photos, saved);
  const visible = photos.filter(p => p.visible);
  const hero = visible[0]?.url;

  const move = (i: number, d: -1 | 1) => setPhotos(list => {
    const j = i + d;
    if (j < 0 || j >= list.length) return list;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });

  const toggle = (i: number) => setPhotos(list => list.map((p, n) => (n === i ? { ...p, visible: !p.visible } : p)));

  const makeHero = (i: number) => setPhotos(list => {
    const picked = { ...list[i], visible: true };
    return [picked, ...list.filter((_, n) => n !== i)];
  });

  const remove = (i: number) => {
    if (!window.confirm('Tirar esta foto da lista? (Para só esconder do site, use "Esconder".)')) return;
    setPhotos(list => list.filter((_, n) => n !== i));
  };

  const addUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    if (photos.some(p => p.url === url)) { notify('error', 'Esta foto já está na lista.'); return; }
    setPhotos(list => [...list, { url, visible: true }]);
    setUrlInput('');
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(files.length);
    const added: Photo[] = [];
    for (const file of Array.from(files)) {
      try {
        added.push({ url: await uploadPublicImage(file, 'retreats'), visible: true });
      } catch (e) {
        console.error('Photo upload failed:', e);
        notify('error', `Não consegui enviar "${file.name}". Tente de novo.`);
      }
      setUploading(n => n - 1);
    }
    if (added.length) setPhotos(list => [...list, ...added]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const resetToDefaults = async () => {
    if (!window.confirm('Voltar para as fotos originais do site? As fotos que você enviou saem desta lista.')) return;
    setSaving(true);
    const update = { gallery: [] as string[], gallery_library: [] as string[], updated_at: new Date().toISOString() };
    let { error } = await supabase.from('retreat_rooms').update(update).eq('id', room.id);
    if (error && /gallery_library/.test(error.message)) {
      ({ error } = await supabase.from('retreat_rooms').update({ gallery: [], updated_at: update.updated_at }).eq('id', room.id));
    }
    setSaving(false);
    if (error) { notify('error', `Não foi possível restaurar: ${error.message}`); return; }
    const defaults = (RETREAT_ROOMS.find(r => r.dbId === room.id)?.photos ?? []).map(url => ({ url, visible: true }));
    setPhotos(defaults);
    setSaved(defaults);
    onSaved({ gallery: [], gallery_library: [], image_url: room.image_url });
    notify('success', 'Fotos originais de volta.');
  };

  const save = async () => {
    if (!visible.length) {
      notify('error', 'Deixe pelo menos uma foto visível — ela vira a foto principal.');
      return;
    }
    setSaving(true);
    const gallery = visible.map(p => p.url);
    const library = photos.map(p => p.url);
    const heroUrl = gallery[0];
    const now = new Date().toISOString();

    // The room's single "cover" image (used on the Retiros cards) follows the hero.
    let { error } = await supabase.from('retreat_rooms')
      .update({ gallery, gallery_library: library, image_url: heroUrl, updated_at: now }).eq('id', room.id);
    let libraryKept = true;
    if (error && /gallery_library/.test(error.message)) {
      // Migration 20 not run yet: still publish what is shown; hidden photos just aren't remembered.
      libraryKept = false;
      ({ error } = await supabase.from('retreat_rooms')
        .update({ gallery, image_url: heroUrl, updated_at: now }).eq('id', room.id));
    }
    setSaving(false);

    if (error) { notify('error', `Não foi possível salvar as fotos: ${error.message}`); return; }
    setSaved(photos);
    onSaved({ gallery, gallery_library: libraryKept ? library : [], image_url: heroUrl });
    notify('success', libraryKept
      ? 'Fotos salvas — já estão no site.'
      : 'Fotos salvas. Para lembrar também as escondidas, rode a migration_20 no Supabase.');
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
        <strong style={{ color: '#3c2a21', fontSize: '1rem' }}>Fotos do quarto</strong>
        <span style={{ fontSize: '0.82rem', color: '#7a6a61' }}>
          {visible.length} visíveis · {photos.length - visible.length} escondidas
        </span>
        {dirty && <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#a03027', background: '#fdecea', padding: '0.15rem 0.6rem', borderRadius: '999px' }}>alterações não salvas</span>}
      </div>

      <p style={{ fontSize: '0.85rem', color: '#7a6a61', lineHeight: 1.65, margin: '0 0 1rem' }}>
        A foto com o ⭐ é a <strong>principal</strong> (a primeira que as pessoas veem). Use as setas para mudar a ordem,
        <strong> Esconder</strong> para tirar do site sem perder a foto, e depois clique em <strong>Salvar fotos</strong>.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '0.9rem' }}>
        {photos.map((p, i) => {
          const isHero = p.visible && p.url === hero;
          return (
            <div key={p.url} style={{
              position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#fff',
              border: isHero ? '3px solid #d4af37' : '1px solid #e8e1d7',
              boxShadow: isHero ? '0 6px 18px rgba(212,175,55,0.35)' : '0 2px 6px rgba(0,0,0,0.05)',
            }}>
              <div style={{ position: 'relative', height: '130px', background: '#2a1d16' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: p.visible ? 1 : 0.35, filter: p.visible ? 'none' : 'grayscale(1)' }} />
                {isHero && (
                  <span style={{ position: 'absolute', top: '8px', left: '8px', background: '#d4af37', color: '#3c2a21', fontWeight: 800, fontSize: '0.72rem', padding: '0.25rem 0.65rem', borderRadius: '999px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                    ⭐ Foto principal
                  </span>
                )}
                {!p.visible && (
                  <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                    🚫 ESCONDIDA
                  </span>
                )}
                <span style={{ position: 'absolute', bottom: '6px', right: '8px', background: 'rgba(60,42,33,0.75)', color: '#fff', fontSize: '0.7rem', padding: '0.1rem 0.5rem', borderRadius: '999px' }}>
                  {i + 1}
                </span>
              </div>

              <div style={{ padding: '0.55rem', display: 'grid', gap: '0.4rem' }}>
                <button type="button" onClick={() => toggle(i)}
                  style={roundBtn(p.visible ? '#e6f4ec' : '#eee7db', p.visible ? '#0b6b3a' : '#7a6a61')}>
                  {p.visible ? '👁️ Visível — esconder' : '🚫 Escondida — mostrar'}
                </button>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button type="button" onClick={() => makeHero(i)} disabled={isHero} title="Tornar a foto principal"
                    style={{ ...roundBtn(isHero ? '#f5efe2' : '#fdf1d6', isHero ? '#b9a98a' : '#8a6d1f'), flex: 1, cursor: isHero ? 'default' : 'pointer' }}>
                    ⭐ Principal
                  </button>
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Mover para antes"
                    style={{ ...roundBtn('#f1f2f6', '#2c3e50'), opacity: i === 0 ? 0.4 : 1 }}>◀</button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === photos.length - 1} aria-label="Mover para depois"
                    style={{ ...roundBtn('#f1f2f6', '#2c3e50'), opacity: i === photos.length - 1 ? 0.4 : 1 }}>▶</button>
                  <button type="button" onClick={() => remove(i)} aria-label="Tirar da lista"
                    style={roundBtn('#fdecea', '#a03027')}>🗑</button>
                </div>
              </div>
            </div>
          );
        })}

        {/* The add tile */}
        <label style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', textAlign: 'center',
          minHeight: '215px', borderRadius: '12px', border: '2px dashed #d4af37', background: 'rgba(212,175,55,0.07)',
          cursor: uploading ? 'wait' : 'pointer', padding: '1rem',
        }}>
          <span aria-hidden style={{ fontSize: '2rem' }}>📷</span>
          <strong style={{ color: '#8a6d1f' }}>{uploading ? `Enviando… (${uploading})` : 'Adicionar fotos'}</strong>
          <span style={{ fontSize: '0.78rem', color: '#7f8c8d' }}>Do computador ou celular. Pode escolher várias de uma vez.</span>
          <input ref={fileRef} type="file" accept="image/*" multiple disabled={!!uploading} style={{ display: 'none' }}
            onChange={e => upload(e.target.files)} />
        </label>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '1rem 0' }}>
        <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="Ou cole o link (URL) de uma foto"
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
          style={{ flex: '1 1 260px', padding: '0.65rem 0.8rem', borderRadius: '6px', border: '1px solid rgba(212,175,55,0.4)', background: 'white', fontSize: '0.9rem', color: '#594a42' }} />
        <button type="button" onClick={addUrl} className="btn btn-secondary" style={{ padding: '0.6rem 1.1rem' }}>Adicionar link</button>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" onClick={save} disabled={saving || !dirty} className="btn btn-primary"
          style={{ padding: '0.85rem 1.6rem', opacity: saving || !dirty ? 0.55 : 1 }}>
          {saving ? 'Salvando…' : dirty ? '💾 Salvar fotos' : '✓ Tudo salvo'}
        </button>
        {dirty && (
          <button type="button" onClick={() => setPhotos(saved)} disabled={saving}
            style={{ border: 'none', background: 'none', color: '#7a6a61', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline' }}>
            Desfazer alterações
          </button>
        )}
        <button type="button" onClick={resetToDefaults} disabled={saving}
          style={{ marginLeft: 'auto', border: 'none', background: 'none', color: '#a89a90', cursor: 'pointer', fontSize: '0.82rem', textDecoration: 'underline' }}>
          Voltar às fotos originais do site
        </button>
      </div>
    </div>
  );
}

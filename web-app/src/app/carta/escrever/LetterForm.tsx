'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { resizeImage } from '@/lib/imageUpload';
import { LETTER_MAX_PHOTOS, LETTER_WRITER, prettySunday } from '@/lib/letter';

/**
 * The page Dolly opens from her Thursday e-mail, on her phone: a few photos, a few lines, Send.
 * Written in English for her (Andrew's rule: instructions for Dolly in English); she may write the letter in English or
 * Portuguese and says which with one tap. Photos are shrunk on the phone before they go up.
 */

type Photo = { file: File; url: string };

export default function LetterForm({ token, sunday }: { token: string; sunday: string | null }) {
  const [admin, setAdmin] = useState<string | null>(null);
  const [checked, setChecked] = useState(!!token);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [story, setStory] = useState('');
  const [tip, setTip] = useState('');
  const [title, setTitle] = useState('');
  const [lang, setLang] = useState<'en' | 'pt'>('en');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  // No link? A signed-in admin (Andrew) can still send one.
  useEffect(() => {
    if (token) return;
    supabase.auth.getSession().then(({ data }) => {
      setAdmin(data.session?.access_token ?? null);
      setChecked(true);
    });
  }, [token]);

  const add = (list: FileList | null) => {
    if (!list) return;
    const next = [...photos];
    for (const f of Array.from(list)) {
      if (next.length >= LETTER_MAX_PHOTOS) break;
      if (!f.type.startsWith('image/')) continue;
      next.push({ file: f, url: URL.createObjectURL(f) });
    }
    setPhotos(next);
  };

  const send = async () => {
    setError('');
    if (story.trim().length < 3) { setError('Write a few lines first.'); return; }
    setBusy(true);
    try {
      const form = new FormData();
      form.set('t', token);
      form.set('story', story);
      form.set('tip', tip);
      form.set('title', title);
      form.set('lang', lang);
      for (const p of photos) {
        const blob = await resizeImage(p.file).catch(() => p.file);
        form.append('photos', blob, p.file.name.replace(/\.[^.]+$/, '') + (blob.type === 'image/webp' ? '.webp' : '.jpg'));
      }
      const res = await fetch('/api/carta', { method: 'POST', body: form, headers: admin ? { Authorization: `Bearer ${admin}` } : undefined });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Something went wrong. Please try again.');
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!checked) return <main className="lt"><style>{CSS}</style></main>;

  if (!token && !admin) {
    return (
      <main className="lt"><style>{CSS}</style>
        <h1>This link has expired</h1>
        <p className="lt-sub">Open the newest e-mail about your Sunday letter, or ask Andrew for a fresh link.</p>
      </main>
    );
  }

  if (done) {
    return (
      <main className="lt"><style>{CSS}</style>
        <p className="lt-big">💛</p>
        <h1>Thank you, {LETTER_WRITER.name}!</h1>
        <p className="lt-sub">Andrew has it now. He’ll read it and send it on Sunday. Nothing else to do.</p>
      </main>
    );
  }

  return (
    <main className="lt">
      <style>{CSS}</style>
      <h1>Your Sunday letter</h1>
      <p className="lt-sub">
        {sunday ? `For ${prettySunday(sunday)}. ` : ''}A few photos and a few lines about your week in the kitchen. That’s all.
      </p>

      <section className="lt-box">
        <label className="lt-label">1. Photos <span>(up to {LETTER_MAX_PHOTOS})</span></label>
        <div className="lt-photos">
          {photos.map((p, i) => (
            <div key={p.url} className="lt-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" />
              <button type="button" aria-label="Remove photo" onClick={() => setPhotos(photos.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
          {photos.length < LETTER_MAX_PHOTOS && (
            <label className="lt-add">
              <input type="file" accept="image/*" multiple onChange={e => { add(e.target.files); e.target.value = ''; }} />
              <span>+ Add photos</span>
            </label>
          )}
        </div>
      </section>

      <section className="lt-box">
        <label className="lt-label" htmlFor="lt-story">2. What happened this week?</label>
        <p className="lt-hint">Write it like a message to a friend. A new treat, a story from the kitchen, something you’re excited about.</p>
        <textarea id="lt-story" rows={7} value={story} onChange={e => setStory(e.target.value)} placeholder="This week I’ve been making Christmas boxes…" />
      </section>

      <section className="lt-box">
        <label className="lt-label" htmlFor="lt-tip">3. A tip or mini recipe <span>(optional)</span></label>
        <textarea id="lt-tip" rows={3} value={tip} onChange={e => setTip(e.target.value)} placeholder="Soak the dates in warm water for 10 minutes and they blend like caramel." />
        <label className="lt-label lt-label--small" htmlFor="lt-title">A title <span>(optional, we’ll make one if you skip it)</span></label>
        <input id="lt-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Christmas in the kitchen" />
      </section>

      <section className="lt-box">
        <span className="lt-label">I wrote this in</span>
        <div className="lt-langs">
          <button type="button" className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>English</button>
          <button type="button" className={lang === 'pt' ? 'on' : ''} onClick={() => setLang('pt')}>Português</button>
        </div>
      </section>

      {error && <p className="lt-error">{error}</p>}
      <button type="button" className="lt-send" onClick={send} disabled={busy}>{busy ? 'Sending…' : 'Send to Andrew'}</button>
      <p className="lt-foot">Andrew checks it before it goes to anyone.</p>
    </main>
  );
}

const CSS = `
.lt { max-width: 560px; margin: 0 auto; padding: 24px 16px 56px; color: #3c2a21; font-family: 'Outfit', Helvetica, Arial, sans-serif; }
.lt h1 { font-family: 'Yellowtail', cursive; font-weight: 400; font-size: 38px; margin: 8px 0 6px; text-align: center; }
.lt-sub { text-align: center; color: #594a42; line-height: 1.55; margin: 0 0 22px; font-size: 16px; }
.lt-big { text-align: center; font-size: 48px; margin: 40px 0 0; }
.lt-box { background: #fff; border: 1px solid #eadfcd; border-radius: 18px; padding: 16px; margin-bottom: 14px; }
.lt-label { display: block; font-weight: 600; font-size: 17px; margin-bottom: 8px; }
.lt-label span { font-weight: 400; color: #8a7a70; font-size: 14px; }
.lt-label--small { font-size: 15px; margin-top: 14px; }
.lt-hint { margin: -2px 0 10px; color: #6b5a50; font-size: 14px; line-height: 1.45; }
.lt textarea, .lt input:not([type=file]) { width: 100%; box-sizing: border-box; border: 1px solid #d9ccb8; border-radius: 12px; padding: 12px; font: inherit; font-size: 16px; color: #3c2a21; background: #fdfaf3; }
.lt-photos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.lt-photo { position: relative; aspect-ratio: 1; border-radius: 12px; overflow: hidden; background: #f4ecdf; }
.lt-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.lt-photo button { position: absolute; top: 6px; right: 6px; width: 30px; height: 30px; border-radius: 50%; border: 0; background: rgba(60,42,33,.75); color: #fff; font-size: 18px; line-height: 1; cursor: pointer; }
.lt-add { aspect-ratio: 1; border: 2px dashed #d4af37; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #8a6d1d; font-weight: 600; background: #fffaf0; }
.lt-add input { display: none; }
.lt-langs { display: flex; gap: 8px; }
.lt-langs button { flex: 1; padding: 12px; border-radius: 12px; border: 1px solid #d9ccb8; background: #fdfaf3; font: inherit; font-size: 16px; color: #3c2a21; cursor: pointer; }
.lt-langs button.on { background: #3c2a21; color: #fff; border-color: #3c2a21; }
.lt-send { width: 100%; padding: 16px; border-radius: 999px; border: 0; background: #ff4f0a; color: #fff; font: inherit; font-size: 18px; font-weight: 700; cursor: pointer; margin-top: 6px; }
.lt-send:disabled { opacity: .6; }
.lt-error { color: #b3261e; text-align: center; margin: 4px 0 8px; }
.lt-foot { text-align: center; color: #8a7a70; font-size: 13px; margin-top: 12px; }
`;

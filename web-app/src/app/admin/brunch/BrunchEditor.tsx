'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadPublicImage } from '@/lib/imageUpload';
import { brandConfirm } from '@/lib/brandDialog';
import {
  DEFAULT_INCLUDES, EXTRA_SUGGESTIONS, SPONSOR_KINDS, VENUE_KINDS, VOTE_CLOSE_DAYS, brasiliaToIso, fmtWhen, isoToBrasilia, slugify,
  type BrunchEvent, type Sponsor, type SponsorKind, type VenueKind,
} from '@/lib/brunch';

export interface PrivateInfo { address: string; maps_url: string; arrival_notes: string }

const STEPS = ['tema', 'lugar', 'quando', 'lugares', 'fotos', 'parceiros', 'revisao'] as const;

/**
 * Creating or editing a brunch, one question per screen (the /admin/caixas pattern Dolly liked): theme, place,
 * date, seats & price, photos & what's included, sponsors & pop-ups, review. Saves brunch_events (public) and
 * brunch_event_private (the address, admins only).
 */
export default function BrunchEditor({ initial, privateInfo, onDone }: {
  initial: BrunchEvent | null;
  privateInfo: PrivateInfo | null;
  onDone: (savedId: string | null) => void;
}) {
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? '');
  const [theme, setTheme] = useState(initial?.theme ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [venueKindId, setVenueKindId] = useState<VenueKind>(initial?.venue_kind ?? 'casa');
  const [venueName, setVenueName] = useState(initial?.venue_name ?? '');
  const [venueBlurb, setVenueBlurb] = useState(initial?.venue_blurb ?? '');
  const [venuePhoto, setVenuePhoto] = useState(initial?.venue_photo ?? '');
  const [venueUrl, setVenueUrl] = useState(initial?.venue_url ?? '');
  const [city, setCity] = useState(initial?.city ?? 'Itamambuca, Ubatuba');
  const [address, setAddress] = useState(privateInfo?.address ?? '');
  const [mapsUrl, setMapsUrl] = useState(privateInfo?.maps_url ?? '');
  const [arrival, setArrival] = useState(privateInfo?.arrival_notes ?? '');
  const [starts, setStarts] = useState(isoToBrasilia(initial?.starts_at));
  const [ends, setEnds] = useState(isoToBrasilia(initial?.ends_at));
  const [presaleDays, setPresaleDays] = useState(() => {
    if (!initial?.members_first_until) return 0;
    const created = initial.created_at ? new Date(initial.created_at).getTime() : Date.now();
    return Math.max(1, Math.round((new Date(initial.members_first_until).getTime() - created) / 86400000));
  });
  const [capacity, setCapacity] = useState(initial?.capacity ?? 12);
  const [price, setPrice] = useState(initial ? String(initial.price) : '180');
  const [cover, setCover] = useState(initial?.cover_url ?? '');
  const [gallery, setGallery] = useState<string[]>(initial?.gallery ?? []);
  const [includes, setIncludes] = useState((initial?.includes?.length ? initial.includes : DEFAULT_INCLUDES).join('\n'));
  const [extras, setExtras] = useState<string[]>(initial?.extras ?? []);
  const [extraText, setExtraText] = useState('');
  const [sponsors, setSponsors] = useState<Sponsor[]>(initial?.sponsors ?? []);
  const [hostNote, setHostNote] = useState(initial?.host_note ?? '');
  const [publish, setPublish] = useState(initial ? initial.status === 'publicado' : true);
  const [uploading, setUploading] = useState('');
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState('');

  const upload = async (file: File | undefined, key: string, set: (url: string) => void) => {
    if (!file) return;
    setUploading(key);
    try { set(await uploadPublicImage(file, 'brunch')); } catch { setProblem('A foto não subiu. Tente de novo.'); }
    setUploading('');
  };

  const check = (i: number): string => {
    if (i === 0 && title.trim().length < 4) return 'Dê um nome ao brunch.';
    if (i === 2 && !starts) return 'Escolha o dia e a hora.';
    if (i === 2 && ends && ends <= starts) return 'O fim tem que ser depois do começo.';
    if (i === 3 && capacity < 1) return 'Pelo menos 1 lugar.';
    if (i === 3 && (Number.isNaN(Number(price)) || Number(price) < 0)) return 'Confira o valor.';
    return '';
  };
  const next = () => { const p = check(step); setProblem(p); if (!p) setStep(s => Math.min(STEPS.length - 1, s + 1)); };
  const back = () => { setProblem(''); setStep(s => Math.max(0, s - 1)); };

  const save = async () => {
    for (let i = 0; i < STEPS.length; i++) { const p = check(i); if (p) { setProblem(p); setStep(i); return; } }
    setSaving(true);
    setProblem('');
    const startsIso = brasiliaToIso(starts);
    const row = {
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      theme: theme.trim() || null,
      description: description.trim() || null,
      starts_at: startsIso,
      ends_at: ends ? brasiliaToIso(ends) : null,
      venue_kind: venueKindId,
      venue_name: venueName.trim() || null,
      venue_blurb: venueBlurb.trim() || null,
      venue_photo: venuePhoto || null,
      venue_url: venueUrl.trim() || null,
      city: city.trim() || null,
      price: Number(price) || 0,
      capacity,
      cover_url: cover || null,
      gallery,
      includes: includes.split('\n').map(s => s.trim()).filter(Boolean),
      extras,
      sponsors: sponsors.filter(s => s.name.trim()),
      // Pre-sale for the Círculo counts from the moment it is published.
      members_first_until: presaleDays > 0
        ? (initial?.members_first_until && initial.status === 'publicado' ? initial.members_first_until : new Date(Date.now() + presaleDays * 86400000).toISOString())
        : null,
      host_note: hostNote.trim() || null,
      status: publish ? 'publicado' : (initial?.status === 'encerrado' ? 'encerrado' : 'rascunho'),
    };

    let id = initial?.id ?? null;
    if (id) {
      const { error } = await supabase.from('brunch_events').update(row).eq('id', id);
      if (error) { setProblem(error.message); setSaving(false); return; }
    } else {
      const base = slugify(`${title} ${starts.slice(0, 7)}`) || `brunch-${Date.now()}`;
      let slug = base;
      for (let n = 2; n < 20; n++) {
        const { data } = await supabase.from('brunch_events').select('id').eq('slug', slug).maybeSingle();
        if (!data) break;
        slug = `${base}-${n}`;
      }
      const { data, error } = await supabase.from('brunch_events').insert([{ ...row, slug }]).select('id').single();
      if (error) {
        setProblem(/brunch_events/.test(error.message) ? 'Rode a migration_41_brunch.sql no Supabase primeiro.' : error.message);
        setSaving(false);
        return;
      }
      id = data.id;
    }
    const { error: pErr } = await supabase.from('brunch_event_private').upsert({
      event_id: id, address: address.trim() || null, maps_url: mapsUrl.trim() || null, arrival_notes: arrival.trim() || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'event_id' });
    if (pErr) console.error('brunch_event_private:', pErr.message);
    setSaving(false);
    onDone(id);
  };

  const venue = VENUE_KINDS.find(v => v.id === venueKindId)!;
  const when = starts ? fmtWhen({ starts_at: brasiliaToIso(starts), ends_at: ends ? brasiliaToIso(ends) : null }) : '—';
  const toggleExtra = (x: string) => setExtras(list => (list.includes(x) ? list.filter(y => y !== x) : [...list, x]));
  const setSponsor = (i: number, patch: Partial<Sponsor>) => setSponsors(list => list.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  return (
    <div className="bx">
      <div className="bx-flow">
        <div className="bx-flow__top">
          <span style={{ fontWeight: 800 }}>{initial ? 'Editando o brunch' : 'Novo brunch'}</span>
          <button type="button" className="bx-btn bx-btn--ghost" onClick={async () => {
            if (await brandConfirm('Sair sem salvar? O que você mudou aqui se perde.', { confirmLabel: 'Sair sem salvar' })) onDone(null);
          }}>✕ Sair</button>
        </div>
        <div className="bx-progress" aria-hidden>
          {STEPS.map((_, i) => <span key={i} className={i <= step ? 'is-done' : ''}><i /></span>)}
        </div>

        <div className="bx-step" key={step}>
          <p className="bx-step__kicker">Passo {step + 1} de {STEPS.length}</p>

          {step === 0 && (
            <>
              <h1 className="bx-step__title">Sobre o que vai ser este brunch?</h1>
              <p className="bx-step__lead">Um nome bonito e o tema da conversa. É o que faz alguém pensar “esse é para mim”.</p>
              <label className="bx-field" style={{ marginBottom: '1rem' }}><span>Nome do brunch</span>
                <input className="bx-input bx-input--big" value={title} onChange={e => setTitle(e.target.value)} maxLength={90} placeholder="Chá das Empreendedoras do Bem-Estar" />
              </label>
              <label className="bx-field" style={{ marginBottom: '1rem' }}><span>Tema da conversa</span>
                <input className="bx-input" value={theme} onChange={e => setTheme(e.target.value)} maxLength={160} placeholder="Como transformar o que você sabe sobre saúde num trabalho que paga as contas" />
              </label>
              <label className="bx-field" style={{ marginBottom: '1rem' }}><span>Uma frase de convite (opcional)</span>
                <input className="bx-input" value={subtitle} onChange={e => setSubtitle(e.target.value)} maxLength={160} placeholder="Uma manhã de chá, doces e gente boa no jardim" />
              </label>
              <label className="bx-field"><span>Conte mais (opcional)</span>
                <textarea className="bx-input" rows={5} value={description} onChange={e => setDescription(e.target.value)} placeholder="Quem vem falar, o que cada uma leva para casa, por que este tema agora." />
              </label>
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="bx-step__title">Onde vai ser?</h1>
              <p className="bx-step__lead">O site mostra o tipo de lugar e o nome. O endereço exato só aparece para quem pagou.</p>
              <div className="bx-choices">
                {VENUE_KINDS.map(v => (
                  <button key={v.id} type="button" className={`bx-choice${venueKindId === v.id ? ' is-on' : ''}`} onClick={() => setVenueKindId(v.id)} aria-pressed={venueKindId === v.id}>
                    <span className="bx-choice__icon">{v.emoji}</span>
                    <span className="bx-choice__title">{v.label}</span>
                    <span className="bx-choice__text">{v.blurb}</span>
                  </button>
                ))}
              </div>
              <div className="bx-card" style={{ marginTop: '1.25rem', display: 'grid', gap: '0.9rem' }}>
                <label className="bx-field"><span>Nome do lugar</span>
                  <input className="bx-input" value={venueName} onChange={e => setVenueName(e.target.value)} placeholder={venueKindId === 'casa' ? 'Casa da Dolly' : 'Pousada Recanto da Mata'} />
                </label>
                <label className="bx-field"><span>Como você descreve o lugar (aparece no site)</span>
                  <input className="bx-input" value={venueBlurb} onChange={e => setVenueBlurb(e.target.value)} placeholder="Um jardim a 100 m da praia, com música ao vivo e pop-ups" />
                </label>
                <label className="bx-field"><span>Cidade / região</span>
                  <input className="bx-input" value={city} onChange={e => setCity(e.target.value)} />
                </label>
                <label className="bx-field"><span>Site ou Instagram do lugar (opcional)</span>
                  <input className="bx-input" value={venueUrl} onChange={e => setVenueUrl(e.target.value)} placeholder="https://instagram.com/…" />
                </label>
                <label className="bx-drop" style={{ minHeight: 160 }}>
                  {venuePhoto && <img src={venuePhoto} alt="" />}
                  {!venuePhoto && <span style={{ fontSize: '2.2rem' }}>📷</span>}
                  <span className="bx-drop__label">{uploading === 'venue' ? 'Enviando…' : venuePhoto ? 'Trocar a foto do lugar' : 'Foto do lugar (opcional)'}</span>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => upload(e.target.files?.[0], 'venue', setVenuePhoto)} />
                </label>
              </div>
              <div className="bx-card" style={{ marginTop: '1rem', display: 'grid', gap: '0.9rem', background: '#fffaf0' }}>
                <p style={{ margin: 0, fontWeight: 800 }}>🔒 Só para quem pagou</p>
                <label className="bx-field"><span>Endereço exato</span>
                  <input className="bx-input" value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua…, nº…, Itamambuca" />
                </label>
                <label className="bx-field"><span>Link do Google Maps</span>
                  <input className="bx-input" value={mapsUrl} onChange={e => setMapsUrl(e.target.value)} placeholder="https://maps.app.goo.gl/…" />
                </label>
                <label className="bx-field"><span>Como chegar, onde estacionar, o que levar</span>
                  <textarea className="bx-input" rows={3} value={arrival} onChange={e => setArrival(e.target.value)} placeholder="Estacione na rua de cima. Venha de roupa leve: depois tem banho de mar." />
                </label>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="bx-step__title">Quando?</h1>
              <p className="bx-step__lead">Horário de Brasília. A votação das convidadas fecha {VOTE_CLOSE_DAYS} dias antes, para a cozinha se organizar.</p>
              <div className="bx-dates">
                <label className="bx-field"><span>Começa</span><input type="datetime-local" className="bx-input" value={starts} onChange={e => setStarts(e.target.value)} /></label>
                <label className="bx-field"><span>Termina</span><input type="datetime-local" className="bx-input" value={ends} min={starts || undefined} onChange={e => setEnds(e.target.value)} /></label>
              </div>
              {starts && <p className="bx-say">🗓️ {when}</p>}
              <button type="button" className={`bx-switch${presaleDays > 0 ? ' is-on' : ''}`} style={{ marginTop: '1.25rem' }} onClick={() => setPresaleDays(d => (d > 0 ? 0 : 2))} aria-pressed={presaleDays > 0}>
                <span>
                  <strong style={{ display: 'block', fontSize: '1.05rem' }}>Pré-venda para o Círculo</strong>
                  <span style={{ color: '#6a6a6a', fontSize: '0.9rem' }}>
                    {presaleDays > 0 ? `Nos primeiros ${presaleDays} dias só quem já veio a um brunch ou assina a caixa pode comprar.` : 'Abre para todo mundo na hora.'}
                  </span>
                </span>
                <span className="bx-switch__knob" />
              </button>
              {presaleDays > 0 && (
                <div className="bx-counter" style={{ marginTop: '0.75rem' }}>
                  <div className="bx-counter__label">Dias de pré-venda</div>
                  <div className="bx-counter__ctl">
                    <button type="button" className="bx-round" onClick={() => setPresaleDays(d => Math.max(1, d - 1))} aria-label="Menos">−</button>
                    <span className="bx-counter__value">{presaleDays}</span>
                    <button type="button" className="bx-round" onClick={() => setPresaleDays(d => Math.min(14, d + 1))} aria-label="Mais">+</button>
                  </div>
                </div>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="bx-step__title">Quantos lugares, e por quanto?</h1>
              <p className="bx-step__lead">Mesa pequena vende mais: a escassez é real e todo mundo conversa com todo mundo.</p>
              <div className="bx-card">
                <div className="bx-counter">
                  <div className="bx-counter__label">Lugares<small>Quem paga primeiro garante. Lotou, vira lista de espera.</small></div>
                  <div className="bx-counter__ctl">
                    <button type="button" className="bx-round" onClick={() => setCapacity(c => Math.max(1, c - 1))} aria-label="Menos">−</button>
                    <span className="bx-counter__value">{capacity}</span>
                    <button type="button" className="bx-round" onClick={() => setCapacity(c => c + 1)} aria-label="Mais">+</button>
                  </div>
                </div>
              </div>
              <label className="bx-field" style={{ marginTop: '1.25rem', maxWidth: 280 }}><span>Valor por pessoa (R$)</span>
                <input className="bx-input bx-input--big" inputMode="decimal" value={price} onChange={e => setPrice(e.target.value.replace(',', '.'))} />
              </label>
              <p className="bx-say">💌 Quem vier pode usar esse valor como crédito na assinatura Anual da caixa. 0 = gratuito.</p>
            </>
          )}

          {step === 4 && (
            <>
              <h1 className="bx-step__title">Fotos e o que vem junto</h1>
              <p className="bx-step__lead">A foto principal vende. A lista mostra tudo o que a pessoa leva pelo valor.</p>
              <label className="bx-drop">
                {cover && <img src={cover} alt="" />}
                {!cover && <span style={{ fontSize: '2.6rem' }}>📷</span>}
                <span className="bx-drop__label">{uploading === 'cover' ? 'Enviando…' : cover ? 'Trocar a foto principal' : 'Foto principal (sem foto, usamos a do jardim)'}</span>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => upload(e.target.files?.[0], 'cover', setCover)} />
              </label>
              <div className="bx-thumbs">
                {gallery.map(src => (
                  <div key={src} className="bx-thumb">
                    <img src={src} alt="" />
                    <button type="button" aria-label="Remover foto" onClick={() => setGallery(g => g.filter(x => x !== src))}>✕</button>
                  </div>
                ))}
                <label className="bx-thumb bx-thumb--add" aria-label="Adicionar fotos">
                  {uploading === 'gallery' ? '…' : '+'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => upload(e.target.files?.[0], 'gallery', url => setGallery(g => [...g, url]))} />
                </label>
              </div>
              <label className="bx-field" style={{ marginTop: '1.5rem' }}><span>O que vem no ingresso (um por linha)</span>
                <textarea className="bx-input" rows={6} value={includes} onChange={e => setIncludes(e.target.value)} />
              </label>
              <p style={{ fontWeight: 700, margin: '1.25rem 0 0.5rem' }}>Extras deste brunch</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {[...EXTRA_SUGGESTIONS, ...extras.filter(x => !EXTRA_SUGGESTIONS.includes(x))].map(x => (
                  <button key={x} type="button" className={`bx-chip`} style={{ border: '1px solid', borderColor: extras.includes(x) ? '#222' : '#e6e2dc', background: extras.includes(x) ? '#f7f4ef' : '#fff', minHeight: 40, cursor: 'pointer', fontSize: '0.9rem' }} onClick={() => toggleExtra(x)} aria-pressed={extras.includes(x)}>
                    {extras.includes(x) ? '✓ ' : ''}{x}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
                <input className="bx-input" value={extraText} onChange={e => setExtraText(e.target.value)} placeholder="Outro extra, ex: 🍷 Vinho natural" />
                <button type="button" className="bx-btn bx-btn--ghost" onClick={() => { if (extraText.trim()) { setExtras(l => [...l, extraText.trim()]); setExtraText(''); } }}>Pôr</button>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <h1 className="bx-step__title">Quem faz junto?</h1>
              <p className="bx-step__lead">O lugar que recebe, patrocinadores e pop-ups. Aparecem na página do brunch com logo e link. Pode pular.</p>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {sponsors.map((s, i) => (
                  <div key={i} className="bx-card" style={{ display: 'grid', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <label className="bx-thumb" style={{ cursor: 'pointer', flexShrink: 0 }} aria-label="Logo">
                        {s.logo_url ? <img src={s.logo_url} alt="" /> : <span style={{ fontSize: '1.4rem' }}>{uploading === `sp${i}` ? '…' : '🏷️'}</span>}
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => upload(e.target.files?.[0], `sp${i}`, url => setSponsor(i, { logo_url: url }))} />
                      </label>
                      <input className="bx-input" value={s.name} onChange={e => setSponsor(i, { name: e.target.value })} placeholder="Nome" />
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {SPONSOR_KINDS.map(k => (
                        <button key={k.id} type="button" className="bx-chip" style={{ border: '1px solid', borderColor: s.kind === k.id ? '#222' : '#e6e2dc', background: s.kind === k.id ? '#f7f4ef' : '#fff', minHeight: 40, cursor: 'pointer' }} onClick={() => setSponsor(i, { kind: k.id as SponsorKind })}>{k.label}</button>
                      ))}
                    </div>
                    <input className="bx-input" value={s.blurb ?? ''} onChange={e => setSponsor(i, { blurb: e.target.value })} placeholder="Uma linha: o que é / o que oferece" />
                    <input className="bx-input" value={s.url ?? ''} onChange={e => setSponsor(i, { url: e.target.value })} placeholder="Site ou Instagram" />
                    <button type="button" className="bx-link bx-link--danger" style={{ justifySelf: 'start' }} onClick={() => setSponsors(l => l.filter((_, j) => j !== i))}>Tirar</button>
                  </div>
                ))}
                <button type="button" className="bx-btn bx-btn--ghost" onClick={() => setSponsors(l => [...l, { name: '', kind: l.length === 0 && venueKindId !== 'casa' ? 'anfitriao' : 'patrocinador' }])}>+ Adicionar parceiro</button>
              </div>
            </>
          )}

          {step === 6 && (
            <>
              <h1 className="bx-step__title">Tudo certo?</h1>
              <div className="bx-review">
                {[
                  { s: 0, t: 'Nome e tema', v: `${title || '—'}${theme ? ` · ${theme}` : ''}` },
                  { s: 1, t: 'Lugar', v: `${venue.emoji} ${venueName || venue.label}${city ? ` · ${city}` : ''}${address ? ' · endereço salvo 🔒' : ' · sem endereço ainda'}` },
                  { s: 2, t: 'Quando', v: `${when}${presaleDays > 0 ? ` · pré-venda do Círculo por ${presaleDays} dias` : ''}` },
                  { s: 3, t: 'Lugares e valor', v: `${capacity} lugares · ${Number(price) > 0 ? `R$ ${price}` : 'gratuito'}` },
                  { s: 4, t: 'Fotos e extras', v: `${cover ? 'com foto' : 'foto do jardim'} · ${includes.split('\n').filter(Boolean).length} itens no ingresso${extras.length ? ` · ${extras.join(', ')}` : ''}` },
                  { s: 5, t: 'Parceiros', v: sponsors.filter(s => s.name.trim()).map(s => s.name).join(', ') || 'nenhum' },
                ].map(r => (
                  <div key={r.s} className="bx-review__row">
                    <div style={{ minWidth: 0 }}><strong>{r.t}</strong><span>{r.v}</span></div>
                    <button type="button" className="bx-link" onClick={() => setStep(r.s)}>Mudar</button>
                  </div>
                ))}
              </div>
              <label className="bx-field" style={{ marginTop: '1.25rem' }}><span>📌 Recado fixado no topo do grupo (opcional)</span>
                <textarea className="bx-input" rows={3} value={hostNote} onChange={e => setHostNote(e.target.value)} placeholder="Bem-vindas! Contem aqui quem vocês são e o que fazem. Nos vemos sábado 💛" />
              </label>
              <button type="button" className={`bx-switch${publish ? ' is-on' : ''}`} style={{ marginTop: '1.25rem' }} onClick={() => setPublish(p => !p)} aria-pressed={publish}>
                <span>
                  <strong style={{ display: 'block', fontSize: '1.05rem' }}>{publish ? 'No site, à venda' : 'Guardado, fora do site'}</strong>
                  <span style={{ color: '#6a6a6a', fontSize: '0.9rem' }}>{publish ? 'Aparece em /brunch ao salvar. Depois você pode anunciar por e-mail.' : 'Fica salvo aqui para publicar depois.'}</span>
                </span>
                <span className="bx-switch__knob" />
              </button>
            </>
          )}
        </div>

        <div className="bx-footer">
          {step > 0 ? <button type="button" className="bx-link" onClick={back}>← Voltar</button> : <span />}
          {problem && <span className="bx-footer__msg" role="alert">{problem}</span>}
          {step < STEPS.length - 1 ? (
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              {initial && <button type="button" className="bx-btn bx-btn--ghost" onClick={save} disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</button>}
              <button type="button" className="bx-btn bx-btn--dark" onClick={next}>Avançar</button>
            </div>
          ) : (
            <button type="button" className="bx-btn bx-btn--gold" onClick={save} disabled={saving}>
              {saving ? 'Salvando…' : initial ? 'Salvar mudanças' : publish ? '🚀 Publicar no site' : 'Salvar brunch'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

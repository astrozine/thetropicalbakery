'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useAuth, formatBrazilianPhone } from '@/context/AuthContext';
import LoginPanel from '@/components/LoginPanel';
import AddressFields, { AddressValue, EMPTY_ADDRESS, addressToOneLine } from '@/components/AddressFields';
import MySubscription from '@/components/MySubscription';
import MyPickups from '@/components/MyPickups';
import { SUBSCRIPTION_ZONES, formatBRL, isItamambuca } from '@/lib/deliveryZones';
import DietaryPicker, { DietaryValue } from '@/components/DietaryPicker';
import AccountSection from '@/components/AccountSection';
import AccountHero, { HeroAction } from '@/components/account/AccountHero';
import StampCard from '@/components/account/StampCard';
import TropicalTrail from '@/components/account/TropicalTrail';
import MyOrders from '@/components/account/MyOrders';
import { allergensFrom, dietTagsFrom, legacyFlags, normalizeDiet, tagsFromLegacy } from '@/lib/dietary';
import { Journey, STAMPS_PER_REWARD, TRAIL, levelFor, trailDone } from '@/lib/loyalty';
import { SUBSTACK_URL } from '@/lib/siteContact';
import { supabase } from '@/lib/supabase';
import { ACCOUNT_CSS } from './accountStyles';

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-primary)',
  marginBottom: '0.4rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.85rem 1rem',
  border: '1px solid rgba(212,175,55,0.5)',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.85)',
  fontFamily: 'var(--font-body)',
  fontSize: '1rem',
  outline: 'none',
};

const FOLD_ORDER = ['dados', 'endereco', 'dieta', 'gostos'] as const;
type FoldId = typeof FOLD_ORDER[number];

const FOLD_META: Record<FoldId, { emoji: string; todo: string; ok: string }> = {
  dados: { emoji: '🎂', todo: 'Seu aniversário (ganha surpresa)', ok: 'Seus dados' },
  endereco: { emoji: '🏡', todo: 'Onde entregamos', ok: 'Endereço' },
  dieta: { emoji: '🌱', todo: 'Restrições e alergias', ok: 'Restrições' },
  gostos: { emoji: '💛', todo: 'Sabores que você ama', ok: 'Seus gostos' },
};

type Tab = 'inicio' | 'pedidos' | 'perfil';
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'inicio', label: 'Início', emoji: '🌴' },
  { id: 'pedidos', label: 'Pedidos', emoji: '📦' },
  { id: 'perfil', label: 'Perfil', emoji: '✨' },
];

/** Which folds are filled in. Pure, so it can run before the form state has caught up with the profile. */
function completeness(
  b: { full_name: string; phone: string; birth_date: string; household_size: string },
  a: AddressValue,
  d: DietaryValue,
  t: { allergies: string; favorite_flavors: string; avoid_ingredients: string },
): Record<FoldId, boolean> {
  return {
    dados: !!(b.full_name.trim() && b.phone.trim() && b.birth_date && b.household_size),
    endereco: !!(a.address_street.trim() && a.address_number.trim() && a.address_neighborhood.trim()),
    dieta: d.tags.length + d.allergens.length > 0 || !!t.allergies.trim(),
    gostos: !!(t.favorite_flavors.trim() || t.avoid_ingredients.trim()),
  };
}

const SHARE_TEXT = encodeURIComponent(
  'Conheci a The Tropical Bakery: doces veganos, sem glúten e sem açúcar refinado, feitos em Itamambuca. Você vai amar 🌴 https://thetropicalbakery.com',
);

export default function MyAccountPage() {
  const { user, profile, loading, saveProfile, signOut } = useAuth();

  const [basics, setBasics] = useState({
    full_name: '',
    phone: '',
    birth_date: '',
    household_size: '',
    delivery_zone: SUBSCRIPTION_ZONES[0]?.id ?? 'zone1',
  });
  const [address, setAddress] = useState<AddressValue>(EMPTY_ADDRESS);
  const [diet, setDiet] = useState<DietaryValue>({ tags: [], allergens: [], notes: '' });
  const [tastes, setTastes] = useState({
    allergies: '',
    favorite_flavors: '',
    avoid_ingredients: '',
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [openIds, setOpenIds] = useState<string[]>([]);
  // What was last saved, to tell when there are unsaved changes.
  const [baseline, setBaseline] = useState('');
  const openedFirst = useRef(false);

  const [tab, setTabState] = useState<Tab>('inicio');
  const tabsRef = useRef<HTMLDivElement>(null);
  // null = not loaded yet or migration 30 not run; the page then hides what needs it.
  const [journey, setJourney] = useState<Journey | null>(null);
  const [subStatus, setSubStatus] = useState<string | null>(null);
  const [loadedAt, setLoadedAt] = useState(0);

  const toggle = (id: string) => setOpenIds(ids => (ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]));

  const setTab = useCallback((t: Tab, scroll = true) => {
    setTabState(t);
    try { history.replaceState(null, '', t === 'inicio' ? location.pathname : `#${t}`); } catch { /* ignore */ }
    if (scroll && tabsRef.current) {
      const y = tabsRef.current.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  }, []);

  // A link to /minha-conta#perfil or #pedidos lands on that tab.
  useEffect(() => {
    const h = location.hash.replace('#', '');
    if (h === 'perfil' || h === 'pedidos') setTabState(h);
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [{ data: j, error }, { data: subs }] = await Promise.all([
        supabase.rpc('my_journey'),
        supabase.from('subscriptions').select('status').order('created_at', { ascending: false }).limit(5),
      ]);
      if (cancelled) return;
      if (!error && j) setJourney(j as Journey);
      setLoadedAt(Date.now());
      const current = (subs || []).find(s => s.status !== 'cancelled');
      setSubStatus(current?.status ?? null);
    })();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!profile) return;

    const b = {
      full_name: profile.full_name || '',
      phone: profile.phone || '',
      birth_date: profile.birth_date || '',
      household_size: profile.household_size ? String(profile.household_size) : '',
      delivery_zone: profile.delivery_zone || SUBSCRIPTION_ZONES[0]?.id || 'zone1',
    };
    const a: AddressValue = {
      address_postal_code: profile.address_postal_code || '',
      address_street: profile.address_street || '',
      address_number: profile.address_number || '',
      address_complement: profile.address_complement || '',
      address_neighborhood: profile.address_neighborhood || '',
      // Anyone who filled in the old single-line address before the split keeps
      // it visible in "Rua" until they tidy it up, rather than losing it.
      address_city: profile.address_city || 'Ubatuba',
      address_reference: profile.address_reference || '',
      ...(!profile.address_street && profile.address
        ? { address_street: profile.address }
        : {}),
    };
    // An account from before migration 19 only has the five booleans.
    const d: DietaryValue = normalizeDiet({
      tags: profile.diet_tags?.length ? profile.diet_tags : tagsFromLegacy(profile),
      allergens: profile.allergens_avoid || [],
      notes: profile.diet_notes || '',
    });
    const t = {
      allergies: profile.allergies || '',
      favorite_flavors: profile.favorite_flavors || '',
      avoid_ingredients: profile.avoid_ingredients || '',
    };

    setBasics(b);
    setAddress(a);
    setDiet(d);
    setTastes(t);
    setBaseline(JSON.stringify({ basics: b, address: a, diet: d, tastes: t }));

    // The first time, open the first fold that still needs something from them.
    if (!openedFirst.current) {
      openedFirst.current = true;
      const c = completeness(b, a, d, t);
      const firstTodo = FOLD_ORDER.find(id => !c[id]);
      if (firstTodo) setOpenIds([firstTodo]);
    }
  }, [profile]);

  // Everything the form holds, as one comparable string.
  const snapshot = JSON.stringify({ basics, address, diet, tastes });
  const dirty = baseline !== '' && snapshot !== baseline;
  const done = completeness(basics, address, diet, tastes);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    await saveProfile({
      full_name: basics.full_name || null,
      phone: basics.phone || null,
      birth_date: basics.birth_date || null,
      household_size: basics.household_size ? Number(basics.household_size) : null,
      delivery_zone: basics.delivery_zone,
      ...address,
      // Keep the one-line version in step for the WhatsApp order messages.
      address: addressToOneLine(address),
      ...legacyFlags(diet.tags),
      diet_tags: diet.tags,
      allergens_avoid: diet.allergens,
      diet_notes: diet.notes.trim() || null,
      allergies: tastes.allergies || null,
      favorite_flavors: tastes.favorite_flavors || null,
      avoid_ingredients: tastes.avoid_ingredients || null,
    });

    // Keep the CRM list and the e-mail audience in step, so a change here also
    // changes which announcements reach this person. Never fails the save.
    const flags = legacyFlags(diet.tags);
    if (basics.phone) {
      await supabase.rpc('upsert_crm_customer', {
        p_full_name: basics.full_name || null,
        p_whatsapp_number: basics.phone,
        p_email: user?.email ?? null,
        p_is_vegan: flags.is_vegan,
        p_is_gluten_free: flags.is_gluten_free,
        p_is_sugar_free: flags.is_sugar_free,
        p_is_salt_free: flags.is_salt_free,
        p_is_oil_free: flags.is_oil_free,
        p_diet_tags: diet.tags,
        p_allergens: diet.allergens,
        p_diet_notes: tastes.allergies || null,
      }).then(({ error }) => { if (error) console.error('CRM sync:', error.message); });
    }
    if (user?.email) {
      await supabase.rpc('email_contact_set_diet', {
        p_email: user.email,
        p_diet_tags: diet.tags,
        p_allergens: diet.allergens,
        p_notes: tastes.allergies || null,
      }).then(({ error }) => { if (error) console.error('E-mail diet sync:', error.message); });
    }

    setBaseline(snapshot);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const openFold = (id: FoldId) => {
    setOpenIds(ids => (ids.includes(id) ? ids : [...ids, id]));
    setTabState('perfil');
    try { history.replaceState(null, '', '#perfil'); } catch { /* ignore */ }
    setTimeout(() => {
      document.getElementById(`fold-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const firstName = (basics.full_name || profile?.full_name || '').trim().split(' ')[0];
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const checks = Object.values(done);
  const pct = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const addressSummary = [
    [address.address_street, address.address_number].filter(Boolean).join(', '),
    address.address_neighborhood,
  ].filter(Boolean).join(' · ');
  const dietSummaryLine = [
    dietTagsFrom(diet.tags).map(t => t.label).join(', '),
    diet.allergens.length ? `${diet.allergens.length} ${diet.allergens.length === 1 ? 'alergia' : 'alergias'}: ${allergensFrom(diet.allergens).map(a => a.label).join(', ')}` : '',
  ].filter(Boolean).join(' · ');

  const inItamambuca = isItamambuca({
    delivery_zone: basics.delivery_zone,
    address_neighborhood: address.address_neighborhood,
    address_city: address.address_city,
  });

  // ---------------------------------------------------------------- the ladder
  const subscriber = subStatus === 'active' || subStatus === 'paused' || subStatus === 'pending';
  const paidBoxes = journey?.paid_boxes ?? 0;
  const { level, next, toNext } = levelFor(paidBoxes, subStatus === 'active');
  const trail = trailDone(journey, subscriber);
  const nextStep = TRAIL.find(s => !trail[s.id]);
  const orders = journey?.orders ?? [];
  const liveOrder = orders.find(o => o.stage === 'ready')
    ?? orders.find(o => o.stage === 'awaiting_payment' && loadedAt - new Date(o.created_at).getTime() < 14 * 86400000);

  const scrollToLive = () => {
    setTab('inicio', false);
    setTimeout(() => document.getElementById('acct-live')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  let heroAlert: string | undefined;
  let primary: HeroAction;
  if (liveOrder?.stage === 'ready') {
    heroAlert = '🎉 Sua caixa está pronta!';
    primary = { label: 'Ver minha caixa', onClick: scrollToLive };
  } else if (liveOrder) {
    heroAlert = '⏳ Seu pedido está esperando o Pix. O código está no e-mail que mandamos.';
    primary = { label: 'Ver meu pedido', onClick: () => setTab('pedidos') };
  } else if (subStatus === 'pending') {
    heroAlert = '⏳ Sua assinatura está aguardando o pagamento.';
    primary = { label: 'Ver minha assinatura', onClick: scrollToLive };
  } else if (subStatus === 'active') {
    primary = { label: 'Escolher os doces da semana', onClick: scrollToLive };
  } else if (nextStep) {
    primary = { label: nextStep.cta, href: nextStep.href };
  } else {
    primary = { label: 'Pedir uma caixa', href: '/caixas' };
  }
  const secondary: HeroAction | undefined = pct < 100
    ? { label: `Completar meu perfil · ${pct}%`, onClick: () => setTab('perfil') }
    : orders.length ? { label: 'Meus pedidos', onClick: () => setTab('pedidos') } : undefined;

  const stats: string[] = [];
  if (journey) stats.push(`🎟️ ${paidBoxes % STAMPS_PER_REWARD}/${STAMPS_PER_REWARD} carimbos`);
  if (journey?.first_order_at) {
    const since = new Date(journey.first_order_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '');
    stats.push(`Cliente desde ${since}`);
  }
  if (orders.length) stats.push(`${orders.length} ${orders.length === 1 ? 'pedido' : 'pedidos'}`);

  if (loading || !user) {
    return (
      <main style={{ minHeight: '100vh', paddingTop: '8rem', paddingBottom: '6rem', background: 'var(--color-background)' }}>
        <div className="container" style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1.5rem' }}>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 2.75rem)', fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
            Minha Conta
          </h1>
          {loading ? (
            <p style={{ color: '#7a6a61' }}>Carregando...</p>
          ) : (
            <>
              <p style={{ color: '#594a42', lineHeight: 1.8, marginBottom: '2rem' }}>
                Entre para salvar seus dados de entrega, juntar carimbos no cartão fidelidade e fazer seus próximos pedidos em segundos.
              </p>
              <LoginPanel />
            </>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="acct-page">
      <AccountHero
        firstName={firstName}
        avatarUrl={avatarUrl}
        level={level}
        next={next}
        toNext={toNext}
        ring={journey ? (paidBoxes % STAMPS_PER_REWARD) / STAMPS_PER_REWARD : pct / 100}
        stats={stats}
        primary={primary}
        secondary={secondary}
        alert={heroAlert}
      />

      <div className="acct-wrap">
        <div className="acct-tabs" role="tablist" aria-label="Minha conta" ref={tabsRef}>
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`acct-tab${tab === t.id ? ' is-on' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span aria-hidden>{t.emoji}</span> {t.label}
              {t.id === 'perfil' && pct < 100 && <span className="acct-tab-dot" aria-label="falta completar" />}
              {t.id === 'pedidos' && orders.length > 0 && <span className="acct-tab-count">{orders.length}</span>}
            </button>
          ))}
        </div>

        {/* ============================================================ INÍCIO */}
        <div role="tabpanel" hidden={tab !== 'inicio'} className="acct-home">
          <div className="acct-col-main">
            <div id="acct-live" className="acct-live">
              <MyPickups />
              <MySubscription />
            </div>
            <div className="acct-o-trail">
              <TropicalTrail done={trail} local={inItamambuca} />
            </div>
          </div>

          <aside className="acct-col-side">
            <div className="acct-o-stamps">
              <StampCard paidBoxes={journey ? paidBoxes : null} />
            </div>

            <section className="acct-card acct-o-quest" aria-label="Seu perfil de sabor">
              <div className="acct-quest-head">
                <div className="acct-quest-ring" style={{ ['--p' as string]: `${pct}%` } as React.CSSProperties}>
                  <span>{pct}%</span>
                </div>
                <div>
                  <p className="acct-kicker">Seu perfil de sabor</p>
                  <h2 className="acct-h3">
                    {pct === 100 ? 'A Dolly já sabe tudo 🎉' : 'Quanto mais completo, mais a caixa é a sua cara'}
                  </h2>
                </div>
              </div>
              <ul className="acct-quest-list">
                {FOLD_ORDER.map(id => (
                  <li key={id}>
                    <button type="button" onClick={() => openFold(id)} className={done[id] ? 'is-done' : ''}>
                      <span aria-hidden>{done[id] ? '✓' : FOLD_META[id].emoji}</span>
                      {done[id] ? FOLD_META[id].ok : FOLD_META[id].todo}
                      <span className="acct-quest-go" aria-hidden>{done[id] ? 'editar' : '→'}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="acct-card acct-share acct-o-share" aria-label="Indique a Tropical">
              <p className="acct-kicker">Espalhe o sabor</p>
              <h2 className="acct-h3">Tem alguém que merece um doce? 💛</h2>
              <p className="acct-muted">Mande a Tropical para quem você ama, ou surpreenda com uma caixa de presente.</p>
              <div className="acct-share-row">
                <a href={`https://wa.me/?text=${SHARE_TEXT}`} target="_blank" rel="noopener noreferrer" className="acct-btn acct-btn-soft">
                  Indicar no WhatsApp
                </a>
                <Link href="/caixas" className="acct-btn acct-btn-soft">Mandar de presente 🎁</Link>
              </div>
            </section>

            <a href={SUBSTACK_URL} target="_blank" rel="noopener noreferrer" className="acct-letters acct-o-letters">
              <span aria-hidden>✉️</span>
              <span><strong>Sunbaked Letters</strong> · as receitas e histórias da Dolly no Substack (em inglês) ↗</span>
            </a>
          </aside>
        </div>

        {/* =========================================================== PEDIDOS */}
        <div role="tabpanel" hidden={tab !== 'pedidos'} className="acct-panel-narrow">
          {orders.length > 0 ? (
            <MyOrders orders={orders} />
          ) : (
            <div className="acct-empty">
              <p className="acct-empty-emoji" aria-hidden>📦</p>
              <h2 className="acct-h2">{journey ? 'Nenhum pedido ainda' : 'Seus pedidos aparecem aqui'}</h2>
              <p className="acct-muted">
                {journey
                  ? 'Sua primeira caixa ganha o primeiro carimbo do cartão fidelidade.'
                  : 'Retiradas e assinatura estão na aba Início.'}
              </p>
              <Link href="/caixas" className="acct-btn acct-btn-gold">Escolher minha caixa</Link>
            </div>
          )}
        </div>

        {/* ============================================================ PERFIL */}
        <div role="tabpanel" hidden={tab !== 'perfil'} className="acct-panel-narrow">
          <form onSubmit={handleSave}>
            <div className="acct-perfil-head">
              <h2 className="acct-h2">Seu perfil de sabor</h2>
              <p className="acct-muted">
                Tudo aqui é preenchido sozinho nos seus pedidos e na sua assinatura, e a cozinha confere antes de montar a sua caixa.
              </p>
              <div className="acct-bar" aria-hidden><div style={{ width: `${pct}%` }} /></div>
            </div>

            <div className="acct-folds">
              <div id="fold-dados">
                <AccountSection
                  id="dados" emoji="👤" accent="#e2792a" title="Seus dados"
                  open={openIds.includes('dados')} onToggle={() => toggle('dados')}
                  status={done.dados ? { label: 'Completo', tone: 'ok' } : { label: 'Falta preencher', tone: 'todo' }}
                  summary={[basics.full_name, basics.phone].filter(Boolean).join(' · ') || 'Nome, WhatsApp, aniversário…'}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: '2 1 220px' }}>
                        <label style={labelStyle}>Nome completo</label>
                        <input type="text" value={basics.full_name} onChange={e => setBasics({ ...basics, full_name: e.target.value })} placeholder="Ex: Ana Souza" style={inputStyle} />
                      </div>
                      <div style={{ flex: '1 1 170px' }}>
                        <label style={labelStyle}>WhatsApp (com DDD)</label>
                        <input type="tel" value={basics.phone} onChange={e => setBasics({ ...basics, phone: e.target.value })} placeholder="(12) 99123-4567" style={inputStyle} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: '1 1 180px' }}>
                        <label style={labelStyle}>
                          Aniversário <span style={{ textTransform: 'none', fontWeight: 400, color: '#a89a90' }}>(ganha surpresa 🎂)</span>
                        </label>
                        <input type="date" value={basics.birth_date} onChange={e => setBasics({ ...basics, birth_date: e.target.value })} style={inputStyle} />
                      </div>
                      <div style={{ flex: '1 1 180px' }}>
                        <label style={labelStyle}>Quantas pessoas em casa</label>
                        <input type="number" min={1} max={20} value={basics.household_size} onChange={e => setBasics({ ...basics, household_size: e.target.value })} placeholder="2" style={inputStyle} />
                      </div>
                    </div>
                  </div>
                </AccountSection>
              </div>

              <div id="fold-endereco">
                <AccountSection
                  id="endereco" emoji="🏡" accent="#5aa9e6" title="Onde entregamos"
                  open={openIds.includes('endereco')} onToggle={() => toggle('endereco')}
                  status={done.endereco ? { label: 'Completo', tone: 'ok' } : { label: 'Falta preencher', tone: 'todo' }}
                  summary={addressSummary || 'Rua, número, bairro e ponto de referência'}
                >
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={labelStyle}>Região</label>
                    <select value={basics.delivery_zone} onChange={e => setBasics({ ...basics, delivery_zone: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                      {SUBSCRIPTION_ZONES.map(z => (
                        <option key={z.id} value={z.id}>
                          {z.label}{z.fee > 0 ? ` — entrega ${formatBRL(z.fee)}` : ' — entrega inclusa'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <AddressFields value={address} onChange={setAddress} />
                </AccountSection>
              </div>

              <div id="fold-dieta">
                <AccountSection
                  id="dieta" emoji="🌱" accent="#9bab3c" title="Restrições e alergias"
                  open={openIds.includes('dieta')} onToggle={() => toggle('dieta')}
                  status={done.dieta ? { label: 'Preenchido', tone: 'ok' } : { label: 'Conte pra gente', tone: 'todo' }}
                  summary={dietSummaryLine || 'Vegano, sem glúten, alergias…'}
                >
                  <p style={{ fontSize: '0.86rem', color: '#7a6a61', lineHeight: 1.7, margin: '0 0 1rem' }}>
                    A gente confere isto contra <strong>cada doce</strong> antes de te mandar qualquer novidade.
                  </p>
                  <DietaryPicker value={diet} onChange={setDiet} showNotes={false} />

                  <div style={{ marginTop: '1.4rem' }}>
                    <label style={labelStyle}>Alergias, com as suas palavras</label>
                    <input
                      type="text" value={tastes.allergies}
                      onChange={e => setTastes({ ...tastes, allergies: e.target.value })}
                      placeholder="Ex: castanha de caju, amendoim"
                      style={{ ...inputStyle, borderColor: tastes.allergies ? '#c0392b' : 'rgba(212,175,55,0.5)' }}
                    />
                    <p style={{ fontSize: '0.75rem', color: '#7a6a61', marginTop: '0.4rem' }}>
                      Aparece destacado em vermelho na cozinha toda semana.
                    </p>
                  </div>
                </AccountSection>
              </div>

              <div id="fold-gostos">
                <AccountSection
                  id="gostos" emoji="💛" accent="#d9453a" title="Seus gostos"
                  open={openIds.includes('gostos')} onToggle={() => toggle('gostos')}
                  status={done.gostos ? { label: 'Preenchido', tone: 'ok' } : { label: 'Opcional', tone: 'quiet' }}
                  summary={tastes.favorite_flavors ? `Ama: ${tastes.favorite_flavors}` : 'Sabores que você ama e o que prefere não receber'}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                    <div>
                      <label style={labelStyle}>Sabores que você ama</label>
                      <input type="text" value={tastes.favorite_flavors} onChange={e => setTastes({ ...tastes, favorite_flavors: e.target.value })} placeholder="Ex: cacau intenso, coco, maracujá" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>O que você prefere não receber</label>
                      <input type="text" value={tastes.avoid_ingredients} onChange={e => setTastes({ ...tastes, avoid_ingredients: e.target.value })} placeholder="Ex: banana, hortelã" style={inputStyle} />
                      <p style={{ fontSize: '0.75rem', color: '#7a6a61', marginTop: '0.4rem' }}>
                        Não é alergia — só não é a sua praia. A Dolly troca por outra coisa.
                      </p>
                    </div>
                  </div>
                </AccountSection>
              </div>
            </div>

            <button type="submit" disabled={saving} className="acct-btn acct-btn-gold acct-save">
              {saving ? 'Salvando...' : saved ? '✅ Dados salvos!' : 'Salvar meus dados'}
            </button>

            {/* Appears when something has changed, on any tab, so nobody leaves without saving. */}
            {dirty && (
              <div role="status" className="acct-dirty">
                <span>✏️ Alterações não salvas</span>
                <button type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</button>
              </div>
            )}
          </form>

          <section className="acct-account" aria-label="Conta e privacidade">
            <p>
              🔐 Você entrou com{' '}
              <strong className="notranslate" translate="no">{user.email || formatBrazilianPhone(user.phone) || '—'}</strong>
            </p>
            <p>
              <Link href="/preferencias">Preferências de e-mail</Link>
              {' · '}
              <Link href="/privacidade">Privacidade</Link>
              {' · '}
              Para excluir sua conta, fale com a gente no{' '}
              <a href="https://wa.me/5511932119196" target="_blank" rel="noopener noreferrer">WhatsApp</a>.
            </p>
            <button type="button" onClick={signOut} className="acct-signout">Sair da conta</button>
          </section>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: ACCOUNT_CSS }} />
    </main>
  );
}

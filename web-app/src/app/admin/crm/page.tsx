'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { DIET_TAGS, allergensFrom, dietTagsFrom, tagsFromLegacy } from '@/lib/dietary';
import { ALLERGENS } from '@/lib/allergens';

interface CrmRow {
  id: string;
  full_name: string | null;
  whatsapp_number: string | null;
  location: string | null;
  email: string | null;
  auth_user_id: string | null;
  is_vegan: boolean;
  is_gluten_free: boolean;
  is_sugar_free: boolean;
  is_salt_free: boolean;
  is_oil_free: boolean;
  diet_tags?: string[] | null;
  allergens_avoid?: string[] | null;
  diet_notes?: string | null;
  created_at: string;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  auth_provider: string | null;
  is_vegan: boolean;
  is_gluten_free: boolean;
  is_sugar_free: boolean;
  is_salt_free: boolean;
  is_oil_free: boolean;
  diet_tags?: string[] | null;
  allergens_avoid?: string[] | null;
  diet_notes?: string | null;
  created_at: string;
}

/** One customer, however we came to know about them. */
interface Customer {
  key: string;
  name: string;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  provider: string | null;
  hasAccount: boolean;
  ordered: boolean;
  createdAt: string;
  /** Readable labels for the card. */
  dietary: string[];
  /** Ids, for the filters. */
  dietIds: string[];
  allergenIds: string[];
  allergies: string[];
  dietNotes: string | null;
  itamambuca: boolean;
}

const isItamambucaAddress = (address: string | null) => /itamambuca/i.test(address || '');

const PROVIDER_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  google: { label: 'Google', color: '#1a73e8', bg: '#e8f0fe' },
  facebook: { label: 'Facebook', color: '#1877F2', bg: '#e7f0fd' },
  email: { label: 'E-mail', color: '#7a4a00', bg: '#fff4e5' },
  phone: { label: 'Celular', color: '#0b6b3a', bg: '#e6f4ec' },
};

const digitsOnly = (v: string | null | undefined) => (v || '').replace(/\D/g, '');

/** Brazilian numbers are stored a few different ways; compare the last 8 digits. */
const phoneKey = (v: string | null | undefined) => {
  const d = digitsOnly(v);
  return d.length >= 8 ? d.slice(-8) : '';
};

/**
 * What this person eats. Prefers the detailed list (migration 19) and falls
 * back to the five old booleans for anyone recorded before that.
 */
const dietOf = (r: {
  is_vegan: boolean; is_gluten_free: boolean; is_sugar_free: boolean;
  is_salt_free: boolean; is_oil_free: boolean;
  diet_tags?: string[] | null; allergens_avoid?: string[] | null; diet_notes?: string | null;
}) => {
  const ids = r.diet_tags?.length ? r.diet_tags : tagsFromLegacy(r);
  const allergenIds = r.allergens_avoid || [];
  return {
    dietIds: ids,
    allergenIds,
    dietary: dietTagsFrom(ids).map(t => `${t.emoji} ${t.label}`),
    allergies: allergensFrom(allergenIds).map(a => `${a.emoji} ${a.label}`),
    dietNotes: r.diet_notes || null,
  };
};

const formatPhone = (v: string | null) => {
  const d = digitsOnly(v).replace(/^55/, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return v || '—';
};

export default function CRMAdmin() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [onlyItamambuca, setOnlyItamambuca] = useState(false);
  const [dietFilter, setDietFilter] = useState('');
  const [allergenFilter, setAllergenFilter] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setError('');

    // Two sources of truth, deliberately: `users` is everyone who has ordered,
    // `user_profiles` is everyone who has created an account. Plenty of people
    // are in one and not the other, so we merge rather than pick.
    const [crmRes, profileRes] = await Promise.all([
      supabase.from('users').select('*').order('created_at', { ascending: false }),
      supabase.from('user_profiles').select('*'),
    ]);

    if (crmRes.error) {
      console.error('Error fetching CRM users:', crmRes.error);
      setError('Não foi possível carregar a lista de clientes.');
      setLoading(false);
      return;
    }

    const crm = (crmRes.data || []) as CrmRow[];
    // A missing auth_provider column just means the migration hasn't run yet.
    const profiles = (profileRes.error ? [] : (profileRes.data || [])) as ProfileRow[];

    const profileById = new Map(profiles.map(p => [p.id, p]));
    const profileByPhone = new Map(
      profiles.filter(p => phoneKey(p.phone)).map(p => [phoneKey(p.phone), p]),
    );
    const usedProfileIds = new Set<string>();

    const merged: Customer[] = crm.map(c => {
      const profile =
        (c.auth_user_id && profileById.get(c.auth_user_id)) ||
        profileByPhone.get(phoneKey(c.whatsapp_number)) ||
        null;

      if (profile) usedProfileIds.add(profile.id);

      const address = c.location || profile?.address || null;
      return {
        key: `crm-${c.id}`,
        name: c.full_name || profile?.full_name || 'Sem nome',
        whatsapp: c.whatsapp_number || profile?.phone || null,
        email: c.email || profile?.email || null,
        address,
        provider: profile?.auth_provider || null,
        hasAccount: Boolean(profile),
        ordered: true,
        createdAt: c.created_at,
        // The CRM row is written at order time, so it's the fresher record.
        ...dietOf(c),
        itamambuca: isItamambucaAddress(address),
      };
    });

    // Anyone who made an account but hasn't ordered yet — a warm lead.
    for (const p of profiles) {
      if (usedProfileIds.has(p.id)) continue;
      merged.push({
        key: `profile-${p.id}`,
        name: p.full_name || 'Sem nome',
        whatsapp: p.phone,
        email: p.email,
        address: p.address,
        provider: p.auth_provider,
        hasAccount: true,
        ordered: false,
        createdAt: p.created_at,
        ...dietOf(p),
        itamambuca: isItamambucaAddress(p.address),
      });
    }

    merged.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    setCustomers(merged);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = customers;
    if (onlyItamambuca) list = list.filter(c => c.itamambuca);
    if (dietFilter) list = list.filter(c => c.dietIds.includes(dietFilter));
    if (allergenFilter) list = list.filter(c => c.allergenIds.includes(allergenFilter));
    if (!q) return list;
    return list.filter(c =>
      [c.name, c.email, c.address, c.whatsapp, c.dietNotes, ...c.dietary, ...c.allergies]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q)),
    );
  }, [customers, search, onlyItamambuca, dietFilter, allergenFilter]);

  // Only offer a filter for something at least one person actually marked.
  const dietOptions = useMemo(
    () => DIET_TAGS.map(t => ({ ...t, n: customers.filter(c => c.dietIds.includes(t.id)).length })).filter(o => o.n > 0),
    [customers],
  );
  const allergenOptions = useMemo(
    () => ALLERGENS.map(a => ({ ...a, n: customers.filter(c => c.allergenIds.includes(a.id)).length })).filter(o => o.n > 0),
    [customers],
  );

  const stats = useMemo(() => ({
    total: customers.length,
    withAccount: customers.filter(c => c.hasAccount).length,
    ordered: customers.filter(c => c.ordered).length,
    leads: customers.filter(c => c.hasAccount && !c.ordered).length,
    itamambuca: customers.filter(c => c.itamambuca).length,
  }), [customers]);

  if (loading) return <div style={{ padding: '2rem' }}>Carregando CRM...</div>;

  return (
    <div>
      <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '0.5rem' }}>CRM &amp; Base de Clientes</h1>
      <p style={{ color: '#7f8c8d', marginBottom: '2rem', lineHeight: 1.7 }}>
        Todo mundo que fez um pedido ou criou uma conta no site. Quem tem conta não precisa
        digitar nome, WhatsApp e endereço de novo — já vem preenchido no próximo pedido.
      </p>

      {error && (
        <div style={{ background: '#fdecea', border: '1px solid #f5c6cb', color: '#a03027', padding: '1rem 1.25rem', borderRadius: '8px', marginBottom: '2rem', lineHeight: 1.6 }}>
          {error} Se isso acabou de começar, confirme que seu e-mail está na lista de
          administradores (tabela <code>admins</code> no Supabase).
        </div>
      )}

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Clientes', value: stats.total },
          { label: 'Já pediram', value: stats.ordered },
          { label: 'Com conta', value: stats.withAccount },
          { label: 'Conta sem pedido', value: stats.leads },
          { label: '📍 Em Itamambuca', value: stats.itamambuca },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#2c3e50' }}>{s.value}</div>
            <div style={{ fontSize: '0.8rem', color: '#95a5a6', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          type="search"
          placeholder="Buscar por nome, e-mail, endereço, telefone ou restrição..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: '1 1 320px', padding: '0.9rem 1rem', border: '1px solid #dfe4ea', borderRadius: '8px', fontSize: '1rem', outline: 'none' }}
        />
        <button
          type="button"
          onClick={() => setOnlyItamambuca(v => !v)}
          style={{
            padding: '0.9rem 1.4rem',
            borderRadius: '8px',
            border: onlyItamambuca ? '1px solid #d4af37' : '1px solid #dfe4ea',
            background: onlyItamambuca ? '#fdf7ee' : 'white',
            color: onlyItamambuca ? '#8a6d1f' : '#7f8c8d',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          📍 Só Itamambuca{onlyItamambuca ? ' ✓' : ''}
        </button>
        <select
          value={dietFilter}
          onChange={e => setDietFilter(e.target.value)}
          style={{ padding: '0.9rem 1rem', borderRadius: '8px', border: dietFilter ? '1px solid #d4af37' : '1px solid #dfe4ea', background: dietFilter ? '#fdf7ee' : 'white', fontSize: '0.9rem', fontWeight: 700, color: dietFilter ? '#8a6d1f' : '#7f8c8d', cursor: 'pointer' }}
        >
          <option value="">🍽️ Todo jeito de comer</option>
          {dietOptions.map(o => <option key={o.id} value={o.id}>{o.emoji} {o.label} ({o.n})</option>)}
        </select>
        <select
          value={allergenFilter}
          onChange={e => setAllergenFilter(e.target.value)}
          style={{ padding: '0.9rem 1rem', borderRadius: '8px', border: allergenFilter ? '1px solid #c0392b' : '1px solid #dfe4ea', background: allergenFilter ? '#fdecea' : 'white', fontSize: '0.9rem', fontWeight: 700, color: allergenFilter ? '#a03027' : '#7f8c8d', cursor: 'pointer' }}
        >
          <option value="">🚫 Qualquer alergia</option>
          {allergenOptions.map(o => <option key={o.id} value={o.id}>Evita {o.label} ({o.n})</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: 'white', padding: '3rem', borderRadius: '12px', textAlign: 'center', color: '#7f8c8d', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          {customers.length === 0 ? 'Ainda não há clientes cadastrados.' : 'Nenhum cliente encontrado para essa busca.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {filtered.map(c => {
            const provider = c.provider ? PROVIDER_LABELS[c.provider] : null;
            return (
              <div key={c.key} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

                <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                    <h3 style={{ fontSize: '1.15rem', margin: 0, color: '#2c3e50' }}>{c.name}</h3>
                    {provider && (
                      <span style={{ background: provider.bg, color: provider.color, padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {provider.label}
                      </span>
                    )}
                    {!c.hasAccount && (
                      <span style={{ background: '#f1f2f6', color: '#7f8c8d', padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Sem conta
                      </span>
                    )}
                    {!c.ordered && (
                      <span style={{ background: '#fff4e5', color: '#7a4a00', padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Sem pedido
                      </span>
                    )}
                    {c.itamambuca && (
                      <span style={{ background: '#fdf7ee', color: '#8a6d1f', padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        📍 Itamambuca
                      </span>
                    )}
                  </div>

                  <div style={{ color: '#7f8c8d', fontSize: '0.92rem', lineHeight: 1.9, wordBreak: 'break-word' }}>
                    <div>📱 {formatPhone(c.whatsapp)}</div>
                    <div>✉️ {c.email || '—'}</div>
                    <div>📍 {c.address || 'Endereço não informado'}</div>
                    {c.createdAt && (
                      <div style={{ fontSize: '0.8rem', color: '#b2bec3' }}>
                        Desde {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ flex: '1 1 220px' }}>
                  <h4 style={{ fontSize: '0.8rem', color: '#95a5a6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Restrições Alimentares</h4>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {c.dietary.length > 0 ? c.dietary.map(tag => (
                      <span key={tag} style={{ background: '#fdf7ee', color: '#8a6d1f', border: '1px solid #e8e1d7', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 'bold' }}>
                        {tag}
                      </span>
                    )) : (
                      <span style={{ color: '#bdc3c7', fontSize: '0.9rem' }}>Nenhuma registrada.</span>
                    )}
                  </div>
                  {c.allergies.length > 0 && (
                    <>
                      <h4 style={{ fontSize: '0.8rem', color: '#c0392b', textTransform: 'uppercase', letterSpacing: '1px', margin: '0.85rem 0 0.5rem' }}>⚠️ Evita</h4>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {c.allergies.map(a => (
                          <span key={a} style={{ background: '#fdecea', color: '#a03027', border: '1px solid #f5c6cb', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 'bold' }}>
                            {a}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                  {c.dietNotes && (
                    <p style={{ fontSize: '0.83rem', color: '#7f8c8d', lineHeight: 1.6, marginTop: '0.6rem', fontStyle: 'italic' }}>“{c.dietNotes}”</p>
                  )}
                </div>

                {digitsOnly(c.whatsapp) && (
                  <div style={{ flex: '0 0 auto' }}>
                    <a
                      href={`https://wa.me/${digitsOnly(c.whatsapp).length <= 11 ? '55' + digitsOnly(c.whatsapp) : digitsOnly(c.whatsapp)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ background: '#25D366', color: 'white', padding: '0.8rem 1.4rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
                    >
                      Abrir WhatsApp
                    </a>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

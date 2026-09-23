'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

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
  dietary: string[];
}

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

const dietaryTags = (r: {
  is_vegan: boolean; is_gluten_free: boolean; is_sugar_free: boolean;
  is_salt_free: boolean; is_oil_free: boolean;
}) => {
  const tags: string[] = [];
  if (r.is_vegan) tags.push('Vegano');
  if (r.is_gluten_free) tags.push('Sem Glúten');
  if (r.is_sugar_free) tags.push('Sem Açúcar');
  if (r.is_salt_free) tags.push('Sem Sal');
  if (r.is_oil_free) tags.push('Sem Óleo');
  return tags;
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

      return {
        key: `crm-${c.id}`,
        name: c.full_name || profile?.full_name || 'Sem nome',
        whatsapp: c.whatsapp_number || profile?.phone || null,
        email: c.email || profile?.email || null,
        address: c.location || profile?.address || null,
        provider: profile?.auth_provider || null,
        hasAccount: Boolean(profile),
        ordered: true,
        createdAt: c.created_at,
        // The CRM row is written at order time, so it's the fresher record.
        dietary: dietaryTags(c),
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
        dietary: dietaryTags(p),
      });
    }

    merged.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    setCustomers(merged);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(c =>
      [c.name, c.email, c.address, c.whatsapp, ...c.dietary]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q)),
    );
  }, [customers, search]);

  const stats = useMemo(() => ({
    total: customers.length,
    withAccount: customers.filter(c => c.hasAccount).length,
    ordered: customers.filter(c => c.ordered).length,
    leads: customers.filter(c => c.hasAccount && !c.ordered).length,
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
        ].map(s => (
          <div key={s.label} style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#2c3e50' }}>{s.value}</div>
            <div style={{ fontSize: '0.8rem', color: '#95a5a6', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <input
        type="search"
        placeholder="Buscar por nome, e-mail, endereço, telefone ou restrição..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', padding: '0.9rem 1rem', border: '1px solid #dfe4ea', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '1rem', outline: 'none' }}
      />

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
                      <span key={tag} style={{ background: '#fdf7ee', color: '#d4af37', border: '1px solid #e8e1d7', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 'bold' }}>
                        {tag}
                      </span>
                    )) : (
                      <span style={{ color: '#bdc3c7', fontSize: '0.9rem' }}>Nenhuma registrada.</span>
                    )}
                  </div>
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

'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const field: React.CSSProperties = { width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #dfe4ea', background: 'white', fontSize: '0.95rem', fontFamily: 'inherit' };
const lbl: React.CSSProperties = { display: 'block', fontSize: '0.78rem', fontWeight: 'bold', color: '#7f8c8d', marginBottom: '0.3rem' };

/**
 * Admin card for the private pickup address. Customers never see it here or on
 * any public page: it is shown on their Minha Conta only once their pickup
 * order is marked "Pagamento Confirmado" (see migration_17_pickup.sql).
 */
export default function PickupInfoAdmin() {
  const [address, setAddress] = useState('');
  const [instructions, setInstructions] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    supabase.from('pickup_info').select('address, instructions').eq('id', 1).maybeSingle().then(({ data, error }) => {
      if (error) {
        setMessage({ ok: false, text: 'Falta rodar o arquivo migration_17_pickup.sql no Supabase (SQL Editor → cole o conteúdo → Run).' });
      } else if (data) {
        setAddress(data.address || '');
        setInstructions(data.instructions || '');
      }
      setLoaded(true);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const { error } = await supabase.from('pickup_info').upsert(
      { id: 1, address: address.trim(), instructions: instructions.trim(), updated_at: new Date().toISOString() },
      { onConflict: 'id' },
    );
    setSaving(false);
    setMessage(error ? { ok: false, text: `Não foi possível salvar: ${error.message}` } : { ok: true, text: 'Salvo ✓' });
  };

  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.15rem', color: '#2c3e50', marginBottom: '0.4rem' }}>🛍️ Retirada no home bakery</h2>
      <p style={{ fontSize: '0.85rem', color: '#7f8c8d', lineHeight: 1.7, marginBottom: '1.1rem' }}>
        O endereço <strong>nunca aparece no site</strong>. Só o cliente que escolheu retirada vê, em Minha Conta, depois que você marcar
        o pedido como <em>Pagamento Confirmado</em> na Caixa de Entrada (e some quando marcar <em>Retirado</em>). O dia da retirada é o
        dia que ele escolheu neste mesmo calendário.
      </p>
      <div style={{ display: 'grid', gap: '1rem', opacity: loaded ? 1 : 0.5 }}>
        <div>
          <label style={lbl}>Endereço para retirada</label>
          <textarea rows={3} style={field} value={address} onChange={e => setAddress(e.target.value)} placeholder={'Rua, número · bairro\nCidade · UF · CEP'} />
        </div>
        <div>
          <label style={lbl}>Como retirar (horário, portão, campainha…)</label>
          <textarea rows={3} style={field} value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="Ex: Retirada das 10h às 17h. Toque a campainha do portão verde." />
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={save} disabled={saving || !loaded} style={{ background: '#2c3e50', color: 'white', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          {message && <span role="status" style={{ fontSize: '0.88rem', fontWeight: 'bold', color: message.ok ? '#2e7d32' : '#c62828' }}>{message.text}</span>}
        </div>
      </div>
    </div>
  );
}

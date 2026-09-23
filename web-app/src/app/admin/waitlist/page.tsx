'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface WaitlistEntry {
  id: string;
  name: string;
  whatsapp: string;
  email: string | null;
  notified: boolean;
  created_at: string;
}

export default function AdminWaitlist() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const fetchWaitlist = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('waitlist')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) console.error(error);
    else setEntries(data || []);
    setLoading(false);
  };

  const toggleNotified = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('waitlist')
      .update({ notified: !currentStatus })
      .eq('id', id);
      
    if (error) alert('Erro ao atualizar: ' + error.message);
    else fetchWaitlist();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este contato?')) return;
    const { error } = await supabase.from('waitlist').delete().eq('id', id);
    if (error) alert('Erro ao deletar: ' + error.message);
    else fetchWaitlist();
  };

  const formatWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return `https://wa.me/55${cleaned.startsWith('55') ? cleaned.substring(2) : cleaned}`;
  };

  const notNotifiedCount = entries.filter(e => !e.notified).length;

  return (
    <div>
      <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '1rem' }}>Fila de Espera (Caixas)</h1>
      <p style={{ color: '#7f8c8d', marginBottom: '2rem' }}>
        Pessoas aguardando o próximo lote das caixas de degustação. 
        <br/>
        <strong>Nota:</strong> Como a automação do Twilio está configurada, os usuários não notificados serão avisados automaticamente quando você ativar um novo lote!
      </p>

      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', flex: 1, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: '4px solid #e74c3c' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#7f8c8d' }}>Aguardando Aviso</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#2c3e50' }}>{notNotifiedCount}</p>
        </div>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', flex: 1, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: '4px solid #2ecc71' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#7f8c8d' }}>Total de Leads</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#2c3e50' }}>{entries.length}</p>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>
        ) : entries.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#7f8c8d' }}>Nenhum contato na fila de espera ainda.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #ecf0f1', textAlign: 'left' }}>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 'bold', color: '#2c3e50' }}>Nome</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 'bold', color: '#2c3e50' }}>WhatsApp</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 'bold', color: '#2c3e50' }}>Email</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 'bold', color: '#2c3e50' }}>Status</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 'bold', color: '#2c3e50' }}>Data</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 'bold', color: '#2c3e50' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid #ecf0f1', opacity: entry.notified ? 0.6 : 1 }}>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 'bold' }}>{entry.name}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <a href={formatWhatsApp(entry.whatsapp)} target="_blank" rel="noopener noreferrer" style={{ color: '#27ae60', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {entry.whatsapp} ↗
                      </a>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: '#7f8c8d' }}>{entry.email || '-'}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ 
                        padding: '0.3rem 0.8rem', 
                        borderRadius: '20px', 
                        fontSize: '0.85rem', 
                        fontWeight: 'bold',
                        background: entry.notified ? '#e8f8f5' : '#fdedec',
                        color: entry.notified ? '#27ae60' : '#e74c3c'
                      }}>
                        {entry.notified ? 'Avisado' : 'Aguardando'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: '#7f8c8d', fontSize: '0.9rem' }}>
                      {new Date(entry.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => toggleNotified(entry.id, entry.notified)}
                          style={{ background: entry.notified ? '#95a5a6' : '#f39c12', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                          {entry.notified ? 'Marcar como Não Avisado' : 'Marcar como Avisado'}
                        </button>
                        <button 
                          onClick={() => handleDelete(entry.id)}
                          style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

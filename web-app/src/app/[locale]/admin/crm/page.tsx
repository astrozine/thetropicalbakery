'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  full_name: string;
  whatsapp_number: string;
  location: string;
  is_vegan: boolean;
  is_gluten_free: boolean;
  is_sugar_free: boolean;
  is_salt_free: boolean;
  is_oil_free: boolean;
  created_at: string;
}

export default function CRMAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    // Fetch users (customers) from the CRM table. 
    // This connects to the public users table holding their details from the checkout.
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching CRM users:', error);
    else setUsers(data || []);
    setLoading(false);
  };

  const getDietaryTags = (u: User) => {
    const tags = [];
    if (u.is_vegan) tags.push('Vegano');
    if (u.is_gluten_free) tags.push('Sem Glúten');
    if (u.is_sugar_free) tags.push('Sem Açúcar');
    if (u.is_salt_free) tags.push('SOS-Free (Sem Sal)');
    if (u.is_oil_free) tags.push('SOS-Free (Sem Óleo)');
    return tags;
  };

  if (loading) return <div style={{ padding: '2rem' }}>Carregando CRM...</div>;

  return (
    <div>
      <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '0.5rem' }}>CRM & Base de Clientes</h1>
      <p style={{ color: '#7f8c8d', marginBottom: '2rem' }}>
        Abaixo estão todos os clientes que se cadastraram ou fizeram pedidos pelo site. 
        Você pode ver as informações de contato e as restrições alimentares de cada um para um atendimento personalizado.
      </p>

      {users.length === 0 ? (
        <div style={{ background: 'white', padding: '3rem', borderRadius: '12px', textAlign: 'center', color: '#7f8c8d', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          Ainda não há clientes cadastrados.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {users.map(u => {
            const tags = getDietaryTags(u);
            return (
              <div key={u.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                
                <div style={{ flex: '1 1 200px' }}>
                  <h3 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem', color: '#2c3e50' }}>{u.full_name || 'Sem Nome'}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#7f8c8d', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                    📱 {u.whatsapp_number}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#7f8c8d', fontSize: '0.95rem' }}>
                    📍 {u.location || 'Localização não informada'}
                  </div>
                </div>

                <div style={{ flex: '2 1 300px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: '#95a5a6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Restrições Alimentares</h4>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {tags.length > 0 ? tags.map(tag => (
                      <span key={tag} style={{ background: '#fdf7ee', color: '#d4af37', border: '1px solid #e8e1d7', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                        {tag}
                      </span>
                    )) : (
                      <span style={{ color: '#bdc3c7', fontSize: '0.9rem' }}>Nenhuma restrição registrada.</span>
                    )}
                  </div>
                </div>

                <div style={{ flex: '0 0 auto' }}>
                  <a 
                    href={`https://wa.me/${u.whatsapp_number}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ background: '#25D366', color: 'white', padding: '0.8rem 1.5rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    Abrir WhatsApp
                  </a>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

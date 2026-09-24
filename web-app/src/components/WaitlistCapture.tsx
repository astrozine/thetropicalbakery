'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export default function WaitlistCapture({ theme = 'dark' }: { theme?: 'light' | 'dark' }) {
  const [formData, setFormData] = useState({ name: '', whatsapp: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [user, setUser] = useState<User | null>(null);

  const isLight = theme === 'light';
  const textColor = isLight ? '#2c3e50' : 'white';
  const subtextColor = isLight ? '#594a42' : 'rgba(255,255,255,0.8)';
  const inputBg = isLight ? '#f8f9fa' : 'rgba(255,255,255,0.1)';
  const inputBorder = isLight ? '1px solid #ddd' : '1px solid rgba(255,255,255,0.2)';
  const containerBg = isLight ? 'white' : 'rgba(255,255,255,0.05)';
  const containerBorder = isLight ? '1px solid #eee' : '1px solid rgba(255,255,255,0.1)';
  const containerShadow = isLight ? '0 10px 30px rgba(0,0,0,0.05)' : 'none';

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setFormData(prev => ({
          ...prev,
          name: session.user.user_metadata?.full_name || prev.name,
          email: session.user.email || prev.email,
        }));
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setFormData(prev => ({
          ...prev,
          name: session.user.user_metadata?.full_name || prev.name,
          email: session.user.email || prev.email,
        }));
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + window.location.pathname
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase
      .from('waitlist')
      .insert([{ 
        name: formData.name, 
        whatsapp: formData.whatsapp, 
        email: formData.email 
      }]);

    setLoading(false);

    if (error) {
      setErrorMsg('Ocorreu um erro ao entrar na fila de espera. Tente novamente.');
      console.error(error);
    } else {
      // Add them to the e-mail list so they hear when the next batch opens.
      await supabase.rpc('email_contact_upsert', {
        p_email: formData.email, p_full_name: formData.name, p_tags: ['cliente'], p_source: 'fila_de_espera',
      });
      if (formData.name) localStorage.setItem('checkout_fullName', formData.name);
      if (formData.whatsapp) localStorage.setItem('checkout_phone', formData.whatsapp);
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div style={{ background: containerBg, padding: '2rem', borderRadius: '16px', backdropFilter: isLight ? 'none' : 'blur(10px)', border: containerBorder, boxShadow: containerShadow, maxWidth: '500px', margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
        <h3 style={{ color: '#d4af37', fontSize: '1.5rem', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>Tudo Certo! 🎉</h3>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.5', color: textColor }}>
          Você está na nossa lista VIP! Vamos te avisar pelo WhatsApp assim que o próximo lote surpresa for lançado. Fique de olho!
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: containerBg, padding: '2rem', borderRadius: '16px', backdropFilter: isLight ? 'none' : 'blur(10px)', border: containerBorder, boxShadow: containerShadow, maxWidth: '500px', margin: '0 auto', textAlign: 'left' }}>
      <h3 style={{ color: '#d4af37', fontSize: '1.3rem', marginBottom: '1rem', fontFamily: 'var(--font-heading)', textAlign: 'center' }}>
        Quero ser avisado do próximo lote!
      </h3>
      <p style={{ fontSize: '0.9rem', color: subtextColor, marginBottom: '1.5rem', textAlign: 'center' }}>
        Deixe seu contato para ter acesso prioritário ao menu surpresa antes que esgote novamente.
      </p>

      {!user && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button 
            type="button" 
            onClick={() => handleOAuthLogin('google')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.8rem', background: 'white', color: '#757575', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '18px', height: '18px' }} />
            Continuar com Google
          </button>
          <button 
            type="button" 
            onClick={() => handleOAuthLogin('facebook')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.8rem', background: '#1877F2', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            <svg viewBox="0 0 24 24" style={{ width: '18px', height: '18px', fill: 'white' }}><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            Continuar com Facebook
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: isLight ? '#ddd' : 'rgba(255,255,255,0.2)' }}></div>
            <span style={{ padding: '0 1rem', color: subtextColor, fontSize: '0.8rem', textTransform: 'uppercase' }}>Ou</span>
            <div style={{ flex: 1, height: '1px', background: isLight ? '#ddd' : 'rgba(255,255,255,0.2)' }}></div>
          </div>
        </div>
      )}
      
      {errorMsg && <div style={{ color: '#ff7675', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>{errorMsg}</div>}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <input 
            type="text" 
            required 
            placeholder="Seu Nome" 
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '8px', border: inputBorder, background: inputBg, color: textColor, fontSize: '1rem' }}
          />
        </div>
        <div>
          <input 
            type="tel" 
            required 
            placeholder="WhatsApp (com DDD)" 
            value={formData.whatsapp}
            onChange={e => setFormData({...formData, whatsapp: e.target.value})}
            style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '8px', border: inputBorder, background: inputBg, color: textColor, fontSize: '1rem' }}
          />
        </div>
        <div>
          <input 
            type="email" 
            placeholder="Email (opcional)" 
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
            style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '8px', border: inputBorder, background: inputBg, color: textColor, fontSize: '1rem' }}
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          style={{ width: '100%', padding: '1rem', background: '#d4af37', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.5rem', transition: 'background 0.3s' }}
        >
          {loading ? 'Cadastrando...' : 'Me Avise Primeiro!'}
        </button>
      </form>
    </div>
  );
}

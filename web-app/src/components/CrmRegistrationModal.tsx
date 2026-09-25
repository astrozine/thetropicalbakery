'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import LoginPanel from '@/components/LoginPanel';
import { SunbakedLettersNote } from '@/components/SunbakedLetters';

interface CrmRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  interestType: 'curso' | 'retiro';
  specificInterest: string;
}

export default function CrmRegistrationModal({ isOpen, onClose, interestType, specificInterest }: CrmRegistrationModalProps) {
  const { user, profile } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [groupSize, setGroupSize] = useState('');
  const [message, setMessage] = useState('');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const availableFocusAreas = interestType === 'curso' 
    ? ['Culinária Vegana', 'Culinária Sem Glúten', 'Substituições Saudáveis (SOS-Free)', 'Receitas Práticas', 'Empreendedorismo na Confeitaria']
    : ['Yoga & Meditação', 'Confeitaria Saudável', 'Relaxamento & Natureza', 'Transição para o Veganismo'];

  useEffect(() => {
    if (profile) {
      if (profile.full_name) setName(profile.full_name);
      if (profile.phone) setWhatsapp(profile.phone);
    }
    if (user?.email) setEmail(user.email);
  }, [profile, user]);

  const toggleFocusArea = (area: string) => {
    setFocusAreas(prev => 
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const formatWhatsApp = (value: string) => {
    // Remove everything that is not a digit
    let cleaned = ('' + value).replace(/\D/g, '');
    
    // Add Brazil country code if not present (assuming users might just enter DDD)
    if (cleaned.length === 11 && !cleaned.startsWith('55')) {
      cleaned = '55' + cleaned;
    }
    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !whatsapp.trim() || !dateStr) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setErrorMsg('');

    try {
      const row = {
        customer_name: name.trim(),
        email: email.trim(),
        customer_whatsapp: formatWhatsApp(whatsapp),
        interest_type: interestType,
        specific_interest: specificInterest,
        requested_date: dateStr,
        focus_areas: focusAreas,
      };
      const extra = { group_size: groupSize ? Number(groupSize) : null, message: message.trim() || null };

      let { error } = await supabase.from('course_registrations').insert([{ ...row, ...extra }]);

      // If the message/group-size columns aren't in the database yet (migration 18), never lose
      // what the customer wrote: keep it inside the interest line and save the rest as before.
      if (error && (extra.group_size || extra.message)) {
        const folded = [
          specificInterest,
          extra.group_size ? `${extra.group_size} pessoa(s)` : '',
          extra.message ? `Mensagem: ${extra.message}` : '',
        ].filter(Boolean).join(' | ');
        ({ error } = await supabase.from('course_registrations').insert([{ ...row, specific_interest: folded }]));
      }

      if (error) throw error;

      // Interested in courses/retreats -> the matching e-mail list.
      await supabase.rpc('email_contact_upsert', {
        p_email: email.trim(),
        p_full_name: name.trim(),
        p_tags: /retiro/i.test(interestType || '') ? ['retiros', 'cursos'] : ['cursos'],
        p_source: 'inscricao_curso',
      });

      setStatus('success');
      
      // Auto-close modal after 3 seconds
      setTimeout(() => {
        onClose();
        // Reset form
        setName('');
        setWhatsapp('');
        setDateStr('');
        setGroupSize('');
        setMessage('');
        setFocusAreas([]);
        setStatus('idle');
      }, 12000); // long enough to read the confirmation and open the newsletter link

    } catch (err: any) {
      console.error(err);
      setErrorMsg('Ocorreu um erro ao enviar sua reserva. Tente novamente.');
      setStatus('error');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 99999, // Super high z-index to match focus window
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            padding: '1rem',
            overflowY: 'auto'
          }}
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fdfaf3', padding: '2.5rem', borderRadius: '16px',
              maxWidth: '550px', width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(212,175,55,0.3)',
              position: 'relative'
            }}
          >
            <button 
              onClick={onClose}
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#7a6a61' }}
            >
              ✕
            </button>

            <span style={{ color: '#d4af37', letterSpacing: '3px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
              RESERVA EXCLUSIVA
            </span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', color: '#3c2a21', marginBottom: '0.5rem', lineHeight: '1.1' }}>
              {interestType === 'curso' ? 'Agendar Curso' : 'Agendar Retiro'}
            </h2>
            <p style={{ color: '#594a42', marginBottom: '2rem', fontSize: '1rem' }}>
              Insira seus dados abaixo. Nossa equipe entrará em contato para confirmar a disponibilidade da data e alinhar os detalhes da sua experiência <b>{specificInterest}</b>.
            </p>

            {status === 'success' ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✨</div>
                <h3 style={{ color: '#3c2a21', fontSize: '1.5rem', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>Reserva Recebida!</h3>
                <p style={{ color: '#594a42' }}>Você receberá uma mensagem no WhatsApp com os detalhes da sua reserva.</p>
                <SunbakedLettersNote />
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {status === 'error' && (
                   <div style={{ padding: '1rem', background: '#f8d7da', color: '#721c24', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
                     {errorMsg}
                   </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
                  <LoginPanel />
                  
                  <label style={{ display: 'block' }}>
                    <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#594a42', marginBottom: '0.4rem' }}>Nome Completo *</span>
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Seu nome"
                      style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.2)', fontFamily: 'inherit' }}
                    />
                  </label>
                  <label style={{ display: 'block' }}>
                    <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#594a42', marginBottom: '0.4rem' }}>E-mail *</span>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.2)', fontFamily: 'inherit' }}
                    />
                  </label>
                  <label style={{ display: 'block' }}>
                    <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#594a42', marginBottom: '0.4rem' }}>WhatsApp (DDD + Número) *</span>
                    <input 
                      type="text" 
                      required
                      value={whatsapp}
                      onChange={e => setWhatsapp(e.target.value)}
                      placeholder="Ex: 11999999999"
                      style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.2)', fontFamily: 'inherit' }}
                    />
                  </label>
                </div>

                <label style={{ display: 'block' }}>
                  <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#594a42', marginBottom: '0.4rem' }}>Data Desejada *</span>
                  <input 
                    type="date" 
                    required
                    value={dateStr}
                    onChange={e => setDateStr(e.target.value)}
                    style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.2)', fontFamily: 'inherit' }}
                  />
                </label>

                <label style={{ display: 'block' }}>
                  <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#594a42', marginBottom: '0.4rem' }}>
                    Quantas pessoas? <span style={{ fontWeight: 400, color: '#7a6a61' }}>(opcional)</span>
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={groupSize}
                    onChange={e => setGroupSize(e.target.value)}
                    placeholder={interestType === 'retiro' ? 'Ex: 8' : 'Ex: 2'}
                    style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.2)', fontFamily: 'inherit' }}
                  />
                </label>

                <label style={{ display: 'block' }}>
                  <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#594a42', marginBottom: '0.4rem' }}>
                    Conte o que você imagina <span style={{ fontWeight: 400, color: '#7a6a61' }}>(opcional)</span>
                  </span>
                  <textarea
                    rows={4}
                    maxLength={1500}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder={interestType === 'retiro'
                      ? 'Ex: um grupo de amigas, 3 noites, queremos yoga de manhã e aula de confeitaria. Alguém é celíaca…'
                      : 'Ex: nunca fiz confeitaria vegana, quero aprender receitas sem glúten para a minha família…'}
                    style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.2)', fontFamily: 'inherit', resize: 'vertical' }}
                  />
                  <span style={{ display: 'block', fontSize: '0.78rem', color: '#7a6a61', marginTop: '0.3rem' }}>
                    Quanto mais a gente souber, melhor conseguimos preparar a sua experiência.
                  </span>
                </label>

                <div style={{ background: 'white', padding: '1.25rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}>
                  <span style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: '#3c2a21', marginBottom: '0.75rem' }}>
                    Áreas de Foco (Opcional)
                  </span>
                  <p style={{ fontSize: '0.85rem', color: '#7a6a61', marginBottom: '1rem' }}>
                    Selecione os temas que você tem mais interesse para que possamos personalizar sua experiência.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {availableFocusAreas.map(area => (
                      <label 
                        key={area}
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: '0.5rem', 
                          padding: '0.5rem 0.8rem', 
                          borderRadius: '999px', 
                          border: focusAreas.includes(area) ? '1px solid #d4af37' : '1px solid rgba(0,0,0,0.15)',
                          background: focusAreas.includes(area) ? 'rgba(212,175,55,0.1)' : 'white',
                          color: focusAreas.includes(area) ? '#3c2a21' : '#594a42',
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={focusAreas.includes(area)} 
                          onChange={() => toggleFocusArea(area)} 
                          style={{ display: 'none' }}
                        />
                        {area}
                      </label>
                    ))}
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={status === 'submitting'}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '1rem', marginTop: '0.5rem', opacity: status === 'submitting' ? 0.7 : 1 }}
                >
                  {status === 'submitting' ? 'Processando...' : 'Fazer Reserva'}
                </button>
                <p style={{ fontSize: '0.8rem', color: '#7a6a61', textAlign: 'center', marginTop: '0.5rem' }}>
                  Suas informações estão seguras conosco e serão usadas apenas para organizar seu evento.
                </p>
              </form>
            )}

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

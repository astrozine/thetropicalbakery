'use client';

import React, { useState } from 'react';
import { brandAlert } from '@/lib/brandDialog';

export default function EventLeadCapture() {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    date: '',
    guests: '',
    eventType: 'Casamento'
  });

  const handleStart = () => {
    setStep(1);
  };

  // Branded popup, then land on the empty field.
  const askFor = (message: string, fieldId: string) => {
    brandAlert(message, { title: 'Falta um detalhe', icon: '✦', confirmLabel: 'Entendi' }).then(() => {
      document.getElementById(fieldId)?.focus();
    });
  };

  const nextStep = () => {
    if (step === 1 && (!formData.name.trim() || !formData.whatsapp.trim())) {
      const missing = !formData.name.trim() ? 'elc-name' : 'elc-whatsapp';
      askFor(missing === 'elc-name' ? 'Preencha o campo «Nome Completo» para continuar.' : 'Preencha o campo «WhatsApp» para continuar.', missing);
      return;
    }
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.guests) {
      const missing = !formData.date ? 'elc-date' : 'elc-guests';
      askFor(missing === 'elc-date' ? 'Preencha o campo «Data» para continuar.' : 'Preencha o campo «Convidados» para continuar.', missing);
      return;
    }
    
    // Save to local storage or just keep in memory for now.
    // Close accordion
    setStep(0);
    
    // Smooth scroll to portfolio
    const portfolioSection = document.getElementById('portfolio');
    if (portfolioSection) {
      portfolioSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', background: 'rgba(253, 250, 243, 0.95)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', backdropFilter: 'blur(10px)', color: '#3c2a21', position: 'relative', zIndex: 11 }}>
      
      {step === 0 && (
        <div style={{ padding: '1.5rem', textAlign: 'center' }}>
          <button 
            onClick={handleStart}
            className="btn btn-secondary" 
            style={{ width: '100%', padding: '1rem', background: '#d4af37', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}
          >
            Iniciar Orçamento
          </button>
        </div>
      )}

      {step === 1 && (
        <div style={{ padding: '2rem', textAlign: 'left', animation: 'fadeIn 0.3s ease-out' }}>
          <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', marginBottom: '1.5rem', textAlign: 'center' }}>
            Passo 1: Seus Dados
          </h3>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Nome Completo</label>
            <input 
              type="text" 
              id="elc-name"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', background: 'white', fontSize: '1rem', color: '#3c2a21' }}
              placeholder="Ex: Maria Silva"
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>WhatsApp</label>
            <input 
              type="tel" 
              id="elc-whatsapp"
              value={formData.whatsapp}
              onChange={e => setFormData({...formData, whatsapp: e.target.value})}
              style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', background: 'white', fontSize: '1rem', color: '#3c2a21' }}
              placeholder="(11) 99999-9999"
            />
          </div>
          <button 
            onClick={nextStep}
            className="btn btn-primary" 
            style={{ width: '100%', padding: '1rem', borderRadius: '8px', fontWeight: 'bold' }}
          >
            Continuar →
          </button>
        </div>
      )}

      {step === 2 && (
        <div style={{ padding: '2rem', textAlign: 'left', animation: 'fadeIn 0.3s ease-out' }}>
          <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', marginBottom: '1.5rem', textAlign: 'center' }}>
            Passo 2: Detalhes do Evento
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Tipo de Evento</label>
              <select 
                value={formData.eventType}
                onChange={e => setFormData({...formData, eventType: e.target.value})}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', background: 'white', fontSize: '1rem', color: '#3c2a21' }}
              >
                <option value="Casamento">Casamento</option>
                <option value="Aniversário">Aniversário</option>
                <option value="Retiro">Retiro</option>
                <option value="Corporativo">Evento Corporativo</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Data</label>
                <input 
                  type="date" 
                  id="elc-date"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', background: 'white', fontSize: '1rem', color: '#3c2a21' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Convidados</label>
                <input 
                  type="number" 
                  id="elc-guests"
                  value={formData.guests}
                  onChange={e => setFormData({...formData, guests: e.target.value})}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', background: 'white', fontSize: '1rem', color: '#3c2a21' }}
                  placeholder="Ex: 50"
                />
              </div>
            </div>
            <button 
              type="submit"
              className="btn btn-primary" 
              style={{ width: '100%', padding: '1rem', borderRadius: '8px', fontWeight: 'bold' }}
            >
              Ver Opções de Doces
            </button>
          </form>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}

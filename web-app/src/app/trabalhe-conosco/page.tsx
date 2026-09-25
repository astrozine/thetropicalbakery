'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import StripedBackground from '@/components/StripedBackground';
import ScrollReveal from '@/components/ScrollReveal';
import PayEstimator from '@/components/PayEstimator';

const ROLES = [
  {
    id: 'confeitaria',
    icon: '🍰',
    title: 'Confeitaria & Produção',
    summary: 'Fazer os doces com a Dolly, na cozinha em Itamambuca.',
    looking: [
      'Cuidado com detalhe — nossos doces são pequenos e precisos',
      'Higiene impecável, sem exceção',
      'Vontade de aprender confeitaria vegana, sem glúten e sem açúcar refinado',
      'Experiência é bem-vinda, mas atitude conta mais',
    ],
    when: 'Quintas e sextas (produção), sábados (finalização)',
  },
  {
    id: 'entrega',
    icon: '🛵',
    title: 'Entregas',
    summary: 'Levar as caixas até a casa dos assinantes, aos sábados.',
    looking: [
      'Moto ou carro próprio, com documentação em ordem',
      'Conhecer bem as estradas de Itamambuca, Félix, Prumirim e Ubatuba',
      'Dirigir com calma — caixas de doces não perdoam freada brusca',
      'Educação e presença: você é a última pessoa que o cliente vê',
    ],
    when: 'Sábados, das 9h às 14h',
  },
  {
    id: 'compras',
    icon: '🥥',
    title: 'Compras & Seleção de Ingredientes',
    summary: 'Escolher a matéria-prima. É a função que mais define a qualidade da caixa.',
    looking: [
      'Saber escolher fruta no ponto — e reconhecer a que já passou',
      'Diferenciar qualidade de castanhas, cocos, cacau e farinhas sem glúten',
      'Ler rótulo com atenção: um ingrediente errado inutiliza um lote inteiro',
      'Negociar com produtores e feirantes de Ubatuba',
      'Ser confiável com dinheiro e com prazo',
    ],
    when: 'Quartas e quintas, pela manhã',
  },
];

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)',
  marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.08em',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.85rem 1rem', border: '1px solid rgba(212,175,55,0.5)',
  borderRadius: '8px', background: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-body)',
  fontSize: '1rem', outline: 'none',
};

export default function CareersPage() {
  const [form, setForm] = useState({
    role: '',
    full_name: '',
    whatsapp: '',
    email: '',
    city: '',
    experience: '',
    availability: '',
    has_transport: false,
    motivation: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const pickRole = (id: string) => {
    setForm(f => ({ ...f, role: id }));
    document.getElementById('candidatar')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.role) {
      setError('Escolha a vaga que combina com você.');
      return;
    }
    setSubmitting(true);
    setError('');

    const { error: insertError } = await supabase.from('job_applications').insert([form]);

    setSubmitting(false);
    if (insertError) {
      console.error('Application error:', insertError);
      setError('Não conseguimos enviar sua candidatura. Tente novamente ou fale com a gente no WhatsApp.');
      return;
    }
    if (form.email) {
      await supabase.rpc('email_contact_upsert', {
        p_email: form.email, p_full_name: form.full_name, p_tags: ['candidato'], p_source: 'candidatura',
      });
    }
    setDone(true);
  };

  return (
    <main style={{ background: 'var(--color-background)' }}>

      <StripedBackground tone="dark" bandHeight={92} image="/textures/copacabana-baker.webp" imagePosition="75% 30%" style={{ paddingTop: 'clamp(7rem, 12vw, 9rem)', paddingBottom: 'clamp(3.5rem, 7vw, 5.5rem)' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 1.5rem', textAlign: 'center' }}>
          <img src="/logo-gold.webp" alt="" style={{ height: 'clamp(64px, 10vw, 88px)', margin: '0 auto 1.75rem', display: 'block' }} />
          <span style={{
            display: 'inline-block', border: '1px solid rgba(212,175,55,0.6)', color: '#d4af37',
            padding: '0.4rem 1.1rem', borderRadius: '30px', fontSize: '0.72rem',
            textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: '1.5rem',
          }}>
            Ubatuba · Perequê-Açu · Taquaral · Praia do Prumirim
          </span>
          <h1 style={{
            fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.2rem, 6.5vw, 4rem)',
            lineHeight: 1.1, color: '#fdfaf3', marginBottom: '1.25rem',
          }}>
            Trabalhe com a gente<br />aqui do seu lado da praia
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2.3vw, 1.15rem)', color: 'rgba(253,250,243,0.85)', lineHeight: 1.85 }}>
            Somos uma confeitaria pequena em Itamambuca, crescendo devagar e com cuidado.
            Estamos montando a equipe que vai fazer, escolher e entregar as caixas de cada semana —
            gente da nossa região, que conhece as estradas e as praias tão bem quanto a gente.
          </p>
        </div>
      </StripedBackground>

      {/* Roles */}
      <section style={{ padding: 'clamp(4rem, 8vw, 6rem) 1.5rem' }}>
        <div style={{ maxWidth: '1150px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
            color: 'var(--color-primary)', textAlign: 'center', marginBottom: '3rem',
          }}>
            Vagas abertas
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.75rem' }}>
            {ROLES.map(role => (
              <ScrollReveal key={role.id}>
                <div style={{
                  background: '#fff', border: '1px solid #e8e1d7', borderRadius: '20px',
                  padding: '2rem 1.75rem', height: '100%', display: 'flex', flexDirection: 'column',
                  boxShadow: '0 8px 24px rgba(60,42,33,0.06)',
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{role.icon}</div>
                  <h3 style={{
                    fontFamily: 'var(--font-heading)', fontSize: '1.5rem',
                    color: 'var(--color-primary)', marginBottom: '0.6rem',
                  }}>
                    {role.title}
                  </h3>
                  <p style={{ color: '#7a6a61', lineHeight: 1.7, marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                    {role.summary}
                  </p>

                  <p style={{ ...labelStyle, marginBottom: '0.75rem' }}>O que buscamos</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', flexGrow: 1 }}>
                    {role.looking.map(item => (
                      <li key={item} style={{
                        display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
                        color: '#594a42', lineHeight: 1.7, marginBottom: '0.65rem', fontSize: '0.9rem',
                      }}>
                        <span style={{ color: '#d4af37', flexShrink: 0 }}>✦</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <p style={{ fontSize: '0.82rem', color: '#7a6a61', marginBottom: '1.5rem' }}>
                    <strong style={{ color: 'var(--color-primary)' }}>Quando:</strong> {role.when}
                  </p>

                  <button
                    onClick={() => pickRole(role.id)}
                    style={{
                      width: '100%', padding: '0.9rem', borderRadius: '10px', cursor: 'pointer',
                      border: 'none', background: 'var(--color-primary)', color: '#fdfaf3',
                      fontWeight: 700, fontSize: '0.95rem',
                    }}
                  >
                    Quero esta vaga
                  </button>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pay estimator */}
      <section style={{ padding: '0 1.5rem clamp(2rem, 5vw, 3rem)' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <PayEstimator />
        </div>
      </section>

      {/* Application form */}
      <StripedBackground tone="light" bandHeight={72} style={{ padding: 'clamp(4rem, 8vw, 6rem) 1.5rem' }}>
        <div id="candidatar" style={{ maxWidth: '720px', margin: '0 auto' }}>
          {done ? (
            <div style={{
              background: '#fff', border: '1px solid rgba(212,175,55,0.5)', borderRadius: '20px',
              padding: 'clamp(2rem, 5vw, 3rem)', textAlign: 'center',
            }}>
              <img src="/logo-gold.webp" alt="" style={{ height: '68px', margin: '0 auto 1.5rem', display: 'block' }} />
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.9rem', color: 'var(--color-primary)', marginBottom: '1rem' }}>
                Candidatura enviada
              </h3>
              <p style={{ color: '#594a42', lineHeight: 1.8 }}>
                Obrigado, {form.full_name.split(' ')[0]}. Vamos ler com atenção e, se fizer sentido,
                chamamos você no WhatsApp para conversar.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{
              background: '#fff', border: '1px solid #e8e1d7', borderRadius: '20px',
              padding: 'clamp(1.5rem, 4vw, 2.5rem)',
            }}>
              <h2 style={{
                fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
                color: 'var(--color-primary)', marginBottom: '0.5rem', textAlign: 'center',
              }}>
                Candidatar-se
              </h2>
              <p style={{ color: '#7a6a61', fontSize: '0.9rem', textAlign: 'center', marginBottom: '2rem' }}>
                Não precisa de currículo formal. Conte quem você é.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Qual vaga?</label>
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    {[...ROLES, { id: 'outro', title: 'Outro' }].map(r => {
                      const on = form.role === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setForm({ ...form, role: r.id })}
                          style={{
                            padding: '0.55rem 1.1rem', borderRadius: '20px', border: '1px solid',
                            borderColor: on ? '#d4af37' : '#e8e1d7',
                            background: on ? 'rgba(212,175,55,0.15)' : 'transparent',
                            color: on ? '#3c2a21' : '#7a6a61', fontWeight: on ? 700 : 500,
                            fontSize: '0.88rem', cursor: 'pointer',
                          }}
                        >
                          {on ? '✓ ' : ''}{r.title}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: '2 1 220px' }}>
                    <label style={labelStyle}>Nome completo</label>
                    <input required type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ flex: '1 1 170px' }}>
                    <label style={labelStyle}>WhatsApp</label>
                    <input required type="tel" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="(12) 99123-4567" style={inputStyle} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={labelStyle}>E-mail <span style={{ textTransform: 'none', fontWeight: 400, color: '#a89a90' }}>(opcional)</span></label>
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={labelStyle}>Onde você mora</label>
                    <input required type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Ex: Itamambuca, Ubatuba" style={inputStyle} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Sua experiência</label>
                  <textarea
                    value={form.experience}
                    onChange={e => setForm({ ...form, experience: e.target.value })}
                    rows={3}
                    placeholder="O que você já fez que tem a ver com essa vaga? Se nunca fez nada parecido, conta o que você faz bem."
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Disponibilidade</label>
                  <input
                    type="text"
                    value={form.availability}
                    onChange={e => setForm({ ...form, availability: e.target.value })}
                    placeholder="Ex: quintas, sextas e sábados de manhã"
                    style={inputStyle}
                  />
                </div>

                <label style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer',
                  color: '#594a42', fontSize: '0.95rem',
                }}>
                  <input
                    type="checkbox"
                    checked={form.has_transport}
                    onChange={e => setForm({ ...form, has_transport: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#d4af37' }}
                  />
                  Tenho transporte próprio (moto ou carro)
                </label>

                <div>
                  <label style={labelStyle}>Por que você quer trabalhar aqui?</label>
                  <textarea
                    value={form.motivation}
                    onChange={e => setForm({ ...form, motivation: e.target.value })}
                    rows={3}
                    placeholder="Fale com sinceridade — é isso que a gente lê primeiro."
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
              </div>

              {error && <p style={{ color: '#c0392b', fontSize: '0.9rem', marginTop: '1rem' }}>{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ width: '100%', padding: '1.15rem', marginTop: '1.75rem', borderRadius: '10px', fontSize: '1.02rem' }}
              >
                {submitting ? 'Enviando...' : 'Enviar candidatura'}
              </button>
            </form>
          )}
        </div>
      </StripedBackground>
      {/* Already on the team */}
      <section style={{ padding: 'clamp(2.5rem, 6vw, 4rem) 1.5rem', background: '#fdf7ee' }}>
        <div style={{ maxWidth: '620px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: '#594a42', lineHeight: 1.8, marginBottom: '1.25rem' }}>
            <strong>Já trabalha com a gente?</strong> Sua escala, suas horas e o que você tem a receber ficam na área da equipe.
          </p>
          <Link href="/equipe" className="btn btn-secondary" style={{ padding: '0.9rem 1.75rem', display: 'inline-block' }}>
            Entrar na Área da Equipe
          </Link>
        </div>
      </section>


    </main>
  );
}

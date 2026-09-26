'use client';

import { InspirationTeaser } from '@/components/InspirationSection';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import StripedBackground from '@/components/StripedBackground';
import HighlightsHero from '@/components/HighlightsHero';
import DeliveryCalendar from '@/components/DeliveryCalendar';
import SubscriptionSignup from '@/components/SubscriptionSignup';
import MobileBuyBar from '@/components/MobileBuyBar';
import ScrollReveal from '@/components/ScrollReveal';
import { SubscriptionPlan, monthlySavings } from '@/lib/subscriptions';
import { formatBRL } from '@/lib/deliveryZones';
import WhatsAppGate from '@/components/WhatsAppGate';
import { OriginSeal } from '@/components/BelgiumBrazil';

/** The single-box price we compare plans against. */
const BASE_BOX_PRICE = 99;

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Você escolhe seu ritmo',
    body: 'Mensal, trimestral ou anual. Em todos, uma Caixa de Degustação chega toda semana.',
  },
  {
    step: '02',
    title: 'A Dolly cria o menu da semana',
    body: 'Nada de catálogo fixo. Cada caixa é uma criação nova, feita com o que está no melhor momento.',
  },
  {
    step: '03',
    title: 'Sua caixa chega no dia de entrega',
    body: 'Feita no dia, entregue fresca em Itamambuca e região. Os dias de entrega estão no calendário aí embaixo — você só abre e se serve.',
  },
];

const INSIDE_THE_BOX = [
  'De 5 a 7 doces autorais, diferentes a cada semana',
  'Sempre veganos, sem glúten e sem açúcar refinado',
  'Um cartão escrito à mão contando o que é cada doce',
  'Ingredientes locais de Ubatuba quando a estação permite',
  'Embalagem pensada para presentear — ou guardar só para você',
];

const WHY_SUBSCRIBE = [
  {
    icon: '⏸',
    title: 'Pause quando viajar',
    body: 'Vai passar duas semanas fora? Pausa sem perder a vaga e sem pagar pelo que não recebeu.',
  },
  {
    icon: '🔒',
    title: 'Preço travado',
    body: 'No plano anual, o valor que você assina hoje é seu para sempre — mesmo quando os nossos subirem.',
  },
  {
    icon: '✦',
    title: 'Prioridade no que é raro',
    body: 'Edições limitadas e lotes pequenos vão primeiro para assinantes. Sempre.',
  },
  {
    icon: '🎁',
    title: 'Indique e ganhe',
    body: 'Cada amigo que assina rende uma semana de caixa por nossa conta para você.',
  },
];

const FAQ = [
  {
    q: 'Como funciona o pagamento?',
    a: 'Você reserva sua vaga aqui no site sem pagar nada. A Dolly te chama no WhatsApp para confirmar tudo e combinar o Pix — normalmente no mesmo dia. Depois é uma cobrança por ciclo, sempre avisada antes.',
  },
  {
    q: 'Posso cancelar?',
    a: 'No plano mensal, quando quiser. Nos planos trimestral e anual existe um compromisso de período, porque é o que nos permite travar um preço melhor para você — mas você pode pausar até 2 semanas por ciclo sem custo.',
  },
  {
    q: 'E se eu não gostar de algum doce?',
    a: 'Conta pra gente. A Dolly anota suas preferências e alergias no seu perfil, e a próxima caixa já vem ajustada. É uma assinatura de pessoas, não de algoritmo.',
  },
  {
    q: 'Vocês entregam onde?',
    a: 'Itamambuca (entrega inclusa), Praia do Félix, Prumirim, Praia Vermelha e Perequê-Açú, e também Ubatuba centro, Praia Grande, Puruba e Ubatumirim. Paraty e Picinguaba só para eventos e atacado.',
  },
  {
    q: 'Posso mandar como presente?',
    a: 'Sim — e é um dos presentes que as pessoas mais lembram. Reserve no seu nome e conte no campo de observações para quem vai. Assinantes anuais ganham duas caixas-presente por ano.',
  },
];

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (!error && data) {
        setPlans(data as SubscriptionPlan[]);
        // Default to the middle option — the one most people should pick.
        const recommended = data.find((p: SubscriptionPlan) => p.badge) ?? data[0];
        if (recommended) setSelectedPlanId(recommended.id);
      }
      setLoading(false);
    };
    load();
  }, []);

  const scrollToSignup = () => {
    document.getElementById('reservar')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main style={{ background: 'var(--color-background)' }}>

      {/* ---------------------------------------------------------------- HERO */}
      <StripedBackground tone="dark" bandHeight={96} image="/textures/copacabana-baker.webp" imagePosition="35% 60%" style={{ paddingTop: 'clamp(4.5rem, 12vw, 10rem)', paddingBottom: 'clamp(2.25rem, 8vw, 7rem)' }}>
        <HighlightsHero>
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 1.5rem', textAlign: 'center' }}>
          <img src="/logo-gold.webp" alt="" style={{ height: 'clamp(72px, 12vw, 104px)', margin: '0 auto 2rem', display: 'block' }} />

          <span style={{
            display: 'inline-block', border: '1px solid rgba(212,175,55,0.6)', color: '#d4af37',
            padding: '0.4rem 1.1rem', borderRadius: '30px', fontSize: '0.8rem',
            textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: '1.75rem',
          }}>
            Assinatura Semanal
          </span>

          <h1 style={{
            fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.95rem, 7vw, 4.6rem)',
            lineHeight: 1.05, color: '#fdfaf3', marginBottom: '1.5rem',
          }}>
            Caixa de Degustação,<br />
            <span style={{ color: '#d4af37' }}>toda semana</span>
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2.4vw, 1.2rem)', color: 'rgba(253,250,243,0.86)',
            lineHeight: 1.85, maxWidth: '620px', margin: '0 auto 2.5rem',
          }}>
            Uma criação nova a cada semana, feita à mão pela Dolly em Itamambuca.
            Vegana, sem glúten, sem açúcar refinado — e sem nunca repetir a semana anterior.
          </p>

          <OriginSeal tone="dark" style={{ marginBottom: '2.25rem' }} />
          <br />

          <button onClick={scrollToSignup} className="btn btn-secondary" style={{
            background: '#d4af37', color: '#3c2a21', border: 'none', padding: '1.1rem 2.5rem',
            borderRadius: '10px', fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer',
            letterSpacing: '0.02em',
          }}>
            Ver os planos
          </button>

          <p style={{ fontSize: '0.8rem', color: 'rgba(253,250,243,0.6)', marginTop: '1.5rem' }}>
            Vagas limitadas — tudo é feito em uma cozinha, por uma pessoa.
          </p>
        </div>
        </HighlightsHero>
      </StripedBackground>

      {/* -------------------------------------------------------- HOW IT WORKS */}
      <section style={{ padding: 'clamp(2.25rem, 9vw, 7rem) 1.5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <ScrollReveal>
            <h2 style={{
              fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.9rem, 5vw, 3rem)',
              color: 'var(--color-primary)', textAlign: 'center', marginBottom: '3.5rem',
            }}>
              Como funciona
            </h2>
          </ScrollReveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2.5rem' }}>
            {HOW_IT_WORKS.map(s => (
              <ScrollReveal key={s.step}>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-heading)', fontSize: '2.6rem', color: '#d4af37',
                    lineHeight: 1, marginBottom: '1rem',
                  }}>
                    {s.step}
                  </div>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--color-primary)', fontWeight: 700, marginBottom: '0.6rem' }}>
                    {s.title}
                  </h3>
                  <p style={{ color: '#594a42', lineHeight: 1.8 }}>{s.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- DELIVERY CALENDAR */}
      <section style={{ padding: '0 1.5rem clamp(2.25rem, 9vw, 7rem)' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <ScrollReveal>
            <h2 style={{
              fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.7rem, 4.5vw, 2.4rem)',
              color: 'var(--color-primary)', textAlign: 'center', marginBottom: '0.6rem',
            }}>
              O melhor dia da semana 🎉
            </h2>
            <p style={{ textAlign: 'center', color: '#594a42', lineHeight: 1.8, marginBottom: '2rem' }}>
              Cada dia laranja é um dia de caixa. É quando a sua chega, fresquinha, na sua porta.
            </p>
            <DeliveryCalendar title="Calendário de entregas" />
          </ScrollReveal>
        </div>
      </section>

      {/* ------------------------------------------------------ INSIDE THE BOX */}
      <StripedBackground tone="light" bandHeight={72} style={{ padding: 'clamp(2.25rem, 9vw, 7rem) 1.5rem' }}>
        <div style={{
          maxWidth: '1000px', margin: '0 auto', display: 'flex', gap: 'clamp(2rem, 5vw, 4rem)',
          alignItems: 'center', flexWrap: 'wrap',
        }}>
          <div style={{ flex: '1 1 300px' }}>
            <img
              src="/box1.jpg"
              alt="Caixa de Degustação"
              style={{ width: '100%', borderRadius: '20px', boxShadow: '0 24px 50px rgba(60,42,33,0.22)' }}
            />
          </div>
          <div style={{ flex: '1 1 320px' }}>
            <h2 style={{
              fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem, 4.5vw, 2.6rem)',
              color: 'var(--color-primary)', marginBottom: '1.75rem',
            }}>
              O que vem na caixa
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {INSIDE_THE_BOX.map(item => (
                <li key={item} style={{
                  display: 'flex', gap: '0.85rem', alignItems: 'flex-start',
                  color: '#594a42', lineHeight: 1.75, marginBottom: '1rem',
                }}>
                  <span style={{ color: '#d4af37', fontWeight: 700, flexShrink: 0 }}>✦</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </StripedBackground>

      {/* ---------------------------------------------------------------- PLANS */}
      <section id="planos" style={{ padding: 'clamp(2.25rem, 9vw, 7rem) 0' }}>
        <div style={{ maxWidth: '1150px', margin: '0 auto', padding: '0 1.5rem' }}>
          <h2 style={{
            fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.9rem, 5vw, 3rem)',
            color: 'var(--color-primary)', textAlign: 'center', marginBottom: '0.75rem',
          }}>
            Escolha seu ritmo
          </h2>
          <p style={{ textAlign: 'center', color: '#7a6a61', marginBottom: '3.5rem', fontSize: '1rem' }}>
            Todos os planos entregam uma caixa por semana. Quanto maior o compromisso, menor o valor por caixa.
          </p>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#7a6a61' }}>Carregando planos...</p>
        ) : plans.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#7a6a61', padding: '0 1.5rem' }}>
            Os planos estarão disponíveis em instantes. Fale com a gente no{' '}
            <WhatsAppGate href="https://wa.me/5511932119196" topic="Assinatura: planos" tags={['assinatura']} style={{ color: 'var(--color-secondary)', fontWeight: 600, textDecoration: 'underline' }}>WhatsApp</WhatsAppGate>.
          </p>
        ) : (
          <div className="tb-plan-rail-wrap" style={{ position: 'relative' }}>
            {/* Right-edge fade gradient — the most friction-free swipe cue.
                On wide screens the cards sit in a normal row; this overlay is
                invisible when no overflow exists. */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute', right: 0, top: 0, bottom: 0, width: '5rem',
                background: 'linear-gradient(to left, var(--color-background) 10%, transparent)',
                zIndex: 2, pointerEvents: 'none',
              }}
            />
            <div
              className="tb-plan-rail"
              style={{
                display: 'flex',
                gap: '1.75rem',
                overflowX: 'auto',
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                padding: '1.5rem 1.5rem 2rem',
                paddingRight: 'calc(1.5rem + 2rem)',
              }}
            >
              {plans.map(plan => {
                const featured = Boolean(plan.badge);
                const savings = monthlySavings(plan, BASE_BOX_PRICE, 1);
                const isSelected = plan.id === selectedPlanId;

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    style={{
                      background: featured ? 'var(--color-primary)' : '#fff',
                      color: featured ? '#fdfaf3' : 'var(--color-text)',
                      border: '2px solid',
                      borderColor: isSelected ? '#d4af37' : featured ? 'var(--color-primary)' : '#e8e1d7',
                      borderRadius: '20px',
                      padding: '2rem 1.5rem',
                      paddingTop: plan.badge ? '3.1rem' : '2rem',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      minWidth: 0,
                      transform: featured ? 'scale(1.02)' : 'none',
                      boxShadow: isSelected ? '0 18px 40px rgba(212,175,55,0.28)' : '0 8px 24px rgba(60,42,33,0.07)',
                      transition: 'box-shadow 0.25s, border-color 0.25s',
                      scrollSnapAlign: 'start',
                      flex: '0 0 min(300px, 82vw)',
                    }}
                  >
                    {plan.badge && (
                      <span style={{
                        // A tab hanging from the top edge: inside the card, so overflow:hidden never clips it.
                        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                        background: '#d4af37', color: '#3c2a21', padding: '0.35rem 1.1rem 0.4rem',
                        borderRadius: '0 0 12px 12px', fontSize: '0.72rem', fontWeight: 800,
                        textTransform: 'uppercase', letterSpacing: '0.12em', whiteSpace: 'nowrap',
                      }}>
                        {plan.badge}
                      </span>
                    )}

                    <h3 style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 'clamp(1.4rem, 5vw, 1.9rem)',
                      color: featured ? '#d4af37' : 'var(--color-primary)',
                      marginBottom: '0.4rem',
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere',
                    }}>
                      {plan.name}
                    </h3>
                    <p style={{
                      fontSize: '0.88rem', lineHeight: 1.6, minHeight: '2.6rem',
                      color: featured ? 'rgba(253,250,243,0.75)' : '#7a6a61', marginBottom: '1.5rem',
                    }}>
                      {plan.tagline}
                    </p>

                    {/* Menu-style price: small "R$", big whole number, small cents. The full
                        "R$ 396,00" in the heading font was wider than the card and got clipped. */}
                    <div style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.15rem', fontFamily: 'var(--font-heading)', lineHeight: 1 }}>
                      <span style={{ fontSize: '1rem', marginTop: '0.35rem', opacity: 0.8 }}>R$</span>
                      <span style={{ fontSize: 'clamp(2.4rem, 7vw, 3rem)' }}>
                        {Math.floor(plan.monthly_price).toLocaleString('pt-BR')}
                      </span>
                      <span style={{ fontSize: '1rem', marginTop: '0.35rem' }}>
                        ,{String(Math.round((plan.monthly_price % 1) * 100)).padStart(2, '0')}
                      </span>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', opacity: 0.7, alignSelf: 'flex-end', marginLeft: '0.3rem' }}>/mês</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', opacity: 0.75, marginBottom: savings > 0 ? '0.6rem' : '1.75rem' }}>
                      {formatBRL(plan.price_per_box)} por caixa
                      {plan.commitment_months > 1 && ` · ${plan.commitment_months} meses`}
                    </p>
                    {savings > 0 && (
                      <p style={{
                        display: 'inline-block', background: featured ? 'rgba(212,175,55,0.2)' : 'rgba(46,68,50,0.09)',
                        color: featured ? '#d4af37' : '#2e4432', padding: '0.3rem 0.8rem', borderRadius: '20px',
                        fontSize: '0.78rem', fontWeight: 700, marginBottom: '1.75rem',
                      }}>
                        Economize {formatBRL(savings)}/mês
                      </p>
                    )}

                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.75rem 0' }}>
                      {plan.perks.map(perk => (
                        <li key={perk} style={{
                          display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
                          fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '0.7rem',
                          color: featured ? 'rgba(253,250,243,0.9)' : '#594a42',
                        }}>
                          <span style={{ color: '#d4af37', flexShrink: 0 }}>✓</span>
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setSelectedPlanId(plan.id); scrollToSignup(); }}
                      style={{
                        width: '100%', padding: '0.95rem', borderRadius: '10px', cursor: 'pointer',
                        fontWeight: 700, fontSize: '0.95rem', border: 'none',
                        // Filled foil with dark cocoa text on every card — an
                        // outlined variant here was too faint to read.
                        background: '#d4af37', color: '#3c2a21',
                      }}
                    >
                      Escolher {plan.name}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------ WHY SUBSCRIBE */}
      <StripedBackground tone="dark" bandHeight={80} style={{ padding: 'clamp(2.25rem, 9vw, 7rem) 1.5rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.9rem, 5vw, 3rem)',
            color: '#fdfaf3', textAlign: 'center', marginBottom: '3.5rem',
          }}>
            Por que assinar em vez de pedir
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '2.5rem' }}>
            {WHY_SUBSCRIBE.map(item => (
              <div key={item.title}>
                <div style={{ fontSize: '1.8rem', color: '#d4af37', marginBottom: '0.9rem' }}>{item.icon}</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fdfaf3', marginBottom: '0.6rem' }}>
                  {item.title}
                </h3>
                <p style={{ color: 'rgba(253,250,243,0.78)', lineHeight: 1.8, fontSize: '0.92rem' }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </StripedBackground>

      {/* ------------------------------------------------------------ SIGNUP */}
      <section id="reservar" style={{ padding: 'clamp(2.25rem, 9vw, 7rem) 1.5rem' }}>
        {!loading && plans.length > 0 && (
          <SubscriptionSignup
            plans={plans}
            selectedPlanId={selectedPlanId || plans[0].id}
            onSelectPlan={setSelectedPlanId}
          />
        )}
      </section>

      <section style={{ padding: '0 1.5rem clamp(2rem, 6vw, 4.5rem)' }}>
        <InspirationTeaser />
      </section>

      {/* --------------------------------------------------------------- FAQ */}
      <section style={{ padding: '0 1.5rem clamp(2.25rem, 9vw, 7rem)' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.7rem, 4.5vw, 2.5rem)',
            color: 'var(--color-primary)', textAlign: 'center', marginBottom: '2.5rem',
          }}>
            Perguntas frequentes
          </h2>
          {FAQ.map((item, i) => (
            <div key={item.q} style={{ borderBottom: '1px solid #e8e1d7' }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  width: '100%', textAlign: 'left', background: 'none', border: 'none',
                  padding: '1.3rem 0', cursor: 'pointer', display: 'flex',
                  justifyContent: 'space-between', gap: '1rem', alignItems: 'center',
                  fontSize: '1.02rem', fontWeight: 600, color: 'var(--color-primary)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {item.q}
                <span style={{ color: '#d4af37', flexShrink: 0, fontSize: '1.2rem' }}>
                  {openFaq === i ? '−' : '+'}
                </span>
              </button>
              {openFaq === i && (
                <p style={{ color: '#594a42', lineHeight: 1.85, paddingBottom: '1.4rem', margin: 0 }}>
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------- CLOSING CTA
          Repeated here on purpose: by this point someone has read the plans and
          had their objections answered, and shouldn't have to scroll back up. */}
      <StripedBackground tone="dark" bandHeight={84} style={{ padding: 'clamp(2.25rem, 9vw, 6.5rem) 1.5rem' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
            color: '#fdfaf3', marginBottom: '1.25rem', lineHeight: 1.15,
          }}>
            Suas quartas-feiras pedem<br />algo melhor
          </h2>
          <p style={{
            color: 'rgba(253,250,243,0.85)', lineHeight: 1.85, marginBottom: '2.25rem',
            fontSize: 'clamp(0.95rem, 2.2vw, 1.08rem)',
          }}>
            Reserve sua vaga sem pagar nada agora. A Dolly confirma tudo com você no WhatsApp.
          </p>
          <button
            onClick={scrollToSignup}
            style={{
              background: '#d4af37', color: '#3c2a21', border: 'none',
              padding: '1.15rem 2.75rem', borderRadius: '10px', fontWeight: 700,
              fontSize: '1.05rem', cursor: 'pointer',
            }}
          >
            Reservar minha vaga
          </button>
          <p style={{ fontSize: '0.8rem', color: 'rgba(253,250,243,0.6)', marginTop: '1.5rem' }}>
            Ou fale direto com a gente no{' '}
            <WhatsAppGate href="https://wa.me/5511932119196" topic="Assinatura: dúvidas" tags={['assinatura']} style={{ color: '#d4af37', fontWeight: 600, textDecoration: 'underline' }}>
              WhatsApp
            </WhatsAppGate>
          </p>
        </div>
      </StripedBackground>

          {/* Phones only: the plans were five screens down, so the price rides along instead. */}
      {plans.length > 0 && (
        <MobileBuyBar
          kicker="Assinatura semanal"
          price={`a partir de ${formatBRL(Math.min(...plans.map(p => p.price_per_box)))}`}
          note="por caixa"
          label="Ver planos"
          targetId="#planos"
        />
      )}

</main>
  );
}

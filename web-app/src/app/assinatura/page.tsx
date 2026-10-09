'use client';

import { InspirationTeaser } from '@/components/InspirationSection';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import StripedBackground from '@/components/StripedBackground';
import HighlightsHero from '@/components/HighlightsHero';
import DeliveryCalendar from '@/components/DeliveryCalendar';
import TreatFlank from '@/components/TreatFlank';
import SubscriptionSignup from '@/components/SubscriptionSignup';
import MobileBuyBar from '@/components/MobileBuyBar';
import ScrollReveal from '@/components/ScrollReveal';
import { SubscriptionPlan, monthlySavings } from '@/lib/subscriptions';
import { formatBRL } from '@/lib/deliveryZones';
import WhatsAppGate from '@/components/WhatsAppGate';
import { OriginSeal } from '@/components/BelgiumBrazil';
import { planBoxPrice } from '@/lib/boxSizes';
import { useBoxSizePrices } from '@/lib/useBoxSizePrices';
import { CARE_SHORT } from '@/lib/treatCare';

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Escolha o tamanho e o plano',
    body: 'Caixa de 2, 4 ou 6 doces. Mensal sem compromisso, ou trimestral e anual com desconto em cada caixa.',
  },
  {
    step: '2',
    title: 'Toda semana, uma caixa nova',
    body: 'A Dolly cria um menu diferente a cada semana. Você nunca recebe a mesma caixa duas vezes.',
  },
  {
    step: '3',
    title: 'Chega sozinha na sua porta',
    body: 'Fresquinha, no dia de entrega. Sem pedir de novo, sem lembrar. Vai viajar? É só pausar.',
  },
];

const INSIDE_THE_BOX = [
  'Caixa de 2, 4 ou 6 doces autorais (você escolhe), diferentes a cada semana',
  'Sempre veganos e sem trigo, com o açúcar de cada doce à vista',
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
    q: 'Qual a diferença para comprar uma caixa avulsa?',
    a: 'É a mesma Caixa de Degustação, com um menu novo a cada semana. Na assinatura ela chega sozinha toda semana, sem você precisar pedir de novo, e cada caixa sai mais barata nos planos trimestral e anual. Ainda vem com prioridade nas edições limitadas e descontos em cursos e eventos.',
  },
  {
    q: 'Como guardo os doces?',
    a: `${CARE_SHORT} Todos os cuidados em thetropicalbakery.com/cuidados.`,
  },
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
  const sizePrices = useBoxSizePrices();
  // A plan's price for the 2- and 6-treat box: the plan's usual discount on that size (same sum as the form and the database).
  const basePerBox = Math.max(0, ...plans.map(p => Number(p.price_per_box) || 0));
  const sizePrice = (plan: SubscriptionPlan, size: 2 | 4 | 6) => planBoxPrice(Number(plan.price_per_box), basePerBox, sizePrices[size]);

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
  const scrollToPlans = () => {
    document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });
  };

  // The cheapest plan's price for the usual 4-treat box, against buying that box on its own.
  const single = sizePrices[4];
  const bestDeal = plans.length > 0
    ? (() => {
        const price = Math.min(...plans.map(p => sizePrice(p, 4)));
        return { price, pct: single > 0 ? Math.round((1 - price / single) * 100) : 0 };
      })()
    : null;
  const pctOff = (plan: SubscriptionPlan) => single > 0 ? Math.round((1 - sizePrice(plan, 4) / single) * 100) : 0;

  return (
    <main style={{ background: 'var(--color-background)' }}>

      {/* ---------------------------------------------------------------- HERO */}
      <StripedBackground tone="dark" bandHeight={96} image="/textures/copacabana-baker.webp" imagePosition="35% 60%" style={{ paddingTop: 'clamp(4.5rem, 12vw, 10rem)', paddingBottom: 'clamp(2.25rem, 8vw, 7rem)' }}>
        <HighlightsHero>
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 1.5rem', textAlign: 'center' }}>

          <span style={{
            display: 'inline-block', border: '1px solid rgba(212,175,55,0.6)', color: '#d4af37',
            padding: '0.4rem 1.1rem', borderRadius: '30px', fontSize: '0.8rem',
            textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: '1.75rem',
          }}>
            Assinatura da Caixa de Degustação
          </span>

          <h1 style={{
            fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.95rem, 7vw, 4.6rem)',
            lineHeight: 1.05, color: '#fdfaf3', marginBottom: '1.5rem',
          }}>
            Uma caixa de doces nova<br />
            <span style={{ color: '#d4af37' }}>toda semana, mais barata</span>
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2.4vw, 1.2rem)', color: 'rgba(253,250,243,0.86)',
            lineHeight: 1.75, maxWidth: '620px', margin: '0 auto 2rem',
          }}>
            Assine uma vez e a Caixa de Degustação da Dolly chega na sua porta <strong style={{ color: '#fdfaf3' }}>toda semana</strong>,
            com doces diferentes a cada vez{bestDeal && bestDeal.pct > 0 ? <> e <strong style={{ color: '#d4af37' }}>até {bestDeal.pct}% mais barata</strong> que comprar avulsa</> : null}.
          </p>

          {/* The whole offer in three chips, so nobody has to read a paragraph to get it. */}
          <div className="tb-sub-facts" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.6rem', marginBottom: '2rem' }}>
            {[
              { k: 'Quando', v: '1 caixa por semana' },
              { k: 'Preço', v: bestDeal ? `${formatBRL(bestDeal.price)} por caixa` : 'desconto por caixa', strike: bestDeal && bestDeal.pct > 0 ? formatBRL(sizePrices[4]) : null },
              { k: 'Liberdade', v: 'pause quando viajar' },
            ].map(f => (
              <div key={f.k} style={{
                background: 'rgba(253,250,243,0.08)', border: '1px solid rgba(212,175,55,0.45)',
                borderRadius: '14px', padding: '0.6rem 1rem', textAlign: 'left', minWidth: 0,
              }}>
                <span style={{ display: 'block', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#d4af37' }}>{f.k}</span>
                <span style={{ color: '#fdfaf3', fontWeight: 700, fontSize: '0.98rem' }}>
                  {f.strike && <s style={{ opacity: 0.55, fontWeight: 400, marginRight: '0.35rem' }}>{f.strike}</s>}
                  {f.v}
                </span>
              </div>
            ))}
          </div>

          <button onClick={scrollToPlans} className="btn btn-secondary" style={{
            background: '#d4af37', color: '#3c2a21', border: 'none', padding: '1.1rem 2.5rem',
            borderRadius: '10px', fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer',
            letterSpacing: '0.02em',
          }}>
            Ver planos e preços
          </button>

          <OriginSeal tone="dark" style={{ marginTop: '2rem' }} />

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
              color: 'var(--color-primary)', textAlign: 'center', marginBottom: '0.6rem',
            }}>
              Como funciona a assinatura
            </h2>
            <p style={{ textAlign: 'center', color: '#7a6a61', marginBottom: '2.5rem' }}>
              É a mesma Caixa de Degustação da loja. A diferença: chega toda semana, e custa menos.
            </p>
          </ScrollReveal>

          {/* Single box vs subscription, side by side: the one comparison that explains the page. */}
          <ScrollReveal>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1rem', maxWidth: '820px', margin: '0 auto 3.5rem' }}>
              <div style={{ background: '#fff', border: '1px solid #e8e1d7', borderRadius: '18px', padding: '1.4rem 1.5rem' }}>
                <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7a6a61', marginBottom: '0.4rem' }}>Caixa avulsa</p>
                <p style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', color: 'var(--color-primary)', lineHeight: 1.1, marginBottom: '0.75rem' }}>
                  {formatBRL(single)} <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: '#7a6a61' }}>por caixa</span>
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#594a42', lineHeight: 1.7, fontSize: '0.93rem' }}>
                  <li>· Uma caixa, uma vez</li>
                  <li>· Você pede de novo quando lembrar</li>
                  <li>· Preço cheio</li>
                </ul>
              </div>
              <div style={{ background: 'var(--color-primary)', border: '2px solid #d4af37', borderRadius: '18px', padding: '1.4rem 1.5rem', position: 'relative', boxShadow: '0 18px 40px rgba(212,175,55,0.22)' }}>
                {bestDeal && bestDeal.pct > 0 && (
                  <span style={{ position: 'absolute', top: '-0.8rem', right: '1rem', background: '#d4af37', color: '#3c2a21', fontWeight: 800, fontSize: '0.78rem', padding: '0.3rem 0.75rem', borderRadius: '20px', letterSpacing: '0.04em' }}>
                    ATÉ {bestDeal.pct}% OFF
                  </span>
                )}
                <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#d4af37', marginBottom: '0.4rem' }}>Assinatura</p>
                <p style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', color: '#fdfaf3', lineHeight: 1.1, marginBottom: '0.75rem' }}>
                  {bestDeal && bestDeal.pct > 0 && <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'rgba(253,250,243,0.7)' }}>a partir de</span>}
                  {formatBRL(bestDeal?.price ?? single)} <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'rgba(253,250,243,0.7)' }}>por caixa</span>
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: 'rgba(253,250,243,0.9)', lineHeight: 1.7, fontSize: '0.93rem' }}>
                  <li><span style={{ color: '#d4af37' }}>✓</span> Uma caixa nova <strong>toda semana</strong></li>
                  <li><span style={{ color: '#d4af37' }}>✓</span> Chega sozinha, sem pedir de novo</li>
                  <li><span style={{ color: '#d4af37' }}>✓</span> Desconto em cada caixa + mimos de assinante</li>
                </ul>
              </div>
            </div>
          </ScrollReveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
            {HOW_IT_WORKS.map(s => (
              <ScrollReveal key={s.step}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{
                    fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: '#3c2a21', background: '#d4af37',
                    width: '2.6rem', height: '2.6rem', borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {s.step}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--color-primary)', fontWeight: 700, marginBottom: '0.4rem' }}>
                      {s.title}
                    </h3>
                    <p style={{ color: '#594a42', lineHeight: 1.7, margin: 0 }}>{s.body}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- PLANS */}
      <section id="planos" style={{ padding: 'clamp(2.25rem, 9vw, 7rem) 0' }}>
        <div style={{ maxWidth: '1150px', margin: '0 auto', padding: '0 1.5rem' }}>
          <h2 style={{
            fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.9rem, 5vw, 3rem)',
            color: 'var(--color-primary)', textAlign: 'center', marginBottom: '0.75rem',
          }}>
            Quanto mais tempo, mais barato
          </h2>
          <p style={{ textAlign: 'center', color: '#7a6a61', marginBottom: '2.5rem', fontSize: '1rem', maxWidth: '620px', marginLeft: 'auto', marginRight: 'auto' }}>
            Todo plano é <strong>1 caixa por semana</strong> (4 por mês). O que muda é por quanto tempo você fica,
            e quanto paga por caixa.
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
                // Without this, snapping puts each card flush against the screen edge and ignores the padding.
                scrollPaddingLeft: '1.5rem',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                padding: '1.5rem 1.5rem 2rem',
                paddingRight: 'calc(1.5rem + 2rem)',
              }}
            >
              {[...plans].sort((a, b) => pctOff(b) - pctOff(a)).map(plan => {
                const featured = Boolean(plan.badge);
                const savings = monthlySavings(plan, single, 1);
                const isSelected = plan.id === selectedPlanId;
                const off = pctOff(plan);

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
                        borderRadius: '0 0 12px 12px', fontSize: '0.75rem', fontWeight: 800,
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

                    {/* The price people compare is per box (vs the single box), so that leads; the
                        monthly total sits under it. Menu-style: small "R$", big whole number. */}
                    {off > 0 ? (
                      <p style={{ fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                        <s style={{ opacity: 0.6 }}>{formatBRL(single)}</s>{' '}
                        <span style={{
                          background: '#d4af37', color: '#3c2a21', fontWeight: 800, fontSize: '0.75rem',
                          padding: '0.15rem 0.5rem', borderRadius: '6px', marginLeft: '0.25rem',
                        }}>-{off}%</span>
                      </p>
                    ) : (
                      <p style={{ fontSize: '0.85rem', marginBottom: '0.3rem', opacity: 0.75 }}>Preço da caixa avulsa</p>
                    )}
                    <div style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.15rem', fontFamily: 'var(--font-heading)', lineHeight: 1 }}>
                      <span style={{ fontSize: '1rem', marginTop: '0.35rem', opacity: 0.8 }}>R$</span>
                      <span style={{ fontSize: 'clamp(2.4rem, 7vw, 3rem)' }}>
                        {Math.round(sizePrice(plan, 4)).toLocaleString('pt-BR')}
                      </span>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', opacity: 0.7, alignSelf: 'flex-end', marginLeft: '0.3rem' }}>por caixa</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: savings > 0 ? '0.6rem' : '1.75rem', lineHeight: 1.6 }}>
                      <strong>1 caixa por semana</strong> (4 doces) = {formatBRL(plan.monthly_price)}/mês
                      <span style={{ display: 'block' }}>
                        {plan.commitment_months > 1 ? `Plano de ${plan.commitment_months} meses` : 'Sem compromisso, cancele quando quiser'}
                      </span>
                      <span style={{ display: 'block', marginTop: '0.2rem', opacity: 0.85 }}>
                        Caixa de 2 doces: {formatBRL(sizePrice(plan, 2))} · de 6: {formatBRL(sizePrice(plan, 6))}
                      </span>
                    </p>
                    {savings > 0 && (
                      <p style={{
                        display: 'inline-block', background: featured ? 'rgba(212,175,55,0.2)' : 'rgba(46,68,50,0.09)',
                        color: featured ? '#d4af37' : '#2e4432', padding: '0.3rem 0.8rem', borderRadius: '20px',
                        fontSize: '0.78rem', fontWeight: 700, marginBottom: '1.75rem',
                      }}>
                        Você economiza {formatBRL(savings)} por mês
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

      {/* ---------------------------------------------------- DELIVERY CALENDAR */}
      <section style={{ padding: '0 1.5rem clamp(2.25rem, 9vw, 7rem)' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <TreatFlank contentWidth={640}>
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
          </TreatFlank>
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
      {bestDeal && (
        <MobileBuyBar
          kicker="1 caixa por semana · a partir de"
          price={formatBRL(bestDeal.price)}
          note={bestDeal.pct > 0 ? `por caixa · ${bestDeal.pct}% off` : 'por caixa'}
          label="Ver planos"
          targetId="#planos"
        />
      )}

</main>
  );
}

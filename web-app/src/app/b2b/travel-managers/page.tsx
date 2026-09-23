import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ZoomableImage from '@/components/ZoomableImage';
import StripedBackground from '@/components/StripedBackground';
import BurleMarxBand from '@/components/BurleMarxBand';

const OFFERINGS = [
  {
    icon: '🏡',
    title: 'Hospedagem em Itamambuca',
    description: "A Salt n' Paradise tem 3 suítes que acomodam confortavelmente até 11 pessoas — a casa inteira, só para o seu grupo.",
    href: '/retreats',
    cta: 'Ver a casa',
  },
  {
    icon: '🍰',
    title: 'Cursos de Confeitaria Saudável',
    description: 'Workshops práticos de confeitaria vegana e SOS-Free, perfeitos para incluir num retiro de bem-estar ou numa imersão gastronômica.',
    href: '/cursos',
    cta: 'Ver os cursos',
  },
  {
    icon: '📦',
    title: 'Caixa de Degustação Durante a Estadia',
    description: 'Seu grupo recebe uma caixa de degustação semanal durante o período de hospedagem — uma mordida da rotina de quem mora aqui.',
    href: '/assinatura',
    cta: 'Ver a assinatura',
  },
  {
    icon: '🥐',
    title: 'Café da Manhã Sob Encomenda',
    description: 'Café da manhã artesanal entregue todos os dias da estadia, sem que o grupo precise sair para procurar comida.',
    href: '/caixas',
    cta: 'Ver opções',
  },
  {
    icon: '🎉',
    title: 'Doces para Ocasiões Especiais',
    description: 'Aniversário, encerramento de retiro, despedida de grupo — criamos algo à altura do momento.',
    href: '/menu',
    cta: 'Ver o menu de eventos',
  },
];

export default function TravelManagersPage() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--color-background)' }}>
      {/* Hero */}
      <section style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingTop: 'clamp(7rem, 14vw, 9rem)', paddingBottom: 'clamp(4.5rem, 9vw, 6.5rem)' }}>
        <div
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0,
            backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
            backgroundImage: 'url(/retreats/Beach shot Itamambuca.webp), linear-gradient(rgba(60, 42, 33, 0.72), rgba(60, 42, 33, 0.72))',
            backgroundBlendMode: 'overlay',
            backgroundColor: 'var(--color-primary)',
          }}
        />
        <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 2, width: '90px', opacity: 0.95 }}>
          <Image src="/itamambuca-lockup.png" alt="The Tropical Bakery — Itamambuca" width={172} height={220} style={{ width: '100%', height: 'auto' }} />
        </div>
        <div className="container relative z-10 text-center fade-in px-4">
          <span className="text-secondary tracking-[4px] uppercase text-sm md:text-base mb-4 block font-semibold">
            Organizadores &amp; Travel Managers
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6" style={{ fontFamily: 'var(--font-heading)', lineHeight: '1.15' }}>
            Um Pacote Completo para o Grupo que Você Organiza
          </h1>
          <p style={{ color: '#f5efe2', fontSize: '1.15rem', maxWidth: '740px', margin: '0 auto', lineHeight: 1.8 }}>
            Você tem um grupo interessado em saúde, yoga e natureza? Monte um retiro em Itamambuca com hospedagem, cursos,
            comida e experiências — tudo através de uma única parceria, com comissão para você.
          </p>
        </div>
      </section>

      <BurleMarxBand height={110} />

      {/* Everything we offer */}
      <section className="container px-4 max-w-6xl mx-auto" style={{ position: 'relative', paddingTop: 'clamp(1.5rem, 4vw, 2.5rem)', paddingBottom: '1rem' }}>
        <h2 style={{ position: 'relative', textAlign: 'center', fontFamily: 'var(--font-heading)', fontSize: '2rem', color: '#3c2a21', marginBottom: '1rem' }}>
          Tudo o Que Você Pode Incluir no Pacote
        </h2>
        <p style={{ textAlign: 'center', color: '#7a6a61', maxWidth: '640px', margin: '0 auto 3rem', lineHeight: 1.8 }}>
          Monte o retiro do seu jeito — combine o que fizer sentido para o seu grupo.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.75rem', marginBottom: '2rem' }}>
          {OFFERINGS.map((o, i) => (
            <div key={i} className="liquid-glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '2.4rem', marginBottom: '1rem' }}>{o.icon}</div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: '#3c2a21', marginBottom: '0.75rem' }}>{o.title}</h3>
              <p style={{ color: '#594a42', lineHeight: 1.7, fontSize: '0.96rem', marginBottom: '1.25rem', flex: 1 }}>{o.description}</p>
              <Link href={o.href} style={{ color: 'var(--color-secondary)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>
                {o.cta} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* How the partnership works + gallery */}
      <section className="container pt-8 pb-20 px-4 max-w-6xl mx-auto">
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '4rem', alignItems: 'center' }}>
          <div style={{ flex: '1 1 400px' }} className="fade-in">
            <div className="liquid-glass-card" style={{ padding: '3rem' }}>
              <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', color: '#3c2a21', fontFamily: 'var(--font-heading)', fontWeight: 800 }}>Como Funciona a Parceria?</h2>
              <p style={{ fontSize: '1.05rem', marginBottom: '1.5rem', color: '#594a42', lineHeight: '1.8' }}>
                Se você é instrutora de yoga, guia turística, ou simplesmente a pessoa que organiza as viagens do seu grupo
                (especialmente da Argentina!), montamos o pacote junto com você e cuidamos de toda a parte gastronômica.
              </p>
              <ul style={{ paddingLeft: '1.5rem', color: '#594a42', lineHeight: '1.9', marginBottom: '2rem' }}>
                <li><strong>Pacote sob medida:</strong> combine hospedagem, cursos, assinatura e eventos especiais conforme o perfil do grupo.</li>
                <li><strong>Comissionamento:</strong> receba uma porcentagem atrativa sobre o valor total do grupo que você organizar.</li>
                <li><strong>Fácil de vender:</strong> uma experiência transformadora em Itamambuca (Ubatuba), muito procurada por grupos.</li>
              </ul>
              <a
                href="https://wa.me/5511932119196?text=Ol%C3%A1%21%20Tenho%20interesse%20em%20organizar%20um%20grupo%20para%20os%20Retiros%20da%20Tropical%20Bakery."
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ fontSize: '1.1rem', letterSpacing: '1px', textAlign: 'center' as const, display: 'inline-block' }}
              >
                Falar com o Comercial
              </a>
            </div>
          </div>

          <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '2rem' }} className="fade-in">
            <ZoomableImage src="/retreats/Room with open ripada door.jpg" alt="Acomodações" style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '12px', boxShadow: '0 10px 30px rgba(60,42,33,0.15)' }} />
            <ZoomableImage src="/retreats/Beach shot Itamambuca.webp" alt="Itamambuca Beach" style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '12px', boxShadow: '0 10px 30px rgba(60,42,33,0.15)' }} />
          </div>
        </div>
      </section>

      {/* Treat Gallery Strip */}
      <StripedBackground tone="dark" bandHeight={64}>
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', padding: '3rem 2rem' }}>
          {['/menu-items/Screenshot_20260810_135948_Photos.jpg', '/menu-items/20260620_163438.jpg', '/menu-items/1000231026_3b42196b4ea44c55b3834d9f1bf36302-2_17_2026, 8_48_32 AM.png', '/menu-items/Screenshot_20260708_144013_Gallery.jpg'].map((src, i) => (
            <ZoomableImage key={i} src={src} alt="Criação Tropical" style={{ width: '200px', height: '200px', objectFit: 'cover', borderRadius: '12px', border: '2px solid rgba(212,175,55,0.3)' }} />
          ))}
        </div>
      </StripedBackground>
    </main>
  );
}

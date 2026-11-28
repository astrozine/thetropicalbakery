"use client";

import React from 'react';
import { BOX_SALE_ON } from '@/lib/boxSale';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AdminFooter from '@/components/AdminFooter';
import { STORE_WHATSAPP, STORE_WHATSAPP_DISPLAY, SUBSTACK_URL } from '@/lib/siteContact';
import { OriginSeal } from '@/components/BelgiumBrazil';
import InstagramLink from '@/components/InstagramLink';
import { usePageLang } from '@/lib/usePageLang';
import { shellHref, shellText } from '@/lib/shellCopy';

export default function Footer() {
  // The back-office has its own slim footer: the public one (photo, columns, newsletter) is far too big there.
  const pathname = usePathname();
  const lang = usePageLang();
  const t = (pt: string) => shellText(pt, lang);
  if (pathname?.startsWith('/admin')) return <AdminFooter />;

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer fade-in relative" style={{
      backgroundColor: '#2a1a12',
      overflow: 'hidden',
      color: '#faf5ec',
      padding: '6rem 2rem 3rem'
    }}>
      {/* Phones: the link lists sit two by two and the padding shrinks, so the footer no longer takes two screens. */}
      <style>{`
        @media (max-width: 699px) {
          .footer { padding: 3rem 1.25rem 2rem !important; }
          .footer-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 1.5rem 1rem !important; }
          .footer-grid > .footer-brand, .footer-grid > .footer-contact { grid-column: 1 / -1; }
          .footer-grid ul { line-height: 1.5 !important; }
          .footer-grid li a { display: inline-block; padding: 0.35rem 0; }
          .footer-grid h3 { font-size: 0.85rem; margin-bottom: 0.4rem !important; }
          .footer-brand > p, .footer-brand > br, .footer-seal, .footer-contact > p { display: none; }
          .footer-brand { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
          .footer-brand img { height: 44px !important; margin: 0 !important; }
        }
      `}</style>
      {/* The bakery photo, desaturated and tinted cocoa so it gives texture without hurting the links. */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'url(/textures/copacabana-baker.webp)', backgroundSize: 'cover', backgroundPosition: 'center 65%',
        filter: 'grayscale(1) sepia(0.45) contrast(1.1)',
      }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(180deg, rgba(42,26,18,0.82) 0%, rgba(42,26,18,0.72) 100%)' }} />
      <div className="container footer-grid" style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        <div className="footer-brand">
          <img src="/logo-pineapple-sm.webp" alt="The Tropical Bakery" loading="lazy" decoding="async" width={121} height={180} style={{ height: '96px', width: 'auto', marginBottom: '1rem', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.35))' }} />
          <p style={{ marginBottom: '1rem', color: '#e8e1d7' }}>{t('Confeitaria saudável de luxo em Ubatuba, pelas mãos da chef belga Elisabeth “Dolly” Van Dam.')}</p>
          <span className="footer-seal"><OriginSeal tone="dark" style={{ marginBottom: '1.75rem' }} /></span>
          <br />
          <InstagramLink size={22} showHandle style={{ color: '#e8e1d7', fontSize: '0.95rem', letterSpacing: '0.3px' }} />
        </div>
        
        <div>
          <h3 style={{ marginBottom: '1rem', color: '#c9a257', textTransform: 'uppercase', letterSpacing: '1.5px' }}>{t('Menu')}</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: '2' }}>
            {BOX_SALE_ON ? (
              <>
                <li><Link href="/assinatura" onClick={handleScrollToTop} style={{ color: '#c9a257', textDecoration: 'none', fontWeight: 600 }}>{t('Assinatura Semanal')}</Link></li>
                <li><Link href="/" onClick={handleScrollToTop} style={{ color: '#e8e1d7', textDecoration: 'none' }}>{t('Fazer Pedido')}</Link></li>
              </>
            ) : (
              <li><Link href="/menu" onClick={handleScrollToTop} style={{ color: '#c9a257', textDecoration: 'none', fontWeight: 600 }}>{t('Doces para Eventos')}</Link></li>
            )}
            <li><Link href="/cursos" onClick={handleScrollToTop} style={{ color: '#e8e1d7', textDecoration: 'none' }}>{t('Cursos com Dolly')}</Link></li>
            <li><Link href="/dolly" onClick={handleScrollToTop} style={{ color: '#e8e1d7', textDecoration: 'none' }}>{t('Sobre a Dolly')}</Link></li>
            <li><Link href={shellHref('/sweet-escape/pt', lang)} onClick={handleScrollToTop} style={{ color: '#e8e1d7', textDecoration: 'none' }}>{t('E-book Sweet Escape')}</Link></li>
            <li><Link href={shellHref('/diario', lang)} onClick={handleScrollToTop} style={{ color: '#e8e1d7', textDecoration: 'none' }}>{t('Diário de Receitas')}</Link></li>
            <li><Link href="/trabalhe-conosco" onClick={handleScrollToTop} style={{ color: '#e8e1d7', textDecoration: 'none' }}>{t('Trabalhe Conosco')}</Link></li>
          </ul>
        </div>
        <div>
          <h3 style={{ marginBottom: '1rem', color: '#c9a257', textTransform: 'uppercase', letterSpacing: '1.5px' }}>{t('Parcerias')}</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: '2' }}>
            <li><Link href="/b2b/hotels" onClick={handleScrollToTop} style={{ color: '#e8e1d7', textDecoration: 'none' }}>{t('Hotéis')}</Link></li>
            <li><Link href="/b2b/pousadas" onClick={handleScrollToTop} style={{ color: '#e8e1d7', textDecoration: 'none' }}>{t('Pousadas')}</Link></li>
            <li><Link href="/b2b/airbnbs" onClick={handleScrollToTop} style={{ color: '#e8e1d7', textDecoration: 'none' }}>{t('Airbnbs')}</Link></li>
            <li><Link href="/b2b/restaurants" onClick={handleScrollToTop} style={{ color: '#e8e1d7', textDecoration: 'none' }}>{t('Restaurantes')}</Link></li>
            <li><Link href="/b2b/bakeries" onClick={handleScrollToTop} style={{ color: '#e8e1d7', textDecoration: 'none' }}>{t('Padarias')}</Link></li>
            <li><Link href={shellHref('/b2b/barcos', lang)} onClick={handleScrollToTop} style={{ color: '#e8e1d7', textDecoration: 'none' }}>{t('Barcos e Marinas')}</Link></li>
            <li><Link href="/b2b/bem-estar" onClick={handleScrollToTop} style={{ color: '#e8e1d7', textDecoration: 'none' }}>{t('Yoga, Academias e Spas')}</Link></li>
          </ul>
        </div>
        <div className="footer-contact">
          <h3 style={{ marginBottom: '1rem', color: '#c9a257', textTransform: 'uppercase', letterSpacing: '1.5px' }}>{t('Contato')}</h3>
          <p style={{ lineHeight: 1.7, color: '#e8e1d7', fontSize: '0.92rem' }}>
            {lang === 'pt' ? (
              <>Home bakery em Itamambuca, Ubatuba · SP.<br />
              Quem escolhe <strong>retirada</strong> recebe o endereço na sua conta assim que o pedido é confirmado.</>
            ) : 'Home bakery in Itamambuca, Ubatuba · SP, Brazil.'}
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0.75rem 0 0', lineHeight: '2' }}>
            <li><a href={`https://wa.me/${STORE_WHATSAPP}`} target="_blank" rel="noopener noreferrer" style={{ color: '#c9a257', textDecoration: 'none', fontWeight: 600 }}>WhatsApp {STORE_WHATSAPP_DISPLAY}</a></li>
            <li><Link href="/minha-conta" onClick={handleScrollToTop} style={{ color: '#e8e1d7', textDecoration: 'none' }}>{t('Minha conta e retiradas')}</Link></li>
            <li><a href={SUBSTACK_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#e8e1d7', textDecoration: 'none' }}>{t('Sunbaked Letters, a newsletter ↗')}</a></li>
          </ul>
        </div>
      </div>
      
      <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem', color: '#b2bec3' }}>
        <p style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          &copy; {new Date().getFullYear()} The Tropical Bakery. {t('Todos os direitos reservados.')}
        </p>
        <p className="footer-legal" style={{ fontSize: '0.8rem' }}>
          <Link href="/privacidade" style={{ color: '#b2bec3', textDecoration: 'underline', display: 'inline-block', padding: '0.7rem 0.25rem' }}>{t('Política de Privacidade')}</Link>
          {' · '}
          <Link href={shellHref('/cuidados', lang)} style={{ color: '#b2bec3', textDecoration: 'underline', display: 'inline-block', padding: '0.7rem 0.25rem' }}>{t('Cuidados com os doces')}</Link>
          {' · '}
          <Link href="/preferencias" style={{ color: '#b2bec3', textDecoration: 'underline', display: 'inline-block', padding: '0.7rem 0.25rem' }}>{t('Preferências de e-mail')}</Link>
        </p>
      </div>
    </footer>
  );
}

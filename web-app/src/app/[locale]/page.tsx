import Image from 'next/image';
import WhatsAppCheckout from '@/components/WhatsAppCheckout';
import Marquee from '@/components/Marquee';
import ScrollReveal from '@/components/ScrollReveal';
import ExplodingTreats from '@/components/ExplodingTreats';
import ZoomableImage from '@/components/ZoomableImage';
import ModalCard from '@/components/ModalCard';
import { supabase } from '@/lib/supabase';
import { getTranslations } from 'next-intl/server';

export const revalidate = 0; // Ensures fresh data is fetched for the homepage

export default async function Home({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'Index' });
  
  // Fetch dynamic content from site_content
  let { data: contentData } = await supabase.from('site_content').select('*').eq('locale', locale);
  if (!contentData || contentData.length === 0) {
    const { data: fallbackContent } = await supabase.from('site_content').select('*').eq('locale', 'pt');
    contentData = fallbackContent;
  }
  
  // Fetch highlights
  let { data: highlights } = await supabase
    .from('highlights')
    .select('*')
    .eq('is_active', true)
    .eq('locale', locale)
    .order('created_at', { ascending: false });
    
  if (!highlights || highlights.length === 0) {
    const { data: fallbackHighlights } = await supabase
      .from('highlights')
      .select('*')
      .eq('is_active', true)
      .eq('locale', 'pt')
      .order('created_at', { ascending: false });
    highlights = fallbackHighlights;
  }
  
  const getContent = (sectionId: string, fallbackUrl: string) => {
    const item = contentData?.find(c => c.section_id === sectionId);
    return item?.image_url || fallbackUrl;
  };

  const getText = (sectionId: string, fallbackText: string) => {
    const item = contentData?.find(c => c.section_id === sectionId);
    return item?.text_content || fallbackText;
  };

  return (
    <main>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background"></div>
        <div className="container hero-content fade-in" style={{ padding: '0' }}>
          <ExplodingTreats />
        </div>
      </section>

      <Marquee text="100% VEGAN ✦ GLUTEN-FREE ✦ SOS-FREE ✦ THE TROPICAL BAKERY ✦ ITAMAMBUCA ✦" />

      {/* About Section */}
      <section className="container" style={{ padding: '12rem 2rem', position: 'relative' }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', gap: '4rem', alignItems: 'center' }}>
          <div style={{ flex: '1 1 500px', textAlign: 'left' }}>
            <ScrollReveal className="liquid-glass-card">
              <div style={{ padding: '4rem 3rem' }}>
              <h2 className="text-primary" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '2rem', fontFamily: 'var(--font-heading)' }}>
                {t('philosophyTitle')}
              </h2>
              <p style={{ fontSize: '1.2rem', marginBottom: '3rem', color: '#594a42', lineHeight: '1.8', whiteSpace: 'pre-line' }}>
                {getText('home-about', t('philosophyText'))}
              </p>
              
              <div className="features-grid" style={{ gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                <div className="feature-item">
                  <div className="feature-icon" style={{ color: '#d4af37' }}>🌿</div>
                  <h3 className="feature-title">{t('feature1Title')}</h3>
                  <p style={{ color: '#7a6a61' }}>{t('feature1Desc')}</p>
                </div>
                <div className="feature-item">
                  <div className="feature-icon" style={{ color: '#d4af37' }}>🌾</div>
                  <h3 className="feature-title">{t('feature2Title')}</h3>
                  <p style={{ color: '#7a6a61' }}>{t('feature2Desc')}</p>
                </div>
                <div className="feature-item">
                  <div className="feature-icon" style={{ color: '#d4af37' }}>🎁</div>
                  <h3 className="feature-title">{t('feature3Title')}</h3>
                  <p style={{ color: '#7a6a61' }}>{t('feature3Desc')}</p>
                </div>
              </div>
            </div>
            </ScrollReveal>
          </div>

          <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center' }}>
            <ScrollReveal>
              <ZoomableImage 
                src={getContent('home-about', "/menu-items/1000240473 - Edited (1).jpg")} 
                alt="Filosofia Tropical" 
                style={{ width: '100%', maxWidth: '500px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', objectFit: 'cover', aspectRatio: '4/5' }} 
              />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Parallax Banner 1 */}
      <section 
        className="parallax-banner" 
        style={{ backgroundImage: `url(${getContent('home-parallax-1', '/iphone_nano_banana.jpg')})` }} 
      />

      {/* Checkout Section */}
      <section id="order" style={{ padding: '6rem 2rem', background: '#fdfaf3' }}>
        <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: '1100px' }}>
          <ScrollReveal className="text-center">
            <WhatsAppCheckout />
          </ScrollReveal>
        </div>
      </section>

      {/* Parallax Banner 2 */}
      <section 
        className="parallax-banner" 
        style={{ backgroundImage: `url(${getContent('home-parallax-2', '/iphone_passion_fruit.jpg')})` }} 
      />

      {/* Menu/Inspiration Section */}
      <section id="menu" className="menu-section" style={{ padding: '12rem 2rem', background: '#fdfaf3' }}>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <ScrollReveal>
            <h2 className="section-title">{t('highlightsTitle')}</h2>
            <p className="text-center" style={{ marginBottom: '3rem', color: '#594a42', fontSize: '1.1rem' }}>{t('highlightsSubtitle')}</p>
          </ScrollReveal>
          
          <div className="menu-grid">
            {highlights && highlights.length > 0 ? (
              highlights.map((highlight, idx) => (
                <ScrollReveal delay={idx * 0.1} key={highlight.id}>
                  <ModalCard 
                    imageSrc={highlight.image_url}
                    title={highlight.title}
                    description={highlight.description}
                  />
                </ScrollReveal>
              ))
            ) : (
              <>
                <ScrollReveal delay={0.1}>
                  <ModalCard 
                    imageSrc="/box1.jpg"
                    title={t('defaultBox1Title')}
                    description={t('defaultBox1Desc')}
                  />
                </ScrollReveal>
                <ScrollReveal delay={0.2}>
                  <ModalCard 
                    imageSrc="/box2.jpg"
                    title={t('defaultBox2Title')}
                    description={t('defaultBox2Desc')}
                  />
                </ScrollReveal>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

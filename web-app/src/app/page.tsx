import Image from 'next/image';
import WhatsAppCheckout from '@/components/WhatsAppCheckout';
import Marquee from '@/components/Marquee';
import ScrollReveal from '@/components/ScrollReveal';
import ExplodingTreats from '@/components/ExplodingTreats';
import ZoomableImage from '@/components/ZoomableImage';
import ModalCard from '@/components/ModalCard';
import WaitlistCapture from '@/components/WaitlistCapture';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export const revalidate = 0; // Ensures fresh data is fetched for the homepage

export default async function Home() {
  
  // Fetch dynamic content from site_content
  const { data: contentData } = await supabase.from('site_content').select('*');
  
  // Fetch highlights
  const { data: highlights } = await supabase
    .from('highlights')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  // Fetch active tasting box
  const { data: activeBox } = await supabase
    .from('tasting_boxes')
    .select('*')
    .eq('is_active', true)
    .single();
  
  const getContent = (sectionId: string, fallbackUrl: string) => {
    const item = contentData?.find(c => c.section_id === sectionId);
    return item?.image_url || fallbackUrl;
  };

  const getText = (sectionId: string, fallbackText: string) => {
    const item = contentData?.find(c => c.section_id === sectionId);
    return item?.text_content || fallbackText;
  };

  const announcement = getText('announcement', '');
  const announcementLink = getContent('announcement', '');

  return (
    <main>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background"></div>
        {announcement && (
          <div style={{ position: 'absolute', top: 'clamp(1rem, 3vw, 1.75rem)', right: 'clamp(1rem, 3vw, 1.75rem)', zIndex: 5, maxWidth: 'min(80vw, 320px)' }}>
            {announcementLink ? (
              <Link
                href={announcementLink}
                style={{ display: 'block', background: '#3c2a21', color: '#fdfaf3', padding: '0.65rem 1.1rem', borderRadius: '30px', fontSize: '0.82rem', fontWeight: 600, border: '1px solid rgba(212,175,55,0.6)', boxShadow: '0 8px 20px rgba(60,42,33,0.25)', lineHeight: 1.5 }}
              >
                {announcement}
              </Link>
            ) : (
              <div style={{ background: '#3c2a21', color: '#fdfaf3', padding: '0.65rem 1.1rem', borderRadius: '30px', fontSize: '0.82rem', fontWeight: 600, border: '1px solid rgba(212,175,55,0.6)', boxShadow: '0 8px 20px rgba(60,42,33,0.25)', lineHeight: 1.5 }}>
                {announcement}
              </div>
            )}
          </div>
        )}
        <div className="hero-side-image hero-side-image-left">
          <img src="/box3.jpg" alt="Caixa de Degustação The Tropical Bakery" />
        </div>
        <div className="hero-side-image hero-side-image-right">
          <img src="/box1.jpg" alt="Caixa de Degustação The Tropical Bakery" />
        </div>
        <div className="container hero-content fade-in" style={{ padding: '0' }}>
          <ExplodingTreats />
        </div>
      </section>

      {/* Scrolling Text Banner */}
      <Marquee text="THE TROPICAL BAKERY ✦ ITAMAMBUCA ✦ VEGAN ✦ " speed={300} />

      {/* Philosophy Section */}
      <section className="container" style={{ padding: '12rem 2rem', position: 'relative' }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', gap: '4rem', alignItems: 'center' }}>
          <div style={{ flex: '1 1 500px', textAlign: 'left' }}>
            <ScrollReveal className="liquid-glass-card">
              <div style={{ padding: '4rem 3rem' }}>
              <h2 className="text-primary" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '2rem', fontFamily: 'var(--font-heading)' }}>
                Nossa Filosofia
              </h2>
              <p style={{ fontSize: '1.2rem', marginBottom: '3rem', color: '#594a42', lineHeight: '1.8', whiteSpace: 'pre-line' }}>
                {getText('home-about', `Na The Tropical Bakery, acreditamos que a indulgência não precisa comprometer a saúde.\n\nNossas Surprise Treat Boxes são criadas para serem SOS-Free (sem adição de sal, óleo ou açúcar refinado), 100% Veganas e Sem Glúten. Focamos em criações tropicais densas em nutrientes, vibrantes e deliciosas para quem vive ou visita Itamambuca e Ubatuba.`)}
              </p>
              
              <div className="features-grid" style={{ gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                <div className="feature-item">
                  <div className="feature-icon" style={{ color: '#d4af37' }}>🌿</div>
                  <h3 className="feature-title">Vegano & Natural</h3>
                  <p style={{ color: '#7a6a61' }}>Ingredientes puros, sem concessões.</p>
                </div>
                <div className="feature-item">
                  <div className="feature-icon" style={{ color: '#d4af37' }}>🌾</div>
                  <h3 className="feature-title">Sem Glúten</h3>
                  <p style={{ color: '#7a6a61' }}>Seguro e delicioso para todos.</p>
                </div>
                <div className="feature-item">
                  <div className="feature-icon" style={{ color: '#d4af37' }}>🎁</div>
                  <h3 className="feature-title">Surpresa Semanal</h3>
                  <p style={{ color: '#7a6a61' }}>Entregue fresquinho em Itamambuca!</p>
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

      {/* Active Box Banner */}
      <section id="order" style={{ padding: '6rem 2rem', background: '#fdfaf3' }}>
        <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: '1000px' }}>
          <ScrollReveal className="text-center">
            {activeBox ? (
              <div style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(60, 42, 33, 0.1)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '300px', width: '100%', background: `url(${activeBox.image_url}) center/cover no-repeat` }} />
                <div style={{ padding: '3rem', textAlign: 'left', flex: 1 }}>
                  <span style={{ display: 'inline-block', background: '#d4af37', color: 'white', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>
                    Apenas esta semana! • {activeBox.batch_date_label}
                  </span>
                  <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#3c2a21', fontFamily: 'var(--font-heading)', lineHeight: '1.1', marginBottom: '1rem' }}>
                    {activeBox.title}
                  </h2>
                  <p style={{ fontSize: '1.1rem', color: '#594a42', marginBottom: '2rem', lineHeight: '1.6' }}>
                    {activeBox.description}
                  </p>
                  <a href="/caixas" className="btn btn-primary" style={{ padding: '1rem 2rem', display: 'inline-block', width: '100%', textAlign: 'center', background: 'linear-gradient(135deg, #d4af37, #c19b2e)', border: 'none', borderRadius: '40px' }}>
                    Reservar Minha Caixa
                  </a>
                </div>
              </div>
            ) : (
              <div style={{ padding: '3rem 1rem', background: 'white', borderRadius: '24px', boxShadow: '0 10px 30px rgba(60, 42, 33, 0.05)' }}>
                <WaitlistCapture theme="light" />
              </div>
            )}
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
            <h2 className="section-title">Destaques Anteriores</h2>
            <p className="text-center" style={{ marginBottom: '3rem', color: '#594a42', fontSize: '1.1rem' }}>Um gostinho do que você pode encontrar na sua caixa surpresa!</p>
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
                    title="O Clássico Tropical"
                    description="Uma seleção primorosa de doces refinados com o toque inconfundível da nossa padaria."
                  />
                </ScrollReveal>
                <ScrollReveal delay={0.2}>
                  <ModalCard 
                    imageSrc="/box2.jpg"
                    title="Seleção Premium"
                    description="Texturas marcantes e ingredientes frescos, pensados para surpreender os paladares mais exigentes."
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

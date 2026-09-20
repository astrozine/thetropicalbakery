import Image from 'next/image';
import WhatsAppCheckout from '@/components/WhatsAppCheckout';
import Marquee from '@/components/Marquee';
import ScrollReveal from '@/components/ScrollReveal';
import ExplodingTreats from '@/components/ExplodingTreats';
import ZoomableImage from '@/components/ZoomableImage';
import ModalCard from '@/components/ModalCard';


export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background"></div>
        <div className="container hero-content fade-in" style={{ padding: '4rem 0' }}>
          <ExplodingTreats />
        </div>
      </section>

      <Marquee text="100% VEGAN ✦ GLUTEN-FREE ✦ SOS-FREE ✦ THE TROPICAL BAKERY ✦" />

      {/* About Section */}
      <section className="container" style={{ padding: '12rem 2rem', position: 'relative' }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', gap: '4rem', alignItems: 'center' }}>
          <div style={{ flex: '1 1 500px', textAlign: 'left' }}>
            <ScrollReveal className="liquid-glass-card">
              <div style={{ padding: '4rem 3rem' }}>
              <h2 className="text-primary" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '2rem', fontFamily: 'var(--font-heading)' }}>Nossa Filosofia</h2>
              <p style={{ fontSize: '1.2rem', marginBottom: '3rem', color: '#594a42', lineHeight: '1.8' }}>
                Na The Tropical Bakery, acreditamos que a indulgência não precisa comprometer a saúde. 
                Nossas <strong>Surprise Treat Boxes</strong> são criadas para serem <strong>SOS-Free</strong> (sem adição de sal, óleo ou açúcar refinado), 
                <strong> 100% Veganas</strong> e <strong>Sem Glúten</strong>. 
                Focamos em criações tropicais densas em nutrientes, vibrantes e deliciosas.
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
              <p style={{ color: '#7a6a61' }}>Uma nova seleção exclusiva a cada semana!</p>
              </div>
            </div>
            </div>
            </ScrollReveal>
          </div>

          <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center' }}>
            <ScrollReveal>
              <ZoomableImage src="/menu-items/1000240473 - Edited (1).jpg" alt="Mousse Tropical" style={{ width: '100%', maxWidth: '500px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', objectFit: 'cover', aspectRatio: '4/5' }} />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Parallax Banner 1 */}
      <section 
        className="parallax-banner" 
        style={{ backgroundImage: 'url(/iphone_nano_banana.jpg)' }} 
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
        style={{ backgroundImage: 'url(/iphone_passion_fruit.jpg)' }} 
      />

      {/* Menu/Inspiration Section */}
      <section id="menu" className="menu-section" style={{ padding: '12rem 2rem', background: '#fdfaf3' }}>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <ScrollReveal>
            <h2 className="section-title">Destaques Anteriores</h2>
            <p className="text-center" style={{ marginBottom: '3rem', color: '#594a42', fontSize: '1.1rem' }}>Um gostinho do que você pode encontrar na sua caixa surpresa!</p>
          </ScrollReveal>
          
          <div className="menu-grid">
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

            <ScrollReveal delay={0.3}>
              <ModalCard 
                imageSrc="/box3.jpg"
                title="Surpresa Artesanal"
                description="Cada detalhe é cuidadosamente montado para oferecer uma experiência gastronômica única."
              />
            </ScrollReveal>
            
            <ScrollReveal delay={0.4}>
              <ModalCard 
                imageSrc="/box4.jpg"
                title="Requinte em Caixa"
                description="A união perfeita entre saúde, estética e sabor inesquecível em uma única apresentação."
              />
            </ScrollReveal>
          </div>
        </div>
      </section>
    </main>
  );
}

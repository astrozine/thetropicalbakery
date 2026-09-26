import Image from 'next/image';
import Marquee from '@/components/Marquee';
import ScrollReveal from '@/components/ScrollReveal';
import ExplodingTreats from '@/components/ExplodingTreats';
import HomeTreatPicker from '@/components/HomeTreatPicker';
import PhilosophyShowcase from '@/components/PhilosophyShowcase';
import PhotoShowcase from '@/components/PhotoShowcase';
import FeaturedBoxCard from '@/components/FeaturedBoxCard';
import { formatBatchDate } from '@/lib/batchDate';
import { fetchSchedule, selectableDates } from '@/lib/deliverySchedule';
import { inDeliveryWindow, noUpcomingEdition, saleState } from '@/lib/boxWindow';
import NoBoxNotice from '@/components/NoBoxNotice';
import ModalCard from '@/components/ModalCard';
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
  
  // A box only counts as "on sale" if a customer could really order it: a delivery day is left
  // to pick and its ordering window is open. Otherwise say there is no box yet and offer the waiting list.
  let boxOnSale = !!activeBox;
  if (activeBox) {
    const schedule = await fetchSchedule();
    const choosable = inDeliveryWindow(selectableDates(schedule), activeBox);
    boxOnSale = !noUpcomingEdition(saleState(activeBox, choosable).state, choosable);
  }

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

      {/* Phones open with something to tap, not something to read. Desktop is unchanged. */}
      <HomeTreatPicker />

      {/* Scrolling Text Banner */}
      <Marquee text="THE TROPICAL BAKERY ✦ ITAMAMBUCA ✦ VEGAN ✦ " speed={300} />

      {/* Philosophy Section: accordions for the story, boxes, prices, ingredients, events and delivery */}
      <PhilosophyShowcase featuredImage={getContent('home-about', '/menu-items/1000240473 - Edited (1).jpg')} />

      {/* Full-colour photo band: the branded paper and the treats */}
      <PhotoShowcase />

      {/* Parallax Banner 1 */}
      <section 
        className="parallax-banner" 
        style={{ backgroundImage: `url(${getContent('home-parallax-1', '/iphone_nano_banana.jpg')})` }} 
      />

      {/* Active Box Banner */}
      <section id="order" style={{ padding: '6rem 2rem', background: '#fdfaf3' }}>
        <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: '1100px' }}>
          <ScrollReveal className="text-center">
            {activeBox && boxOnSale ? (
              <FeaturedBoxCard
                title={activeBox.title}
                description={activeBox.description}
                imageUrl={activeBox.image_url}
                dateLabel={formatBatchDate(activeBox.batch_date_label)}
              />
            ) : (
              <NoBoxNotice variant="card" />
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
          
          {/* On a phone this scrolls sideways (see .tb-rail); on desktop it stays a grid. */}
          <div className="menu-grid tb-rail">
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
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

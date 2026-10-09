import Image from 'next/image';
import Marquee from '@/components/Marquee';
import ScrollReveal from '@/components/ScrollReveal';
import ExplodingTreats from '@/components/ExplodingTreats';
import HomeTreatPicker from '@/components/HomeTreatPicker';
import PhilosophyShowcase from '@/components/PhilosophyShowcase';
import PhotoShowcase from '@/components/PhotoShowcase';
import { OriginStory } from '@/components/BelgiumBrazil';
import FeaturedBoxCard from '@/components/FeaturedBoxCard';
import { formatBatchDate } from '@/lib/batchDate';
import { fetchSchedule, selectableDates } from '@/lib/deliverySchedule';
import { boxPriceText, boxRange, deliveryWindowLabel, editionIcon, editionLabel, fixedPrice, inDeliveryWindow, isPresale, isRolledOver, isSpecial, noUpcomingEdition, saleState, shortDay, sortLive } from '@/lib/boxWindow';
import { fetchBoxSizePrices } from '@/lib/boxSizes';

import type { HeroBox } from '@/components/HeroLiveBoxes';
import NoBoxNotice from '@/components/NoBoxNotice';
import ModalCard from '@/components/ModalCard';
import HighlightsRail from '@/components/HighlightsRail';
import GlobalMenuTeaser from '@/components/GlobalMenuTeaser';
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

  // Every live box: the weekly ready one, next week's pre-sale, and any special editions (migrations 35, 40).
  const { data: activeRows } = await supabase
    .from('tasting_boxes')
    .select('*')
    .eq('is_active', true);
  type Row = NonNullable<typeof activeRows>[number];
  const rows: Row[] = activeRows || [];
  const schedule = rows.length ? await fetchSchedule() : null;
  const all = schedule ? selectableDates(schedule) : [];
  const sizePrices = rows.length ? (await fetchBoxSizePrices(supabase)).prices : null;
  const saleOf = (b: Row) => { const choosable = inDeliveryWindow(all, b); return { choosable, ...saleState(b, choosable) }; };
  const open = (b: Row) => saleOf(b).state === 'open';

  // A box only counts as "on sale" if a customer could really order it: a delivery day is left to pick and
  // its ordering window is open. The ones that can be ordered are all shown; when none can, the first box
  // that is still worth showing (sold out = waiting list) keeps the old single card, else the "no box yet" notice.
  const openBoxes = sortLive(rows.filter(open), open);
  const fallback = sortLive(rows.filter(b => { const s = saleOf(b); return !noUpcomingEdition(s.state, s.choosable); }), open)[0];
  const featured: Row[] = openBoxes.length ? openBoxes : fallback ? [fallback] : [];

  /** The date words on a box's badge. */
  const dateLabelOf = (b: Row) => {
    const { choosable } = saleOf(b);
    // Next week's box, made to order, or a special edition: say when it arrives.
    if (isPresale(b)) return `pré-venda · entregas ${deliveryWindowLabel(b) || 'na próxima semana'}`;
    if (isSpecial(b)) return deliveryWindowLabel(b) ? `entregas ${deliveryWindowLabel(b)}` : '';
    // The planned batch date is over but there are boxes left: say when they arrive now.
    if (choosable.length && isRolledOver(all, boxRange(b))) return `entregas a partir de ${shortDay(choosable[0])}`;
    return formatBatchDate(b.batch_date_label);
  };
  const left = (b: Row) => (b.total_quantity > 0 ? Math.max(0, b.total_quantity - b.sold_quantity) : null);
  const priceOf = (b: Row) => (sizePrices ? boxPriceText(b, sizePrices) : '');
  // The "how many left" sticker only for a limited batch that can be ordered right now (one box on sale).
  const boxesLeft = openBoxes.length === 1 ? left(openBoxes[0]) : null;
  const liveBoxes: HeroBox[] = openBoxes.map(b => ({
    id: b.id, title: b.title, image: b.image_url || '',
    kicker: `${editionIcon(b)} ${editionLabel(b)}`,
    price: priceOf(b),
    sub: [left(b) != null ? `restam ${left(b)}` : '', isSpecial(b) || isPresale(b) ? deliveryWindowLabel(b) && `entregas ${deliveryWindowLabel(b)}` : ''].filter(Boolean).join(' · '),
  }));

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
        {/* The photo collage on each side is drawn by ExplodingTreats, so it needs the full width. */}
        <div className="container hero-content fade-in" style={{ padding: '0', maxWidth: 'none' }}>
          <ExplodingTreats boxesLeft={boxesLeft} liveBoxes={liveBoxes} />
        </div>
      </section>

      {/* Phones open with something to tap, not something to read. Desktop is unchanged. */}
      <HomeTreatPicker />

      {/* Events photo strip: sits right under the tasting box instead of at the foot of the page */}
      <GlobalMenuTeaser inPage />

      {/* Scrolling Text Banner */}
      <Marquee text="THE TROPICAL BAKERY ✦ MAESTRIA BELGA ✦ NATUREZA BRASILEIRA ✦ ITAMAMBUCA ✦ VEGAN ✦ " speed={300} />

      {/* Philosophy Section: accordions for the story, boxes, prices, ingredients, events and delivery */}
      <PhilosophyShowcase featuredImage={getContent('home-about', '/menu-items/1000240473 - Edited (1).jpg')} />

      {/* Who makes it: Belgian skill + Brazilian nature. The one place the whole story is told. */}
      <OriginStory />

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
            {featured.length ? (
              <div style={{ display: 'grid', gap: 'clamp(2rem, 5vw, 3.5rem)' }}>
                {featured.map(b => (
                  <FeaturedBoxCard
                    key={b.id}
                    title={b.title}
                    description={b.description}
                    items={b.items}
                    imageUrl={b.image_url}
                    dateLabel={dateLabelOf(b)}
                    badge={isSpecial(b) ? '🎁 Edição especial' : undefined}
                    href={featured.length > 1 ? `/caixas?caixa=${b.id}` : '/caixas'}
                    priceText={fixedPrice(b) ? priceOf(b) : undefined}
                  />
                ))}
              </div>
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
          
          {/* On a phone this scrolls sideways with dots + a hint (HighlightsRail); on desktop it stays a grid.
              No per-card ScrollReveal: cards clipped off to the right never count as "in view" and stayed invisible. */}
          <ScrollReveal>
            <HighlightsRail>
              {highlights && highlights.length > 0 ? (
                highlights.map((highlight) => (
                  <ModalCard
                    key={highlight.id}
                    imageSrc={highlight.image_url}
                    title={highlight.title}
                    description={highlight.description}
                  />
                ))
              ) : (
                [
                  { src: '/box1.jpg', title: 'O Clássico Tropical', desc: 'Uma seleção primorosa de doces sofisticados com o toque inconfundível da nossa padaria.' },
                  { src: '/box2.jpg', title: 'Seleção Premium', desc: 'Texturas marcantes e ingredientes frescos, pensados para surpreender os paladares mais exigentes.' },
                  { src: '/box3.jpg', title: 'Surpresa Artesanal', desc: 'Cada detalhe é cuidadosamente montado para oferecer uma experiência gastronômica única.' },
                  { src: '/box4.jpg', title: 'Requinte em Caixa', desc: 'A união perfeita entre saúde, estética e sabor inesquecível em uma única apresentação.' },
                ].map((c) => (
                  <ModalCard key={c.src} imageSrc={c.src} title={c.title} description={c.desc} />
                ))
              )}
            </HighlightsRail>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}

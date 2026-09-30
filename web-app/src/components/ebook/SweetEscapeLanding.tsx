'use client';

import React, { useEffect } from 'react';
import ZoomableImage from '@/components/ZoomableImage';
import MobileBuyBar from '@/components/MobileBuyBar';
import RainbowJourney from './RainbowJourney';
import EbookBuyBox from './EbookBuyBox';
import { BAKERY_TREAT_PRICE_BRL, EBOOK, RECIPES, TOTAL_TREATS } from '@/lib/ebook';
import { trackMeta } from '@/lib/metaPixel';
import './sweetEscape.css';

const IMG = '/ebook/sweet-escape';
const price = `R$ ${EBOOK.priceBRL}`;
const brl = (n: number) => `R$ ${n.toLocaleString('pt-BR')}`;

const BLOCKS = [
  { icon: '🥥', title: 'Healthy fats & proteins', text: 'Nuts, seeds, avocado and coconut give creaminess, richness and the kind of fullness sugar never does.' },
  { icon: '🌴', title: 'Natural sweetness', text: 'Dates, dried fruit and ripe fruit: whole, fiber-rich sweetness that doesn’t spike and crash.' },
  { icon: '🌾', title: 'The base', text: 'Oats, almond flour and even tubers give structure and comfort, with no white wheat flour anywhere.' },
  { icon: '✨', title: 'Flavors & spices', text: 'Cacao, vanilla, cinnamon, cardamom, clove and tropical zest: the soul of every treat.' },
  { icon: '🍓', title: 'Toppings & textures', text: 'Freeze-dried fruit, seeds, coconut, a chocolate shell, edible flowers: beauty and crunch.' },
  { icon: '🌈', title: 'Color & mood', text: 'Beetroot, spirulina, turmeric, blueberries. Nature’s palette, and the reason kids reach for it.' },
];

const PEEK = [
  { src: `${IMG}/contents.webp`, alt: 'Contents page of Sweet Escape' },
  { src: `${IMG}/page-rule.webp`, alt: 'Rule #2: the six building blocks' },
  { src: `${IMG}/page-opener.webp`, alt: 'Day 1 Yellow recipe opener' },
  { src: `${IMG}/page-recipe.webp`, alt: 'A recipe page with ingredients and steps' },
  { src: `${IMG}/page-why.webp`, alt: 'Why pineapple? The story behind the ingredient' },
  { src: `${IMG}/page-benefits.webp`, alt: 'Health benefits of every ingredient' },
  { src: `${IMG}/page-purple.webp`, alt: 'Day 4 Purple recipe opener' },
  { src: `${IMG}/page-story.webp`, alt: 'Dolly’s story: from ballet to the jungle kitchen' },
];

const STACK = [
  { what: 'The Sweet Escape e-book', detail: `${EBOOK.pages} full-color pages, 7 complete recipes with every layer, step and photo` },
  { what: 'The 6 building blocks', detail: 'the framework that lets you invent your own treats after the seventh day' },
  { what: '“Why this ingredient?” stories', detail: 'the history and magic of pineapple, mango, berries, sweet potato, spirulina, peanut and cacao' },
  { what: 'Health benefits for every recipe', detail: 'what each ingredient does for you and your family, in plain words' },
  { what: 'Dolly’s six rules & simple toolkit', detail: 'a blender, some molds and a freezer. That’s the whole kitchen.' },
  { what: 'Bonus: a free 30-minute Food Healing call', detail: 'book an intake call with Dolly from inside the book', bonus: true },
  { what: 'Bonus: an invitation to Sunbaked Letters', detail: 'Dolly’s weekly letter of recipes and food healing', bonus: true },
];

const FAQ = [
  { q: 'What language is the book in?', a: 'English, in simple and friendly language. (O livro é em inglês: se você lê receitas em inglês, vai se sentir em casa.) Measurements are in cups and spoons, oven temperatures in °C and °F.' },
  { q: 'How do I get it?', a: 'It’s a PDF. After paying by card or PayPal your download opens straight away, and a personal link arrives by e-mail. With Pix, Dolly confirms the payment by hand (usually within a few hours) and the same link unlocks itself.' },
  { q: 'Do I need special equipment?', a: 'No. A blender or food processor, a few silicone molds or a tray, and a freezer. Most treats are raw: you blend, press, and let the freezer do the work. Only the muffins and the taco cookies need an oven.' },
  { q: 'Is it really without refined sugar?', a: 'Every recipe is sweetened with dates, raisins and fruit. The one exception is the chocolate shell on Day 7: the book shows you how to choose a dark chocolate without refined sugar, because most shop-bought ones contain some.' },
  { q: 'Is it vegan? Gluten-free?', a: '100% plant-based, no dairy, no eggs, and no wheat flour. Some recipes use oats: pick certified gluten-free oats if you need to.' },
  { q: 'My child has a nut allergy.', a: 'Please be careful: nuts, seeds and coconut are the heart of most recipes (almonds, cashews, walnuts, pecans, pistachios, peanuts). The building-blocks chapter helps you think about swaps, but this book is not written for a nut-free kitchen.' },
  { q: 'I’m a beginner. Will I manage?', a: 'Yes. Rule #4 is literally “work smart, not hard”. Start with Day 3, the Red Berry Bliss Balls: no oven, ten minutes, and little hands can roll them.' },
  { q: 'What if I don’t love it?', a: 'Write to us within 7 days and we refund every centavo. No forms, no hard feelings.' },
];

function BuyButton({ children = `Get Sweet Escape · ${price}` }: { children?: React.ReactNode }) {
  const go = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('buy')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return <a href="#buy" onClick={go} className="se-btn se-btn--primary se-btn--big">{children}</a>;
}

export default function SweetEscapeLanding() {
  useEffect(() => {
    trackMeta('ViewContent', { value: EBOOK.priceBRL, content_name: EBOOK.id, content_type: 'product' });
  }, []);

  const bakeryValue = TOTAL_TREATS * BAKERY_TREAT_PRICE_BRL;

  return (
    <div className="se">
      {/* ══ HERO: the floating-photo style from /retreats, with the book itself in the middle ══ */}
      <section className="se-hero">
        <div className="se-hero__bg" />
        <div className="se-hero__grid se-wrap">
          <div className="se-hero__head">
            <p className="se-hero__eyebrow">New · the e-book from Dolly’s jungle kitchen</p>
            <h1 className="se-hero__title">
              <span className="se-script">Sweet</span> treats your kids beg for, <em>made from plants.</em>
            </h1>
          </div>
          <div className="se-hero__body">
            <p className="se-hero__lead">
              <b>Sweet Escape</b> is seven vibrant plant-based desserts, one for each color of nature, and the
              secrets behind them. Silky creams, luscious caramel, chocolate mousse, cheesecake: indulgence and
              nourishment in the very same bite.
            </p>
            <div className="se-hero__cta">
              <BuyButton />
              <ul className="se-hero__ticks">
                <li>Instant PDF</li><li>{EBOOK.pages} pages</li><li>7-day promise</li>
              </ul>
            </div>
          </div>

          <div className="se-hero__stage" aria-hidden>
            <div className="se-book">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${IMG}/cover.webp`} alt="" />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="se-float se-float--a" src={`${IMG}/red.webp`} alt="" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="se-float se-float--b" src={`${IMG}/purple.webp`} alt="" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="se-float se-float--c" src={`${IMG}/green.webp`} alt="" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="se-float se-float--d" src={`${IMG}/chocolate.webp`} alt="" />
            <div className="se-hero__card">
              <b>7</b><span>colors · 7 recipes<br />one delicious escape</span>
            </div>
          </div>
        </div>
        <div className="se-rainbow" aria-hidden>{RECIPES.map(r => <i key={r.day} style={{ background: r.hex }} />)}</div>
      </section>

      {/* ══ THE PROBLEM ══ */}
      <section className="se-sec se-sec--cream">
        <div className="se-wrap se-narrow">
          <p className="se-kicker">Sound familiar?</p>
          <h2 className="se-h2">You want them to eat well. <br className="se-br" />They want dessert.</h2>
          <div className="se-pains">
            <p><span>🛒</span>You stand in the snack aisle, torn between the “healthy” bar that tastes like cardboard and the one you know you’ll regret.</p>
            <p><span>🥦</span>Every dinner turns into a negotiation over three pieces of broccoli.</p>
            <p><span>🍪</span>You’ve tried “healthy desserts”. Everyone was polite. Nobody asked for seconds.</p>
          </div>
          <p className="se-bigidea">
            Here’s the secret Dolly learned in her kitchen: <b>children don’t eat vegetables. They eat colors.</b>{' '}
            Make it pink with beetroot, green with spirulina, purple with sweet potato, and suddenly the plants are
            the treat.
          </p>
        </div>
      </section>

      {/* ══ THE SEVEN DAYS ══ */}
      <RainbowJourney />

      {/* ══ WHAT IT TEACHES ══ */}
      <section className="se-sec se-sec--cream">
        <div className="se-wrap">
          <div className="se-narrow se-center">
            <p className="se-kicker">Not just recipes</p>
            <h2 className="se-h2">Learn the magic behind them</h2>
            <p className="se-lead">
              “The magic lies not in memorizing recipes, but in understanding the <em>why</em> behind them.” Why do dates
              replace sugar so well? Why does almond flour make a treat soft <em>and</em> filling? Once you know the
              six building blocks, seven recipes become endless possibilities.
            </p>
          </div>
          <div className="se-blocks">
            {BLOCKS.map((b, n) => (
              <div key={b.title} className="se-block" style={{ '--c': RECIPES[n].hex } as React.CSSProperties}>
                <span className="se-block__icon" aria-hidden>{b.icon}</span>
                <h3>{b.title}</h3>
                <p>{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PEEK INSIDE ══ */}
      <section className="se-sec se-sec--peek">
        <div className="se-wrap">
          <div className="se-narrow se-center">
            <p className="se-kicker se-kicker--light">Peek inside</p>
            <h2 className="se-h2 se-h2--light">{EBOOK.pages} pages you’ll want to cook from</h2>
            <p className="se-lead se-lead--light">Tap any page to see it up close.</p>
          </div>
          <div className="se-pages">
            {PEEK.map((p, n) => (
              <div key={p.src} className="se-page" style={{ '--r': `${(n % 2 ? 1 : -1) * (1.5 + (n % 3))}deg` } as React.CSSProperties}>
                <ZoomableImage src={p.src} alt={p.alt} thumbWidth={640} loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FOR FAMILIES ══ */}
      <section className="se-sec se-sec--cream">
        <div className="se-wrap se-family">
          <div className="se-family__photos" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="se-family__a" src={`${IMG}/red-scatter.webp`} alt="" loading="lazy" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="se-family__b" src={`${IMG}/chocolate-cut.webp`} alt="" loading="lazy" />
          </div>
          <div>
            <p className="se-kicker">For parents</p>
            <h2 className="se-h2">Win them over with a treat, not a lecture</h2>
            <p className="se-lead">
              These are desserts that <em>seduce</em>. Chocolate turtles with pecan feet. Green ice-cream tacos. Pink
              jewels you roll together at the kitchen table. Your family falls in love with fruit, nuts and whole
              plants without ever being told it’s good for them.
            </p>
            <ul className="se-checks">
              <li>Swap the after-school cookie for something you’re proud to hand over</li>
              <li>Get the kids cooking: most recipes are blend, roll, press and freeze</li>
              <li>Birthday-worthy desserts, with no dairy, eggs or white sugar in the bowl</li>
              <li>Make a batch on Sunday and the freezer does the rest of the week</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ══ THE MATH ══ */}
      <section className="se-sec se-sec--math">
        <div className="se-wrap se-narrow se-center">
          <p className="se-kicker">Do the math</p>
          <h2 className="se-h2">One book. About {TOTAL_TREATS} treats.</h2>
          <div className="se-math">
            <div><b>{TOTAL_TREATS}</b><span>treats from one round of all 7 recipes</span></div>
            <div><b>{brl(bakeryValue)}</b><span>what they’d cost from our bakery at ~{brl(BAKERY_TREAT_PRICE_BRL)} each</span></div>
            <div className="is-hot"><b>{price}</b><span>for the book you can cook from forever</span></div>
          </div>
          <p className="se-small">Ingredients not included, of course. But you already know where the supermarket is.</p>
        </div>
      </section>

      {/* ══ DOLLY ══ */}
      <section className="se-sec se-sec--story">
        <div className="se-wrap se-story">
          <div className="se-story__photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/dolly/dolly-portrait.jpg" alt="Dolly holding a tray of her plant-based treats in the garden" loading="lazy" />
            <span className="se-story__tag">Dolly · The Tropical Bakery</span>
          </div>
          <div className="se-story__text">
            <p className="se-kicker">Meet Dolly</p>
            <h2 className="se-h2">From the ballet stage to a jungle kitchen</h2>
            <p>
              My relationship with food began in a world where discipline was everything: professional ballet. I learned
              to control every calorie, every bite, and it left me disconnected from the joy of food.
            </p>
            <p>
              Through love and loss, I rebuilt my life on the Brazilian coast, surrounded by the ocean, the rainforest,
              the sunlight and the abundance of Brazil. That is where food became creativity, nourishment became
              pleasure, and dessert became a celebration rather than a compromise.
            </p>
            <p>
              <i>Sweet Escape</i> is everything I learned, woven through seven recipes, so you can bring that same joy into your own kitchen.
            </p>
            <p className="se-sign">Come into my jungle kitchen. <span className="se-script">Dolly</span></p>
          </div>
        </div>
      </section>

      {/* ══ THE OFFER ══ */}
      <section className="se-sec se-sec--offer" id="buy">
        <div className="se-wrap se-offer">
          <div className="se-offer__stack">
            <p className="se-kicker se-kicker--light">Everything you get</p>
            <h2 className="se-h2 se-h2--light">Your sweet escape, today</h2>
            <ul className="se-stack">
              {STACK.map(s => (
                <li key={s.what} className={s.bonus ? 'is-bonus' : ''}>
                  <b>{s.what}</b>
                  <span>{s.detail}</span>
                </li>
              ))}
            </ul>
            <div className="se-guarantee">
              <span className="se-guarantee__seal" aria-hidden>7<small>days</small></span>
              <div>
                <b>The sweet promise</b>
                <p>Make one recipe. If it doesn’t win you over, write to us within 7 days and get every centavo back.</p>
              </div>
            </div>
          </div>

          <div className="se-card">
            <div className="se-card__head">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${IMG}/cover.webp`} alt="Sweet Escape e-book cover" />
              <div>
                <p className="se-card__title">Sweet Escape</p>
                <p className="se-card__price">{price}</p>
                <p className="se-card__usd">≈ US$ {EBOOK.priceUSDApprox} · one payment · PDF</p>
              </div>
            </div>
            <EbookBuyBox />
          </div>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section className="se-sec se-sec--cream">
        <div className="se-wrap se-narrow">
          <p className="se-kicker se-center">Questions</p>
          <h2 className="se-h2 se-center">Good to know</h2>
          <div className="se-faq">
            {FAQ.map(f => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CALL ══ */}
      <section className="se-final">
        <div className="se-final__photos" aria-hidden>
          {RECIPES.map(r => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={r.day} src={r.img} alt="" loading="lazy" style={{ borderColor: r.hex }} />
          ))}
        </div>
        <div className="se-wrap se-narrow se-center">
          <p className="se-final__line">Seven colors. Seven creations. Seven little reasons to fall in love with plants all over again.</p>
          <h2 className="se-final__title">Your <span className="se-script">sweet escape</span> is waiting.</h2>
          <BuyButton />
          <p className="se-ps">
            <b>P.S.</b> If you scrolled straight down here: it’s {EBOOK.pages} pages, 7 plant-based desserts your
            family will actually ask for, the framework to invent your own, and a 7-day promise. All for {price},
            less than two treats from our own bakery.
          </p>
        </div>
      </section>

      <MobileBuyBar kicker="Sweet Escape e-book" price={price} note="Instant PDF · 7 recipes" label="Get it" targetId="#buy" />
    </div>
  );
}

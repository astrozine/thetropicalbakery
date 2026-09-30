/**
 * Sweet Escape, Dolly's e-book: every fact the sales page, the server and the e-mails share.
 *
 * Pure data (no server imports) so the landing page can read it too. The PRICE is read by the
 * server from here when it creates the order, never from the browser. Change it here and nowhere else.
 */

export const EBOOK = {
  id: 'sweet-escape',
  title: 'Sweet Escape',
  /** What the order line, the inbox and the receipts call it. No commas (items_summary is split on them). */
  lineName: 'E-book Sweet Escape (PDF)',
  author: 'Dolly',
  priceBRL: 47,
  /** Rough, for visitors who think in dollars. Card and PayPal charge in reais and convert for them. */
  priceUSDApprox: 9,
  pages: 72,
  language: 'English',
  /** Private Supabase Storage bucket and file (migration_34). Uploaded by hand, see SETUP_ebook.md. */
  bucket: 'ebooks',
  file: 'sweet-escape.pdf',
  downloadName: 'Sweet Escape - The Tropical Bakery.pdf',
  pagePath: '/sweet-escape',
  thanksPath: '/sweet-escape/thank-you',
} as const;

/** One store price for a treat, used only to show what a batch would cost if bought ready-made. */
export const BAKERY_TREAT_PRICE_BRL = 25;

export interface EbookRecipe {
  day: number;
  color: string;
  hex: string;
  /** Text color that reads on `hex`. */
  ink: string;
  name: string;
  subtitle: string;
  hook: string;
  makes: string;
  makesCount: number;
  img: string;
  alt: string;
  /** How it wins over a child (or a sceptical partner). */
  kidAngle: string;
}

const IMG = '/ebook/sweet-escape';

export const RECIPES: EbookRecipe[] = [
  {
    day: 1, color: 'Yellow', hex: '#f7c600', ink: '#3b2a00',
    name: 'Sun-Kissed Coco-Pineapple Paradise Squares',
    subtitle: 'with turmeric-spiced coconut topping',
    hook: 'A silky pineapple-cashew cream on a date-almond base. Tastes like a beach holiday, sets in the freezer while you do something else.',
    makes: 'Serves 8', makesCount: 8,
    img: `${IMG}/yellow.webp`, alt: 'Layered pineapple coconut squares on a wooden stump',
    kidAngle: 'Looks like a slice of sunshine. Nobody asks where the vegetables are.',
  },
  {
    day: 2, color: 'Orange', hex: '#ff7a1a', ink: '#3d1a00',
    name: 'Chai-Spiced Mango Muffins',
    subtitle: 'with blood orange & carrot cashew cream whip',
    hook: 'Oat and almond muffins sweetened only with a date caramel, studded with ripe mango and topped with a whipped cream that hides a carrot.',
    makes: 'Makes 8–10', makesCount: 9,
    img: `${IMG}/orange.webp`, alt: 'Mango muffins with orange cashew cream and tropical flowers',
    kidAngle: 'A cupcake with a swirl on top. The carrot is our secret.',
  },
  {
    day: 3, color: 'Red', hex: '#e8364f', ink: '#fff',
    name: 'Tangy Red Berry Bliss Balls',
    subtitle: 'jewel-like treats with cherry, strawberry, cranberry & beet',
    hook: 'No oven, no mixer. Blend, roll, and coat in crunchy freeze-dried raspberry. The quickest recipe in the book and the one kids help make.',
    makes: 'Makes 12–14', makesCount: 13,
    img: `${IMG}/red.webp`, alt: 'Pink berry bliss balls with fresh cherries and strawberries',
    kidAngle: 'Small hands can roll them. Beetroot never looked this much like candy.',
  },
  {
    day: 4, color: 'Purple', hex: '#a33fc4', ink: '#fff',
    name: 'Purple Sweet Potato Longevity Cheesecake',
    subtitle: 'with forest dark berries & Blue Zones inspiration',
    hook: 'A walnut-cacao crust, a creamy purple layer made from sweet potato, and a pourable berry topping. The one that gets photographed.',
    makes: 'Serves 8–10', makesCount: 9,
    img: `${IMG}/purple.webp`, alt: 'Purple sweet potato cheesecake slice with a violet flower',
    kidAngle: 'It’s purple. That’s the whole argument, and it works.',
  },
  {
    day: 5, color: 'Green', hex: '#27b35a', ink: '#fff',
    name: 'Supergreen Laguna Nicecream Pistachio Tacos',
    subtitle: 'a joyful, melting, spirulina-powered treat',
    hook: 'Crunchy pistachio taco cookies filled with soft-serve made from frozen bananas. Ice cream, but it’s fruit.',
    makes: 'Makes 6–8', makesCount: 7,
    img: `${IMG}/green.webp`, alt: 'Green pistachio taco cookies filled with spirulina banana nicecream',
    kidAngle: 'Green ice cream in a taco. It disappears before it can melt.',
  },
  {
    day: 6, color: 'Caramel', hex: '#c9853c', ink: '#2e1800',
    name: 'Peanutty Banoffee Bars',
    subtitle: 'a raw three-layer treat bridging Brazil and Britain',
    hook: 'A paçoca-style peanut base, a banana-cashew cream, and a runny caramel made from nothing but dates. The cover star.',
    makes: 'Makes 8–10', makesCount: 9,
    img: `${IMG}/caramel.webp`, alt: 'Banoffee bars with date caramel drizzle on a green plate',
    kidAngle: 'Peanut butter and caramel. You won’t have to ask twice.',
  },
  {
    day: 7, color: 'Chocolate', hex: '#5a3421', ink: '#fff',
    name: 'Dark Cocoa Mousse Turtles',
    subtitle: 'a velvet-dark ode to chocolate, with a surprising pear',
    hook: 'A pecan-cocoa base, a mousse whipped from a ripe pear, and a glossy chocolate shell. Pecan halves become little heads and feet.',
    makes: 'Makes 6–8', makesCount: 7,
    img: `${IMG}/chocolate.webp`, alt: 'Chocolate mousse turtles with pecan heads and feet',
    kidAngle: 'They’re turtles. Made of chocolate. With a pear hiding inside.',
  },
];

/** Everything a single run through the book makes. */
export const TOTAL_TREATS = RECIPES.reduce((n, r) => n + r.makesCount, 0);

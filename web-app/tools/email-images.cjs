// Makes the small, e-mail-sized copies of site photos that the e-mail templates use (public/email/).
// E-mail clients download every image on open, so they must be light: heroes 1200x600, tiles 400x400.
// Also draws the Belgium + Brazil flag "stamps" as a PNG, because Gmail and Outlook do not show SVG.
//
//   node tools/email-images.cjs        (then commit public/email/)
const path = require('path');
const fs = require('fs');
const sharp = require(path.resolve(__dirname, '../node_modules/sharp'));

const PUB = path.resolve(__dirname, '../public');
const OUT = path.join(PUB, 'email');
fs.mkdirSync(OUT, { recursive: true });

const HEROES = {
  'hero-caixa': 'box2.jpg',
  'hero-assinatura': 'box4.jpg',
  'hero-eventos': 'event_hero.jpg',
  'hero-cursos': 'assets/chef_training_1789884593538.jpg',
  'hero-retiros': 'retreats/real-itamambuca-coast.jpg',
  'hero-parcerias': 'assets/realistic_hotel.jpg',
  'hero-equipe': 'assets/realistic_bakery.jpg',
  'hero-novidades': 'hero.jpg',
};

const TILES = {
  'tile-pitaya': 'menu-items/Screenshot_20260415_110305_Gallery.jpg',
  'tile-bundt': 'menu-items/1000215018.jpg',
  'tile-berry': 'berry.jpg',
  'tile-mango': 'mango.jpg',
  'tile-truffles': 'b2b-hero/treat-5.jpg',
  'tile-caramel': 'menu-items/20260209_172647.jpg',
  'tile-pecan': 'b2b-hero/treat-3.jpg',
  'tile-glasses': 'b2b-hero/treat-0.jpg',
  'tile-event-night': 'assets/tropical_event_evening.jpg',
  'tile-table': 'hero.jpg',
  'tile-nuts': 'dolly-course1.jpg',
  'tile-bakery': 'assets/realistic_bakery.jpg',
  'tile-chef': 'assets/chef_training_1789884593538.jpg',
  'tile-island': 'retreats/real-prumirim-island.jpg',
  'tile-waterfall': 'retreats/prumirim-woman.jpg',
  'tile-surf': 'retreats/Surfer girl.webp',
  'tile-tray': 'assets/airbnb_breakfast_tray_1789884624300.jpg',
  'tile-pousada': 'assets/glamorous_pousada_1789884603550.jpg',
  'tile-box': 'box2.jpg',
};

const FLAGS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="132" height="72" viewBox="0 0 66 36">
  <defs><filter id="s" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="1" stdDeviation="0.9" flood-color="#000" flood-opacity="0.35"/></filter></defs>
  <g transform="rotate(-6 18 18)" filter="url(#s)">
    <rect x="3" y="7" width="31" height="21" rx="3" fill="#fff"/>
    <rect x="4" y="8" width="9.67" height="19" fill="#1a1a1a"/><rect x="13.67" y="8" width="9.67" height="19" fill="#FDDA24"/><rect x="23.33" y="8" width="9.67" height="19" fill="#EF3340"/>
  </g>
  <g transform="rotate(5 44 18)" filter="url(#s)">
    <rect x="28" y="7" width="31" height="21" rx="3" fill="#fff"/>
    <rect x="29" y="8" width="29" height="19" fill="#009C3B"/>
    <polygon points="43.5,10 56,17.5 43.5,25 31,17.5" fill="#FFDF00"/>
    <circle cx="43.5" cy="17.5" r="4.4" fill="#002776"/>
    <path d="M39.3 16.6 Q43.5 15.2 47.7 17.9" stroke="#fff" stroke-width="0.85" fill="none"/>
  </g>
</svg>`;

(async () => {
  for (const [name, src] of Object.entries(HEROES)) {
    await sharp(path.join(PUB, src)).rotate().resize(1200, 600, { fit: 'cover', position: 'attention' })
      .jpeg({ quality: 70, mozjpeg: true, progressive: true }).toFile(path.join(OUT, `${name}.jpg`));
  }
  for (const [name, src] of Object.entries(TILES)) {
    await sharp(path.join(PUB, src)).rotate().resize(400, 400, { fit: 'cover', position: 'attention' })
      .jpeg({ quality: 70, mozjpeg: true, progressive: true }).toFile(path.join(OUT, `${name}.jpg`));
  }
  await sharp(path.join(PUB, 'hero-logo-transparent.png')).resize(240).png({ compressionLevel: 9, palette: true, quality: 90 })
    .toFile(path.join(OUT, 'logo-pineapple.png'));
  await sharp(Buffer.from(FLAGS_SVG), { density: 288 }).resize(132, 72).png({ compressionLevel: 9 })
    .toFile(path.join(OUT, 'flags.png'));
  const total = fs.readdirSync(OUT).reduce((s, f) => s + fs.statSync(path.join(OUT, f)).size, 0);
  console.log(`public/email: ${fs.readdirSync(OUT).length} files, ${(total / 1024).toFixed(0)} KB`);
})();

// Shrinks the photos in public/ in place, so pages load fast on a phone over 4G.
// Most of the site shows them with a plain <img> or a CSS background, which serves the file as it is,
// so the file on disk is what the visitor downloads.
//
// Keeps every file name and format (pages and database rows point at these paths), fits each photo
// inside 1600x1600, re-encodes it (JPEG q74 mozjpeg, WebP q72, PNG as a 256-colour palette with
// dithering) and only writes the result when it saves at least 15%. Running it again is harmless.
//
//   node tools/optimize-images.cjs           report what it would save, change nothing
//   node tools/optimize-images.cjs --write   rewrite the files
const path = require('path');
const fs = require('fs');
const sharp = require(path.resolve(__dirname, '../node_modules/sharp'));

const PUB = path.resolve(__dirname, '../public');
const SKIP_DIRS = new Set(['email']); // already e-mail sized by tools/email-images.cjs
const MAX = 1600;
const MIN_BYTES = 60 * 1024;
const MIN_SAVING = 0.15;
const write = process.argv.includes('--write');
sharp.cache(false); // sharp keeps input files open otherwise, and Windows/Dropbox then refuses the write

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) yield* walk(p); }
    else if (/\.(jpe?g|png|webp)$/i.test(e.name)) yield p;
  }
}

async function encode(file) {
  const ext = path.extname(file).toLowerCase();
  const img = sharp(fs.readFileSync(file), { animated: false }).rotate().resize(MAX, MAX, { fit: 'inside', withoutEnlargement: true });
  if (ext === '.png') return img.png({ palette: true, quality: 82, effort: 10, dither: 1, compressionLevel: 9 }).toBuffer();
  if (ext === '.webp') return img.webp({ quality: 72, effort: 6, smartSubsample: true }).toBuffer();
  return img.jpeg({ quality: 74, mozjpeg: true, progressive: true }).toBuffer();
}

// Dropbox briefly locks files it is syncing: try a few times before giving up.
async function save(file, buf) {
  for (let i = 0; ; i++) {
    try { return fs.writeFileSync(file, buf); }
    catch (err) { if (i >= 5) throw err; await new Promise(r => setTimeout(r, 1000)); }
  }
}

(async () => {
  let before = 0, after = 0, changed = 0;
  for (const file of walk(PUB)) {
    const size = fs.statSync(file).size;
    before += size;
    if (size < MIN_BYTES) { after += size; continue; }
    let out;
    try { out = await encode(file); } catch (err) { console.log(`skip  ${path.relative(PUB, file)} (${err.message})`); after += size; continue; }
    if (out.length > size * (1 - MIN_SAVING)) { after += size; continue; }
    after += out.length;
    changed++;
    console.log(`${(size / 1024).toFixed(0).padStart(6)} KB -> ${(out.length / 1024).toFixed(0).padStart(5)} KB  ${path.relative(PUB, file)}`);
    if (write) await save(file, out);
  }
  const mb = n => (n / 1048576).toFixed(1);
  console.log(`\n${changed} files ${write ? 'rewritten' : 'would shrink'}: ${mb(before)} MB -> ${mb(after)} MB`);
})();

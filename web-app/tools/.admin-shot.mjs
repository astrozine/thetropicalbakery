// TEMPORARY local harness (not committed): opens the real admin shell with a fake session and a stubbed is_admin,
// then reports whether the page needs scrolling and where the footer sits.
//   node tools/.admin-shot.mjs <path> <out.png> [width=1440] [height=900] [tall]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const { default: puppeteer } = await import('puppeteer-core');

const [, , routeArg = 'admin/administradores', out = 'admin.png', w = '1440', h = '900', tall] = process.argv;
const route = '/' + routeArg.replace(/^.*Program Files\/Git/, '').replace(/^\/+/, '');
const exe = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const udd = fs.mkdtempSync(path.join(os.tmpdir(), 'tb-admin-'));
const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--no-first-run', '--disable-gpu'], userDataDir: udd });
try {
  const page = await browser.newPage();
  const mobile = +w < 768;
  await page.setViewport({ width: +w, height: +h, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });

  const session = {
    access_token: 'fake.jwt.token', token_type: 'bearer', expires_in: 36000, expires_at: Math.floor(Date.now() / 1000) + 36000,
    refresh_token: 'fake-refresh',
    user: { id: '00000000-0000-0000-0000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'audit@example.invalid', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() },
  };
  await page.evaluateOnNewDocument(s => {
    localStorage.setItem('sb-ghmzsxaesegxmtxzdrlx-auth-token', JSON.stringify(s));
  }, session);

  await page.setRequestInterception(true);
  page.on('request', req => {
    const u = req.url();
    if (u.includes('supabase.co') && req.method() === 'OPTIONS') {
      return req.respond({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    }
    if (u.includes('/rest/v1/rpc/is_admin')) return req.respond({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: 'true' });
    // Anything else for the fake user: answer empty, never touch the real database with a bogus token.
    if (u.includes('supabase.co/auth/v1/')) return req.respond({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{}' });
    if (u.includes('supabase.co/rest/v1/')) {
      const head = req.method() === 'HEAD';
      return req.respond({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'content-range': '*/0' }, body: head ? '' : '[]' });
    }
    req.continue();
  });

  await page.goto('http://localhost:3000' + route, { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise(r => setTimeout(r, 1500));
  if (tall) {
    await page.evaluate(() => {
      const main = document.querySelector('body > main > div > main') || document.querySelector('main main') || document.querySelector('main');
      const pad = document.createElement('div');
      pad.style.cssText = 'height:2200px;background:repeating-linear-gradient(#fff,#fff 40px,#eef 40px,#eef 80px)';
      pad.textContent = 'TALL TEST CONTENT';
      main.appendChild(pad);
    });
    await new Promise(r => setTimeout(r, 300));
  }

  if (process.env.SCROLL) { await page.evaluate(() => window.scrollTo(0, 1e6)); await new Promise(r => setTimeout(r, 400)); }
  const m = await page.evaluate(() => {
    const de = document.documentElement;
    const foot = document.querySelector('footer');
    const fr = foot ? foot.getBoundingClientRect() : null;
    return {
      viewport: window.innerHeight,
      pageHeight: de.scrollHeight,
      scrollsBy: de.scrollHeight - window.innerHeight,
      hasSidebar: !!document.querySelector('aside'),
      footer: fr ? { top: Math.round(fr.top + window.scrollY), height: Math.round(fr.height), bottomOfPage: Math.round(fr.bottom + window.scrollY), text: foot.innerText.replace(/\s+/g, ' ').slice(0, 120) } : null,
      sidewaysScroll: de.scrollWidth > window.innerWidth + 1,
    };
  });
  console.log(JSON.stringify(m, null, 1));
  await page.screenshot({ path: out });
  console.log('saved', out);
} finally {
  await browser.close();
  fs.rmSync(udd, { recursive: true, force: true });
}

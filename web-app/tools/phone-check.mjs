// Phone-size checks for the site. See COORDINATION.md section 3.
//
//   npm i --no-save puppeteer-core      (once; do not commit the package.json change)
//   node tools/phone-check.mjs shot  <url> <out.png> [width=412] [height=915] [full]
//   node tools/phone-check.mjs audit <baseUrl> [retreats,caixas,...]
//        (write paths WITHOUT a leading slash on Windows Git Bash, which rewrites "/x" into a Windows path)
//
// It drives your installed Chrome or Edge with real mobile emulation (touch, mobile viewport, phone user
// agent). A browser window dragged narrow is NOT the same thing, and hides layouts that break on a phone.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const { default: puppeteer } = await import('puppeteer-core').catch(() => {
  console.error('Run once: npm i --no-save puppeteer-core');
  process.exit(1);
});

const CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].filter(Boolean);
const executablePath = CANDIDATES.find(p => fs.existsSync(p));
if (!executablePath) { console.error('No Chrome or Edge found. Set CHROME_PATH.'); process.exit(1); }

const UA = 'Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tb-phone-'));
const launch = () => puppeteer.launch({ executablePath, headless: 'new', args: ['--no-first-run', '--disable-gpu'], userDataDir });

/** Opens a page with phone emulation and records whether it really loaded (an error page must not count as "fits"). */
async function open(browser, url, w, h) {
  const page = await browser.newPage();
  await page.setUserAgent(UA);
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const resp = await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 }).catch(() => null);
  await new Promise(r => setTimeout(r, 1500));
  page.loadedOk = !!resp && resp.status() < 400;   // 304 (cached) is a successful load too
  page.loadStatus = resp ? resp.status() : 'no response';
  return page;
}

// Git Bash on Windows turns "/retreats" into "C:/Program Files/Git/retreats"; undo that and make the slash optional.
const normPath = p => '/' + p.replace(/^.*Program Files\/Git/, '').replace(/^\/+/, '');

const [, , mode, a1, a2, a3, a4, a5] = process.argv;
const browser = await launch();

try {
  if (mode === 'shot') {
    const [url, out, w = '412', h = '915', full] = [a1, a2, a3, a4, a5];
    const page = await open(browser, url, +w, +h);
    if (!page.loadedOk) {
      console.error(`Page did not load (${page.loadStatus}). Is the dev server running? Not saving a screenshot of an error page.`);
      process.exitCode = 1;
    } else {
      // Scroll through once so lazy images and reveal animations fire, then come back to the top.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 100)); }
        window.scrollTo(0, 0);
      });
      await new Promise(r => setTimeout(r, 600));
      await page.screenshot({ path: out, fullPage: full === 'full' });
      console.log('saved', out);
    }
  } else if (mode === 'audit') {
    const base = (a1 || 'http://localhost:3000').replace(/\/$/, '');
    const paths = a2
      ? a2.split(',').map(normPath)
      : ['/', '/caixas', '/assinatura', '/cursos', '/cursos/turismo-gastronomico', '/menu', '/retreats', '/checkout', '/b2b/hotels', '/minha-conta', '/trabalhe-conosco', '/privacidade'];
    let problems = 0;
    for (const p of paths) {
      const cells = [];
      for (const [w, h] of [[360, 740], [390, 844], [412, 915]]) {
        const page = await open(browser, base + p, w, h);
        if (!page.loadedOk) {
          await page.close();
          problems++;
          cells.push(`${w}px: COULD NOT LOAD (${page.loadStatus})`);
          continue;
        }
        const r = await page.evaluate(() => {
          let tiny = 0;
          for (const el of document.querySelectorAll('p,span,li,a,button,label,small')) {
            const fs = parseFloat(getComputedStyle(el).fontSize);
            if (fs && fs < 11.5 && el.textContent.trim().length > 2 && el.offsetParent) tiny++;
          }
          return { iw: window.innerWidth, sw: document.documentElement.scrollWidth, tiny };
        });
        await page.close();
        const wide = r.sw > w + 1;
        if (wide) problems++;
        cells.push(`${w}px: ${wide ? `SIDEWAYS SCROLL (page is ${r.sw}px)` : 'fits'}${r.tiny ? `, ${r.tiny} tiny text` : ''}`);
      }
      console.log(p.padEnd(34), cells.join(' | '));
    }
    console.log(problems
      ? `\n${problems} problem(s). "COULD NOT LOAD" means the server is not answering; "SIDEWAYS SCROLL" means an element is wider than the screen.`
      : '\nEvery page loaded and none scrolls sideways.');
    if (problems) process.exitCode = 1;
  } else {
    console.log('usage: shot <url> <out.png> [w] [h] [full]  |  audit <baseUrl> [path,path]');
  }
} finally {
  await browser.close();
  fs.rmSync(userDataDir, { recursive: true, force: true });
}

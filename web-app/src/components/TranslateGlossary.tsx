'use client';

import { useEffect } from 'react';
import { readTranslateLang } from '@/lib/useTranslateLang';

/*
 * Fixes the words Google Translate gets wrong about where we live (Andrew, 2026-11-17).
 *
 * Most pages are written in Portuguese and Google translates them on the fly. It turns "Mata Atlântica" into an
 * invented "Atlantic Forest" / "Atlantisch Woud" / "Atlantischer Regenwald", "mata" into "forest" and "mar" into
 * "sea". Andrew's rule: it's a jungle and an ocean, and a Portuguese name stays Portuguese, in quotes
 * ("Mata Atlântica"), instead of a made-up translation. Pages we wrote by hand already say it that way.
 *
 * After Google has translated, this walks the translated text and swaps those words, per language. Text inside
 * .notranslate / translate="no" (our own hand-written lines) is left alone. Long translated words also get
 * permission to wrap, so a heading like "Mouthwatering" can't push out of its column on a phone.
 */

type Rule = [RegExp, string | ((m: string) => string)];

// Quotes as each language writes them.
const MA = { en: '“Mata Atlântica”', es: '“Mata Atlântica”', nl: '“Mata Atlântica”', de: '„Mata Atlântica“', fr: '« Mata Atlântica »', it: '«Mata Atlântica»' };
const notQuoted = '(?<![“"„«] ?)';

const RULES: Record<string, Rule[]> = {
  en: [
    [/\bAtlantic (?:Rain ?forest|Rainforest|Forest|forest)\b/g, `${MA.en} jungle`],
    [new RegExp(`${notQuoted}\\bMata Atl[aâá]ntica\\b(?![”"])`, 'g'), `${MA.en} jungle`],
    [/\b(?:rain)?forest\b(?! (?:fruit|berr))/g, 'jungle'],
    [/\b(?:Rain)?[Ff]orest\b(?! (?:fruit|berr))/g, 'Jungle'],
    [/\bthe woods\b/g, 'the jungle'],
    [/\bsea\b/g, 'ocean'],
    [/\bSea\b/g, 'Ocean'],
  ],
  es: [
    [/\b(?:Bosque|bosque|Selva|selva) [Aa]tl[aá]ntic[oa]\b/g, `selva de la ${MA.es}`],
    [new RegExp(`${notQuoted}\\bMata Atl[aâá]ntica\\b(?![”"])`, 'g'), MA.es],
    // "frutos del bosque" (berries) stays; otherwise a bosque is the selva (feminine, so the article changes too).
    [/(?<!frutos )\bdel bosque\b/g, 'de la selva'],
    [/(?<!frutos )\b(?:el|un) bosque\b/g, (m: string) => (m.startsWith('un') ? 'una selva' : 'la selva')],
    [/(?<!frutos del |el |un )\bbosque\b/g, 'selva'],
    [/\b(el|al|del) mar\b/g, '$1 océano'],
    [/\b(El|Al|Del) mar\b/g, '$1 océano'],
  ],
  nl: [
    [/\b(?:het )?Atlantische? (?:[Rr]egen)?(?:[Ww]oud|[Bb]os)\b/g, `de jungle van de ${MA.nl}`],
    [new RegExp(`${notQuoted}\\bMata Atl[aâá]ntica\\b(?![”"])`, 'g'), MA.nl],
    [/\bhet (?:regen)?(?:bos|woud)\b/g, 'de jungle'],
    [/\b(?:regen)?woud\b/g, 'jungle'],
    [/\baan zee\b/g, 'aan de oceaan'],
    [/\bzee\b/g, 'oceaan'],
    [/\bZee\b/g, 'Oceaan'],
  ],
  de: [
    [/\b[Aa]tlantische[nrms]? (?:Regen)?[Ww]ald(?:e?s)?\b/g, `Dschungel der ${MA.de}`],
    [new RegExp(`${notQuoted}\\bMata Atl[aâá]ntica\\b(?![“"])`, 'g'), MA.de],
    [/\bRegenwald(?:e?s)?\b/g, 'Dschungel'],
    [/\bdas Meer\b/g, 'der Ozean'],
    [/\bDas Meer\b/g, 'Der Ozean'],
    [/\bans Meer\b/g, 'an den Ozean'],
    [/\bins Meer\b/g, 'in den Ozean'],
    [/\bMeeres\b/g, 'Ozeans'],
    [/\bMeer\b/g, 'Ozean'],
  ],
  fr: [
    [/\b(?:la )?[Ff]or[êe]t [Aa]tlantique\b/g, `la jungle de la ${MA.fr}`],
    [new RegExp(`${notQuoted}\\bMata Atl[aâá]ntica\\b(?! ?[»"])`, 'g'), MA.fr],
  ],
  it: [
    [/\b(?:la )?[Ff]oresta [Aa]tlantica\b/g, `la giungla della ${MA.it}`],
    [new RegExp(`${notQuoted}\\bMata Atl[aâá]ntica\\b(?![»"])`, 'g'), MA.it],
  ],
};

const CSS = `
html.translated-ltr h1, html.translated-ltr h2, html.translated-ltr h3 { overflow-wrap: anywhere; }
`;

function fixText(root: Node, rules: Rule[]) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    const v = n.nodeValue;
    if (!v || v.trim().length < 3) continue;
    const parent = n.parentElement;
    if (!parent || parent.closest('.notranslate, [translate="no"], script, style, textarea, input')) continue;
    let out = v;
    for (const [re, to] of rules) out = typeof to === 'string' ? out.replace(re, to) : out.replace(re, to);
    if (out !== v) n.nodeValue = out;
  }
}

export default function TranslateGlossary() {
  useEffect(() => {
    let frame = 0;
    const run = () => {
      frame = 0;
      if (!/\btranslated-(ltr|rtl)\b/.test(document.documentElement.className)) return;
      const rules = RULES[readTranslateLang()];
      if (rules) fixText(document.body, rules);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(run); };
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
    const moHtml = new MutationObserver(schedule);
    moHtml.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'lang'] });
    schedule();
    return () => { mo.disconnect(); moHtml.disconnect(); if (frame) cancelAnimationFrame(frame); };
  }, []);
  return <style>{CSS}</style>;
}

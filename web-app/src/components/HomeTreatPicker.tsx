'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import TreatPicker, { PickableTreat } from './TreatPicker';

/**
 * The phone entrance to the whole site.
 *
 * The home page used to open with a logo and 118 characters of text, and the
 * first thing you could actually do sat six screens down. This puts food on the
 * first screen and gives a thumb something to do straight away — and the tapping
 * is the point: it is the one thing on this site that people enjoy on a phone.
 *
 * Whatever they pick is carried to the page that can act on it, so the picking
 * is never wasted: one or two treats reads as "I want a box", a longer list
 * reads as "I am planning something", which is the events menu.
 */
export default function HomeTreatPicker() {
  const router = useRouter();

  const go = (chosen: PickableTreat[]) => {
    try {
      sessionStorage.setItem('tb_picked', JSON.stringify(chosen.map(t => t.name)));
    } catch { /* private browsing — the routing below still works */ }
    router.push(chosen.length >= 5 ? '/menu' : '/caixas');
  };

  return (
    <div className="mobile-only" style={{ padding: '0 1rem 1.5rem' }}>
      <TreatPicker
        hero
        title="O que te deu vontade?"
        subtitle="Toque nos doces que te chamaram. A gente te leva para o lugar certo."
        initial={6}
        ctaLabel="Continuar"
        onAction={go}
      />
    </div>
  );
}

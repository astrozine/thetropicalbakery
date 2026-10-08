import React from 'react';
import type { Metadata } from 'next';
import B2BPageLayout from '@/components/B2BPageLayout';
import { BoatCopy, BoatDetails, BoatForWho, BoatHeroExtra } from '@/components/BoatPartnerSections';

// The English twin of /b2b/barcos. Same numbers to confirm with Andrew (R$249, 10–15%, 48 h): change both pages.

export const metadata: Metadata = {
  title: 'On-Board Kit for Boats, Charters and Marinas | The Tropical Bakery',
  description: 'Fine vegan, wheat-free sweets by Belgian chef Dolly, delivered to the pier before departure. Partnerships for charters, marinas and agencies in Ubatuba and Paraty.',
  alternates: { languages: { 'pt-BR': '/b2b/barcos', en: '/en/b2b/boats' } },
  openGraph: { locale: 'en_US' },
};

const copy: BoatCopy = {
  forWhoTitle: "Who it's for",
  forWho: [
    { icon: '⛵', text: 'Boat, yacht and sailboat charter companies' },
    { icon: '⚓', text: 'Marinas and their boat owners' },
    { icon: '🧭', text: 'Agencies selling private boat trips' },
  ],
  whyTitle: 'Why partner with us',
  why: [
    '10% to 15% commission on every referred order',
    'No stock, no work: we deliver straight to the pier',
    'A luxury extra that raises the value of the trip',
    'Options for vegan and wheat-free guests, with the sugar in every treat spelled out',
  ],
  whereTitle: 'Where we deliver',
  places: [
    { name: 'Ubatuba', text: 'Saco da Ribeira and other piers in the area' },
    { name: 'Paraty', text: 'Marina do Engenho, Marina Farol de Paraty and Paraty pier' },
  ],
  rules: [
    'Order at least 48 hours ahead',
    'Paraty: minimum 10 boxes per delivery',
  ],
  howTitle: 'How it works',
  steps: [
    'Fill in the 2-minute form',
    'Dolly calls you on WhatsApp to agree the details',
    'You get access to the partner portal to order and track your commissions',
  ],
  photoAlt: 'Three friends laughing on board a sailboat, tasting sweets from a The Tropical Bakery kraft box',
  note: 'None of our recipes contain gluten, but the kitchen is not certified, so traces are possible. Sweets with vegan chocolate are marked.',
};

export default function BoatsPage() {
  return (
    // translate="no": this page is already English; stops Google Translate (set up for Portuguese pages) re-translating it.
    <div translate="no">
      <B2BPageLayout
        locale="en"
        partnerKind="barco"
        eyebrow="Partnerships for Boats & Marinas"
        title="An on-board gift your guests will remember"
        intro="Fine sweets by Belgian chef Dolly Van Dam, 100% plant-based and wheat-free, delivered to the pier before departure in a kraft gift box."
        heroScene="/assets/boat_deck_box.jpg"
        heroPortrait
        heroExtra={<BoatHeroExtra c={copy} />}
        heroTreats={['/box1.jpg', '/box2.jpg']}
        regionNote="Ubatuba (Saco da Ribeira) and Paraty"
        applyCta="Become a partner"
        optionsHeading="What we offer"
        beforeOptions={<BoatForWho c={copy} />}
        options={[
          {
            icon: '🎁',
            title: 'On-Board Kit',
            description: "A box of 8 of this week's sweets, gift-wrapped and delivered to the pier in a cooler with ice packs: on board, keep it in the cooler until serving time. Perfect for birthdays, proposals, honeymoons and special groups.",
            note: 'Suggested guest price: from R$249',
          },
          {
            icon: '🌙',
            title: 'Welcome boxes for multi-day trips',
            description: 'Delivered frozen to the marina before departure. In the on-board freezer they last the whole trip; the crew takes them out about 10 minutes before serving.',
          },
          {
            icon: '🥂',
            title: 'Celebrations on board',
            description: 'Dessert tables and larger orders for events on the boat or at the marina.',
            link: { href: '/menu', label: 'See the Events Menu' },
          },
        ]}
        whyChooseUs={[]}
        whatsappHref="https://wa.me/5511932119196?text=Hello%2C%20I%27m%20interested%20in%20a%20partnership%20for%20boats%20and%20marinas!"
        galleryImages={['/box1.jpg', '/box2.jpg', '/box3.jpg', '/box4.jpg', '/menu-items/1000215018.jpg', '/menu-items/20250914_132214.jpg']}
      >
        <BoatDetails c={copy} />
      </B2BPageLayout>
    </div>
  );
}

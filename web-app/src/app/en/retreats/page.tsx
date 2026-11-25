import React from 'react';
import RetreatsLayout from '@/components/RetreatsLayout';

export default function RetreatsPage() {
  const englishTexts = {
    whatsappMessage: 'Hello! I would like to know more about staying with you in Itamambuca.',
    hero: {
      location: 'Itamambuca · Ubatuba · Brazil',
      title: <>Live a few days<br />in our home</>,
      description: 'Stay with us in Itamambuca, eat at our table and go home knowing how to eat this way, with pleasure and feeling satisfied. On your own, as a couple or with the whole family.',
      cta: 'I want to come',
    },
    suites: {
      subtitle: 'Where you stay',
      title: 'Three rooms, or the whole house',
      description: 'Our home, Salt n’ Paradise, 100 m from the beach. Pick the room that fits you or your family.',
      penthouse: {
        capacity: 'Up to 6 guests',
        title: 'Penthouse',
        description: 'Spacious suite with panoramic views, perfect for groups and families.',
        cta: 'View on Airbnb',
      },
      bigSuite: {
        capacity: 'Up to 3 guests',
        title: 'Master Suite',
        description: 'Comfort and privacy with wooden details and tropical design.',
        cta: 'View on Airbnb',
      },
      smallSuite: {
        capacity: 'Up to 2 guests',
        title: 'Standard Suite',
        description: 'Cozy and intimate, ideal for couples or solo travelers.',
        cta: 'View on Airbnb',
      },
    },
  };

  return <RetreatsLayout texts={englishTexts} locale="en" />;
}

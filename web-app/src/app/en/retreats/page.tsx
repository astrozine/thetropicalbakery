import React from 'react';
import RetreatsLayout from '@/components/RetreatsLayout';

export default function RetreatsPage() {
  const englishTexts = {
    whatsappMessage: 'Hello! I would like to know more about The Tropical Bakery Retreats.',
    hero: {
      location: 'Itamambuca · Ubatuba · Brazil',
      title: <>Culinary & Wellness<br />Retreats</>,
      description: 'An immersive journey for women in Itamambuca. Discover the secrets of healthy baking while relaxing surrounded by nature.',
      cta: 'Book Your Retreat',
    },
    experience: {
      subtitle: 'The Experience',
      title: 'Reconnect with Nature and Food',
      description: 'Our retreats are designed to reconnect you with food in a healing and delicious way. You will learn hands-on how to prepare luxurious desserts that nourish the body.',
      bullets: [
        'Healthy baking workshops',
        'Morning Yoga sessions on the beach',
        'Luxury accommodation in Itamambuca',
        'Take amazing skills back to your family'
      ],
    },
    foodHero: {
      title: 'The Tropical Bakery Signature Creations',
      subtitle: '100% Vegan · Gluten-Free · SOS-Free · Made with fresh tropical ingredients',
    },
    suites: {
      subtitle: 'Salt n\' Paradise',
      title: 'Our Suites',
      description: 'Stay in our beautiful house just steps from the beach. Suites with tropical and sustainable design, absolute comfort.',
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
    finalCta: {
      subtitle: 'Limited Spots',
      title: 'Begin Your Journey',
      description: 'Get in touch to reserve your spot at the next retreat. Limited availability to ensure an intimate and transformative experience.',
      cta: 'Book via WhatsApp',
    },
  };

  return <RetreatsLayout texts={englishTexts} locale="en" />;
}

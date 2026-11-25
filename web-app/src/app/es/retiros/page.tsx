import React from 'react';
import RetreatsLayout from '@/components/RetreatsLayout';

export default function RetirosSpanishPage() {
  const spanishTexts = {
    whatsappMessage: '¡Hola! Quiero saber más sobre quedarme con ustedes en Itamambuca.',
    hero: {
      location: 'Itamambuca · Ubatuba · Brasil',
      title: <>Vive unos días<br />en nuestra casa</>,
      description: 'Quédate con nosotros en Itamambuca, come en nuestra mesa y vuelve a casa sabiendo comer así, con placer y satisfecho. Solo, en pareja o con toda la familia.',
      cta: 'Quiero ir',
    },
    suites: {
      subtitle: 'Dónde te quedas',
      title: 'Tres habitaciones, o la casa entera',
      description: 'Nuestra casa, Salt n’ Paradise, a 100 m de la playa. Elige la habitación que va contigo o con tu familia.',
      penthouse: {
        capacity: 'Hasta 6 personas',
        title: 'Ático (Penthouse)',
        description: 'Suite espaciosa con vista panorámica, perfecta para grupos y familias.',
        cta: 'Ver en Airbnb',
      },
      bigSuite: {
        capacity: 'Hasta 3 personas',
        title: 'Suite Master',
        description: 'Comodidad y privacidad con detalles en madera y diseño tropical.',
        cta: 'Ver en Airbnb',
      },
      smallSuite: {
        capacity: 'Hasta 2 personas',
        title: 'Suite Estándar',
        description: 'Acogedora e íntima, ideal para parejas o viajeros solos.',
        cta: 'Ver en Airbnb',
      },
    },
  };

  return <RetreatsLayout texts={spanishTexts} locale="es" />;
}

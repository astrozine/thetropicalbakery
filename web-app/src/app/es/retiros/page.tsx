import React from 'react';
import RetreatsLayout from '@/components/RetreatsLayout';

export default function RetirosSpanishPage() {
  const spanishTexts = {
    whatsappMessage: '¡Hola! Me gustaría saber más sobre los Retiros de Tropical Bakery.',
    hero: {
      location: 'Itamambuca · Ubatuba · Brasil',
      title: <>Retiros de Cocina<br />y Bienestar</>,
      description: 'Un viaje inmersivo para mujeres en Itamambuca. Descubre los secretos de la pastelería saludable mientras te relajas en medio de la naturaleza.',
      cta: 'Reserva tu Retiro',
    },
    experience: {
      subtitle: 'La Experiência',
      title: 'Reconecta con la Naturaleza y la Comida',
      description: 'Nuestros retiros están diseñados para reconectarte con la comida de una manera curativa y deliciosa. Aprenderás de forma práctica cómo preparar postres lujosos que nutren el cuerpo.',
      bullets: [
        'Talleres de pastelería saludable',
        'Sesiones matutinas de Yoga en la playa',
        'Alojamiento de lujo en Itamambuca',
        'Lleva habilidades increíbles para tu familia'
      ],
    },
    foodHero: {
      title: 'Creaciones Exclusivas The Tropical Bakery',
      subtitle: '100% Vegano · Sin Gluten · Sin SOS · Hecho con ingredientes tropicales frescos',
    },
    suites: {
      subtitle: 'Salt n\' Paradise',
      title: 'Nuestras Suites',
      description: 'Alójate en nuestra hermosa casa a pocos pasos de la playa. Suites con diseño tropical y sostenible, comodidad absoluta.',
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
    finalCta: {
      subtitle: 'Plazas Limitadas',
      title: 'Comienza tu Viaje',
      description: 'Ponte en contacto para reservar tu lugar en el próximo retiro. Plazas limitadas para garantizar una experiencia íntima y transformadora.',
      cta: 'Reserva por WhatsApp',
    },
  };

  return <RetreatsLayout texts={spanishTexts} locale="es" />;
}

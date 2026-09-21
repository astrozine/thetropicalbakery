import React from 'react';
import RetreatsLayout from '@/components/RetreatsLayout';

export default function RetreatsPage() {
  const portugueseTexts = {
    whatsappMessage: 'Olá! Gostaria de saber mais sobre os Retiros da Tropical Bakery.',
    hero: {
      location: 'Itamambuca · Ubatuba · Brasil',
      title: <>Retiros de Culinária<br />e Bem-Estar</>,
      description: 'Uma jornada imersiva para mulheres em Itamambuca. Descubra os segredos da confeitaria saudável enquanto relaxa em meio à natureza.',
      cta: 'Reserve o Seu Retiro',
    },
    experience: {
      subtitle: 'A Experiência',
      title: 'Reconecte-se com a Natureza e a Comida',
      description: 'Nossos retiros são projetados para reconectar você com a comida de uma forma curativa e deliciosa. Você aprenderá na prática como preparar sobremesas luxuosas que nutrem o corpo.',
      bullets: [
        'Workshops de confeitaria saudável',
        'Sessões matinais de Yoga na praia',
        'Hospedagem de luxo em Itamambuca',
        'Leve habilidades incríveis para sua família'
      ],
    },
    foodHero: {
      title: 'Criações Exclusivas The Tropical Bakery',
      subtitle: '100% Vegano · Sem Glúten · SOS-Free · Feito com ingredientes tropicais frescos',
    },
    suites: {
      subtitle: 'Salt n\' Paradise',
      title: 'Nossas Suítes',
      description: 'Hospede-se em nossa bela casa a poucos passos da praia. Suítes com design tropical e sustentável, conforto absoluto.',
      penthouse: {
        capacity: 'Até 6 pessoas',
        title: 'Cobertura (Penthouse)',
        description: 'Suíte espaçosa com vista panorâmica, perfeita para grupos e famílias.',
        cta: 'Ver no Airbnb',
      },
      bigSuite: {
        capacity: 'Até 3 pessoas',
        title: 'Suíte Master',
        description: 'Conforto e privacidade com detalhes em madeira e design tropical.',
        cta: 'Ver no Airbnb',
      },
      smallSuite: {
        capacity: 'Até 2 pessoas',
        title: 'Suíte Standard',
        description: 'Aconchegante e intimista, ideal para casais ou viajantes solo.',
        cta: 'Ver no Airbnb',
      },
    },
    finalCta: {
      subtitle: 'Vagas Limitadas',
      title: 'Comece Sua Jornada',
      description: 'Entre em contato para reservar seu lugar no próximo retiro. Vagas limitadas para garantir uma experiência íntima e transformadora.',
      cta: 'Reserve pelo WhatsApp',
    },
  };

  return <RetreatsLayout texts={portugueseTexts} />;
}

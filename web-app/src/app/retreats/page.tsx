import React from 'react';
import RetreatsLayout from '@/components/RetreatsLayout';

export default function RetreatsPage() {
  const portugueseTexts = {
    whatsappMessage: 'Olá! Quero saber mais sobre o retiro na casa de vocês em Itamambuca.',
    hero: {
      location: 'Itamambuca · Ubatuba · Brasil',
      title: <>Viva uns dias<br />na nossa casa</>,
      description: 'Fique com a gente em Itamambuca, coma na nossa mesa e volte para casa sabendo comer assim, com prazer e satisfeito(a). Sozinho(a), em casal ou com a família toda.',
      cta: 'Quero vir',
    },
    suites: {
      subtitle: 'Onde você fica',
      title: 'Três quartos, ou a casa toda',
      description: 'A nossa casa, Salt n’ Paradise, a 100 m da praia. Escolha o quarto que cabe em você ou na sua família.',
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
  };

  return <RetreatsLayout texts={portugueseTexts} />;
}

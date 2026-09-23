import React from 'react';
import B2BPageLayout from '@/components/B2BPageLayout';

export default function AffiliatesPage() {
  return (
    <B2BPageLayout
      eyebrow="Programa de Afiliados"
      title="Indique. A Gente Entrega. Você Ganha."
      intro="Você conhece restaurantes, organiza eventos ou tem uma audiência que confia em você? Vire um afiliado e ganhe uma comissão sobre cada caixa vendida através da sua indicação."
      heroScene="/assets/brazilian_beach_bakery_1789884714986.jpg"
      heroTreats={["/b2b-hero/treat-6.jpg", "/b2b-hero/treat-2.jpg"]}
      optionsHeading="Como Funciona"
      options={[
        {
          icon: '🔗',
          title: 'Seu Código Exclusivo',
          description: 'Você recebe um código ou link próprio para compartilhar com restaurantes, clientes, eventos ou seus seguidores.',
        },
        {
          icon: '💰',
          title: 'Comissão por Caixa Vendida',
          description: 'Cada venda feita através do seu código gera uma comissão para você. Fale com a gente pelo WhatsApp para conhecer os valores atuais.',
        },
        {
          icon: '🎁',
          title: 'Descontos para Quem Você Indica',
          description: 'Seu código também dá desconto especial para quem compra através dele — todo mundo sai ganhando.',
        },
      ]}
      whyChooseUs={[
        'Ganhe uma comissão de cada venda realizada através do seu código exclusivo.',
        'Descontos para seguidores: seu código oferece vantagens especiais para quem você indica.',
        'Acesso VIP: seja a primeira pessoa a experimentar novos sabores e lançamentos sazonais.',
      ]}
      whatsappHref="https://wa.me/5511932119196?text=Ol%C3%A1%2C%20quero%20ser%20um%20Afiliado%20da%20The%20Tropical%20Bakery!"
      whatsappLabel="Quero Ser Afiliado"
      galleryImages={['/assets/iphone_nano_banana_1789717175208.jpg', '/assets/iphone_cacao_pod_1789717194655.jpg', '/assets/iphone_hotel_1789718118077.jpg', '/assets/iphone_pousada_1789718128863.jpg']}
    />
  );
}

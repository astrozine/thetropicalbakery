import React from 'react';
import type { Metadata } from 'next';
import B2BPageLayout from '@/components/B2BPageLayout';
import { BoatCopy, BoatDetails, BoatForWho, BoatHeroExtra } from '@/components/BoatPartnerSections';

// Still to confirm with Andrew: the R$ 249 price, the 10–15% commission and the 48 h notice.
// The English page (/en/b2b/boats) repeats these numbers; change both.

export const metadata: Metadata = {
  title: 'Kit a Bordo para Barcos, Charters e Marinas | The Tropical Bakery',
  description: 'Doces finos veganos e sem trigo da chef belga Dolly, entregues no píer antes do passeio. Parcerias para charters, marinas e agências em Ubatuba e Paraty.',
  alternates: { languages: { 'pt-BR': '/b2b/barcos', en: '/en/b2b/boats' } },
};

const copy: BoatCopy = {
  forWhoTitle: 'Para quem é',
  forWho: [
    { icon: '⛵', text: 'Empresas de charter e aluguel de lanchas e veleiros' },
    { icon: '⚓', text: 'Marinas e seus proprietários de barcos' },
    { icon: '🧭', text: 'Agências que vendem passeios privativos' },
  ],
  whyTitle: 'Por que vale a pena',
  why: [
    'Comissão de 10% a 15% em cada pedido indicado',
    'Nenhum estoque, nenhum trabalho: entregamos direto no píer',
    'Um extra de luxo que aumenta o valor do passeio',
    'Opções para clientes veganos e sem trigo, com o açúcar de cada doce informado',
  ],
  whereTitle: 'Onde entregamos',
  places: [
    { name: 'Ubatuba', text: 'Saco da Ribeira e demais píeres da região' },
    { name: 'Paraty', text: 'Marina do Engenho, Marina Farol de Paraty e Cais de Paraty' },
  ],
  rules: [
    'Pedido com no mínimo 48 horas de antecedência',
    'Paraty: pedido mínimo de 10 caixas por entrega, como no restante do site',
  ],
  howTitle: 'Como funciona',
  steps: [
    'Preencha o formulário de 2 minutos',
    'A Dolly liga pelo WhatsApp para combinar os detalhes',
    'Você recebe acesso ao portal de parceiros para fazer pedidos e acompanhar suas comissões',
  ],
  photoAlt: 'Três amigos rindo a bordo de um veleiro, provando doces de uma caixa kraft The Tropical Bakery',
  note: 'Nenhuma receita leva glúten, mas a cozinha não é certificada: pode haver traços. Doces com chocolate vegano aparecem marcados.',
};

export default function BarcosPage() {
  return (
    <B2BPageLayout
      partnerKind="barco"
      eyebrow="Parcerias para Barcos e Marinas"
      title="Um presente a bordo que seus clientes vão lembrar"
      intro="Doces finos da chef belga Dolly Van Dam, 100% vegetais e sem trigo, entregues no píer antes da saída, numa caixa kraft de presente."
      heroScene="/assets/boat_deck_box.jpg"
      heroPortrait
      heroExtra={<BoatHeroExtra c={copy} />}
      heroTreats={['/box1.jpg', '/box2.jpg']}
      regionNote="Ubatuba (Saco da Ribeira) e Paraty"
      applyCta="Quero ser parceiro"
      optionsHeading="O que oferecemos"
      beforeOptions={<BoatForWho c={copy} />}
      options={[
        {
          icon: '🎁',
          title: 'Kit a Bordo',
          description: 'Uma caixa com 8 doces da semana, embalada como presente e entregue no píer numa caixa térmica com gelo: a bordo, fica no cooler até a hora de servir. Perfeito para aniversários, pedidos de casamento, lua de mel e grupos especiais.',
          note: 'Valor sugerido ao cliente: a partir de R$ 249',
        },
        {
          icon: '🌙',
          title: 'Boas-vindas para viagens de vários dias',
          description: 'Caixas para charters com pernoite, entregues congeladas na marina antes da partida. No freezer de bordo duram a viagem toda; a tripulação tira uns 10 minutos antes de servir.',
        },
        {
          icon: '🥂',
          title: 'Celebrações a bordo',
          description: 'Mesas de sobremesa e encomendas maiores para eventos no barco ou na marina.',
          link: { href: '/menu', label: 'Ver o Menu de Eventos' },
        },
      ]}
      whyChooseUs={[]}
      whatsappHref="https://wa.me/5511932119196?text=Ol%C3%A1%2C%20tenho%20interesse%20em%20uma%20parceria%20para%20Barcos%20e%20Marinas!"
      galleryImages={['/box1.jpg', '/box2.jpg', '/box3.jpg', '/box4.jpg', '/menu-items/1000215018.jpg', '/menu-items/20250914_132214.jpg']}
    >
      <BoatDetails c={copy} />
    </B2BPageLayout>
  );
}

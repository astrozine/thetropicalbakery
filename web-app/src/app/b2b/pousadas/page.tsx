import React from 'react';
import B2BPageLayout from '@/components/B2BPageLayout';

export default function PousadasPage() {
  return (
    <B2BPageLayout
      partnerKind="pousada"
      eyebrow="Parcerias para Pousadas"
      title="O Toque Doce que Vira Avaliação 5 Estrelas"
      intro="Sua pousada já oferece hospitalidade de verdade — deixe a gente cuidar da parte doce. Café da manhã inesquecível, ou uma mini loja que se paga sozinha."
      heroScene="/assets/glamorous_pousada_1789884603550.jpg"
      heroTreats={["/b2b-hero/treat-9.jpg", "/b2b-hero/treat-7.jpg"]}
      regionNote="Atendemos toda a região: Itamambuca, Ubatuba, praias vizinhas e eventos em Paraty."
      options={[
        {
          icon: '🧊',
          title: 'Mini Fridge The Tropical Bakery',
          description: 'Uma geladeira de exposição com nossa marca na área comum ou recepção, sempre abastecida. O hóspede se serve, você lucra sem esforço extra.',
        },
        {
          icon: '🥐',
          title: 'Café da Manhã',
          description: 'Opções de alta qualidade, 100% veganas, sem glúten e SOS-Free (livre de açúcar refinado, sal e produtos processados) direto no seu buffet.',
        },
        {
          icon: '📱',
          title: 'Pedido por QR Code',
          description: 'Um cartão "THE TROPICAL BAKERY · ITAMAMBUCA" em cada suíte. O hóspede escaneia e pede algo local e especial, entregue direto na pousada.',
        },
      ]}
      whyChooseUs={[
        'Café da manhã que vira avaliação 5 estrelas.',
        'Variedade semanal que surpreende hóspedes recorrentes.',
        'Fornecimento confiável e pontual diretamente na sua pousada.',
      ]}
      whatsappHref="https://wa.me/5511932119196?text=Ol%C3%A1%2C%20tenho%20interesse%20em%20uma%20parceria%20para%20Pousada!"
      galleryImages={['/menu-items/1000215018.jpg', '/menu-items/Screenshot_20260518_122444_Gallery.jpg', '/menu-items/Screenshot_20260708_144013_Gallery.jpg', '/menu-items/20250914_132214.jpg']}
    />
  );
}

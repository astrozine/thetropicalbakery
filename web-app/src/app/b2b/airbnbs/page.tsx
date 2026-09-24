import React from 'react';
import B2BPageLayout from '@/components/B2BPageLayout';

export default function AirbnbsPage() {
  return (
    <B2BPageLayout
      partnerKind="airbnb"
      eyebrow="Parcerias para Airbnbs"
      title="Avaliações 5 Estrelas Começam no Café da Manhã"
      intro="Uma casa de temporada em Itamambuca, Félix ou Prumirim já vende o paraíso. A gente entrega a parte gastronômica que faz o hóspede comentar na review."
      heroScene="/assets/airbnb_breakfast_tray_1789884624300.jpg"
      heroTreats={["/b2b-hero/treat-8.jpg", "/b2b-hero/treat-6.jpg"]}
      itamambucaBadge
      regionNote="Parceria disponível para acomodações na região de Itamambuca, Praia Félix e Prumirim."
      options={[
        {
          icon: '🥐',
          title: 'Café da Manhã Artesanal',
          description: 'Uma cesta ou bandeja pronta para servir, entregue no horário combinado — sem logística nenhuma para você.',
        },
        {
          icon: '📱',
          title: 'Cartão de Pedido na Casa',
          description: 'Um cartão "THE TROPICAL BAKERY · ITAMAMBUCA" com QR code deixado na casa ou no quarto, para o hóspede pedir algo especial durante a estadia — entregamos direto na porta.',
        },
      ]}
      whyChooseUs={[
        'Surpreenda hóspedes com uma experiência gastronômica única.',
        'Fornecimento sem logística: entregamos pronto para servir.',
        'Conteúdo foto-perfeito que valoriza seus reviews.',
      ]}
      whatsappHref="https://wa.me/5511932119196?text=Ol%C3%A1%2C%20tenho%20interesse%20em%20uma%20parceria%20para%20Airbnb!"
      galleryImages={['/menu-items/Screenshot_20260401_193246_Edits.jpg', '/menu-items/20260209_172647.jpg', '/menu-items/Screenshot_20260818_075043_Gallery.jpg', '/menu-items/20250823_122444.jpg']}
    />
  );
}

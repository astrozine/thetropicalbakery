import React from 'react';
import B2BPageLayout from '@/components/B2BPageLayout';

export default function HotelsPage() {
  return (
    <B2BPageLayout
      eyebrow="Parcerias para Hotéis"
      title="Uma Tropical Bakery Dentro do Seu Hotel"
      intro="Transforme qualquer canto do seu hotel — recepção, lounge, sala de café — num ponto de venda que encanta hóspedes e gera receita extra, sem contratar ninguém e sem abrir mão da sua cozinha."
      heroScene="/assets/realistic_hotel.jpg"
      heroTreats={["/b2b-hero/treat-0.jpg", "/b2b-hero/treat-1.jpg"]}
      options={[
        {
          icon: '🧊',
          title: 'Mini Fridge The Tropical Bakery',
          description: 'Uma geladeira de exposição com a nossa marca, abastecida semanalmente, posicionada na recepção, no lounge ou na sala de café. O hóspede compra na hora, você fica com a margem — dinheiro rápido, sem esforço da sua equipe.',
        },
        {
          icon: '🥐',
          title: 'Café da Manhã',
          description: 'Entrega recorrente de itens de padaria vegana e sem glúten para o seu buffet, elevando a experiência de café da manhã sem exigir preparo interno.',
        },
        {
          icon: '📱',
          title: 'Pedido por QR Code',
          description: 'Uma placa "THE TROPICAL BAKERY · ITAMAMBUCA" em cada quarto ou área comum. O hóspede escaneia, escolhe algo local e especial, e recebe entregue diretamente — sem passar pela recepção.',
        },
      ]}
      whyChooseUs={[
        'Atenda com facilidade às crescentes demandas por dietas especiais.',
        'Fornecimento premium, vibrante e confiável.',
        'Destaque-se com delícias artesanais exclusivas no seu buffet ou serviço de quarto.',
      ]}
      whatsappHref="https://wa.me/5511932119196?text=Ol%C3%A1%2C%20tenho%20interesse%20em%20uma%20parceria%20para%20Hotel!"
      galleryImages={['/menu-items/20260724_154636.jpg', '/menu-items/Screenshot_20260623_080155_Gallery.jpg', '/menu-items/20251201_133121.jpg', '/menu-items/Screenshot_20260810_135948_Photos.jpg']}
    />
  );
}

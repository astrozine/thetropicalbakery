import React from 'react';
import B2BPageLayout from '@/components/B2BPageLayout';

export default function RestaurantsPage() {
  return (
    <B2BPageLayout
      eyebrow="Parcerias para Restaurantes"
      title="Sobremesas com a Cara do Seu Restaurante"
      intro="Atenda o público que busca opções sem glúten, veganas, sem óleo, sem açúcar refinado ou sal — sem sobrecarregar sua cozinha. A Dolly cria a sobremesa, você recebe pronta, sua equipe só finaliza o prato."
      heroImage="/assets/tropical_restaurant_vegan_1789884909542.jpg"
      options={[
        {
          icon: '🎨',
          title: 'Sobremesa com o Tema do Restaurante',
          description: 'A Dolly desenvolve uma criação personalizada relacionada à identidade do seu restaurante — por exemplo, uma versão tailandesa para um restaurante tailandês.',
        },
        {
          icon: '📋',
          title: 'Cardápio de Opções',
          description: 'Prefere praticidade? Escolha entre as mesmas opções usadas no nosso menu de eventos, prontas para entrar no seu cardápio.',
        },
        {
          icon: '🧊',
          title: 'Entrega Sob Demanda',
          description: 'Entregamos conforme sua necessidade, mantido no freezer até a hora de servir — zero desperdício, estoque sempre pronto.',
        },
      ]}
      whyChooseUs={[
        'Forneça sobremesas veganas e sem glúten premium instantaneamente.',
        'Fornecimento no atacado confiável e adaptado ao seu volume.',
        'Potencial de empratamento deslumbrante para experiências gastronômicas sofisticadas.',
      ]}
      whatsappHref="https://wa.me/5511932119196?text=Ol%C3%A1%2C%20tenho%20interesse%20em%20uma%20parceria%20para%20Restaurante!"
      galleryImages={['/menu-items/1000234513 - Edited.jpg', '/menu-items/Screenshot_20260415_110305_Gallery.jpg', '/menu-items/20260208_082125_0000.png', '/menu-items/Screenshot_20260221_093613_Photos.jpg']}
    />
  );
}

import React from 'react';
import B2BPageLayout from '@/components/B2BPageLayout';

export default function BakeriesPage() {
  return (
    <B2BPageLayout
      eyebrow="Parcerias para Padarias"
      title="A Vitrine Inclusiva que Seus Clientes Estão Pedindo"
      intro="Atenda o público que busca opções sem glúten, veganas, sem óleo, sem açúcar refinado ou sal — sem sobrecarregar sua produção. A Dolly cria, você recebe pronto para vender."
      heroImage="/assets/realistic_bakery.jpg"
      options={[
        {
          icon: '🎨',
          title: 'Criação com a Cara da Sua Padaria',
          description: 'A Dolly desenvolve itens personalizados alinhados ao perfil da sua vitrine e dos seus clientes fiéis.',
        },
        {
          icon: '📋',
          title: 'Cardápio de Opções',
          description: 'Escolha entre as mesmas opções usadas no nosso menu de eventos, prontas para entrar na sua vitrine.',
        },
        {
          icon: '🧊',
          title: 'Entrega Sob Demanda',
          description: 'Entregamos conforme sua necessidade, mantido no freezer até a hora de expor — sem contaminação cruzada na sua própria cozinha.',
        },
      ]}
      whyChooseUs={[
        'Expanda sua base de clientes oferecendo dietas especiais de alta qualidade.',
        'Não se preocupe com contaminação cruzada na sua própria cozinha.',
        'Adições frescas, consistentes e visualmente deslumbrantes à sua vitrine.',
      ]}
      whatsappHref="https://wa.me/5511932119196?text=Ol%C3%A1%2C%20tenho%20interesse%20em%20uma%20parceria%20para%20Padaria!"
      galleryImages={['/menu-items/20250823_121752.jpg', '/menu-items/Screenshot_20260623_080155_Gallery.jpg', '/menu-items/20260724_154636.jpg', '/menu-items/Screenshot_20260412_123155_Edits.jpg']}
    />
  );
}

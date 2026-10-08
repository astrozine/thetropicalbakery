import React from 'react';
import type { Metadata } from 'next';
import B2BPageLayout from '@/components/B2BPageLayout';
import WellnessScenes from '@/components/WellnessScenes';

// The mini fridge is still an idea (no fridges, no stocking routine yet): it is offered here as a
// pilot people can sign up for, never as something ready. Change the wording once it exists.

export const metadata: Metadata = {
  title: 'Parcerias para Estúdios de Yoga, Pilates, Academias e Spas | The Tropical Bakery',
  description: 'Doces finos 100% vegetais e sem trigo, adoçados com frutas, açúcar de coco ou rapadura, para estúdios de yoga e pilates, academias, retiros e spas em Ubatuba e região.',
};

export default function BemEstarPage() {
  return (
    <B2BPageLayout
      partnerKind="bemestar"
      eyebrow="Parcerias para Yoga, Pilates e Academias"
      title="O doce que combina com quem se cuida"
      intro="Estúdios de yoga e pilates, academias, retiros e spas: seus alunos e clientes procuram algo gostoso que não desfaça o treino. Doces da chef belga Dolly, 100% vegetais, sem trigo e adoçados com frutas, com o açúcar e a cafeína de cada um informados às claras."
      heroScene="/assets/wellness_pilates_door.jpg"
      heroPortrait
      heroTreats={['/b2b-hero/treat-5.jpg', '/b2b-hero/treat-2.jpg']}
      regionNote="Itamambuca, Ubatuba e praias vizinhas"
      options={[
        {
          icon: '🧘',
          title: 'Doces depois da aula',
          description: 'Uma entrega semanal para a recepção ou o cantinho de café do seu espaço, nos dias de mais movimento. O aluno sai da aula e leva um doce; você fica com a margem.',
        },
        {
          icon: '🎁',
          title: 'Welcome box para retiros, workshops e spa day',
          description: 'Uma caixinha de boas-vindas para cada participante, com um cartão do seu espaço. Para retiros, imersões, aulas especiais e pacotes de spa.',
        },
        {
          icon: '🧊',
          title: 'Mini fridge (piloto)',
          description: 'Estamos montando um piloto de geladeira de exposição com poucos parceiros, abastecida por nós. Quer ser um dos primeiros? Conte no formulário e a Dolly fala com você.',
        },
      ]}
      whyChooseUs={[
        'Tudo 100% vegetal, sem trigo na receita e adoçado com frutas, açúcar de coco ou rapadura (quando entra chocolate vegano, que tem um pouco de açúcar refinado, vem indicado): combina com o que você ensina.',
        'Açúcar e cafeína de cada doce informados, para quem cuida da alimentação.',
        'Nenhum estoque para administrar: a gente entrega pronto, no dia combinado.',
        'Um diferencial que seus alunos comentam e trazem os amigos para provar.',
      ]}
      whatsappHref="https://wa.me/5511932119196?text=Ol%C3%A1%2C%20tenho%20interesse%20em%20uma%20parceria%20para%20meu%20espa%C3%A7o%20de%20bem-estar!"
      galleryImages={['/box1.jpg', '/menu-items/1000215018.jpg', '/menu-items/20250914_132214.jpg', '/box3.jpg']}
    >
      <WellnessScenes />
    </B2BPageLayout>
  );
}

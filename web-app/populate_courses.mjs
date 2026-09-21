import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghmzsxaesegxmtxzdrlx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobXpzeGFlc2VneG10eHpkcmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4Njk3NTYsImV4cCI6MjEwNTQ0NTc1Nn0.dACpDx6XXeIwItIhaXgDJEH-ow0bp7Dqi0ACQnt-lJg';
const supabase = createClient(supabaseUrl, supabaseKey);

const courses = [
  {
    title: 'Turismo Gastronômico',
    slug: 'turismo-gastronomico',
    price: 350.00,
    description: 'Uma experiência imersiva de 1 dia na The Tropical Bakery. Aprenda os segredos da confeitaria vegana tropical em um ambiente prático e descontraído, perfeito para quem está de férias em Ubatuba.',
    image_url: '/assets/surfers_retreat_treats_1789884582282.jpg',
    is_active: true
  },
  {
    title: 'Capacitação Profissional',
    slug: 'capacitacao-profissional',
    price: 1200.00,
    description: 'Cursos contínuos e semanais focados em treinar cozinheiros particulares locais (patrocinados por seus empregadores) para elevarem o nível da alimentação no dia a dia.',
    image_url: '/assets/chef_training_1789884593538.jpg',
    is_active: true
  },
  {
    title: 'Saúde, Sabores e Bem-Estar',
    slug: 'saude-bem-estar',
    price: 850.00,
    description: 'Entenda a lógica por trás de cada ingrediente. Este curso é ideal para donas de casa ou pessoas com questões específicas de saúde que buscam uma transição suave e deliciosa para o veganismo e a alimentação curativa.',
    image_url: '/dolly-course3.jpg',
    is_active: true
  }
];

async function run() {
  const { data, error } = await supabase.from('courses').insert(courses).select();
  if (error) {
    console.error('Error inserting courses:', error);
  } else {
    console.log('Successfully inserted courses:', data);
  }
}

run();

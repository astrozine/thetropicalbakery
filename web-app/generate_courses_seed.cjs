const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ghmzsxaesegxmtxzdrlx.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobXpzeGFlc2VneG10eHpkcmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4Njk3NTYsImV4cCI6MjEwNTQ0NTc1Nn0.dACpDx6XXeIwItIhaXgDJEH-ow0bp7Dqi0ACQnt-lJg';
const supabase = createClient(supabaseUrl, supabaseKey);

const courses = [
  {
    title: 'Turismo Gastronômico',
    slug: 'turismo-gastronomico',
    description: 'Uma experiência imersiva de 1 dia na The Tropical Bakery. Aprenda os segredos da confeitaria vegana tropical em um ambiente prático e descontraído, perfeito para quem está de férias em Ubatuba.\n\n✦ Imersão rápida e prática\n✦ Degustação exclusiva incluída\n✦ Leve para casa as receitas criadas',
    price: 350.00,
    image_url: '/assets/surfers_retreat_treats_1789884582282.jpg',
    is_active: true
  },
  {
    title: 'Capacitação Profissional',
    slug: 'capacitacao-profissional',
    description: 'Cursos contínuos e semanais focados em treinar cozinheiros particulares locais (patrocinados por seus empregadores) para elevarem o nível da alimentação no dia a dia.\n\n✦ Técnicas avançadas de culinária funcional\n✦ Planejamento de cardápios semanais SOS-Free\n✦ Substituições inteligentes e saborosas',
    price: 1200.00,
    image_url: '/assets/chef_training_1789884593538.jpg',
    is_active: true
  },
  {
    title: 'Saúde, Sabores e Bem-Estar',
    slug: 'saude-bem-estar',
    description: 'Entenda a lógica por trás de cada ingrediente. Este curso é ideal para donas de casa ou pessoas com questões específicas de saúde que buscam uma transição suave e deliciosa para o veganismo e a alimentação curativa.\n\n✦ A ciência da nutrição integral\n✦ Receitas curativas e regenerativas\n✦ Como criar pratos que a família toda vai amar',
    price: 850.00,
    image_url: '/dolly-course3.jpg',
    is_active: true
  }
];

const values = courses.map(c => `('${c.title}', '${c.slug}', '${c.description}', ${c.price}, '${c.image_url}', true)`).join(',\n  ');

const sql = `INSERT INTO courses (title, slug, description, price, image_url, is_active) VALUES\n  ${values};`;

const fs = require('fs');
fs.writeFileSync('seed_courses.sql', sql);
console.log('Done!');

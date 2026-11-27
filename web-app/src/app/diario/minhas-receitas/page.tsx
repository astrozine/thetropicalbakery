import MyRecipes from '@/components/journal/MyRecipes';

export const metadata = { title: 'Minhas receitas | Diário de Receitas', robots: { index: false } };

export default function MinhasReceitasPage() {
  return <MyRecipes lang="pt" />;
}

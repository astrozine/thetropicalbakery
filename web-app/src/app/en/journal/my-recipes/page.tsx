import MyRecipes from '@/components/journal/MyRecipes';

export const metadata = { title: 'My recipes | Recipe Journal', robots: { index: false } };

export default function MyRecipesPage() {
  return <MyRecipes lang="en" />;
}

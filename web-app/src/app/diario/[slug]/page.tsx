import RecipePage, { recipeMetadata } from '@/components/journal/RecipePage';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return recipeMetadata(slug, 'pt');
}

export default async function DiarioRecipePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <RecipePage slug={slug} lang="pt" />;
}

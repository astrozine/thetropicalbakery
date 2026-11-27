import CollectionPage, { collectionMetadata } from '@/components/journal/CollectionPage';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return collectionMetadata(slug, 'pt');
}

export default async function DiarioCollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CollectionPage slug={slug} lang="pt" />;
}

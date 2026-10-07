import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import BrunchEventView from '@/components/brunch/BrunchEventView';
import { fmtWhen } from '@/lib/brunch';

/** The title and photo of a brunch for the WhatsApp / Instagram preview when someone shares the link. */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data } = await db.from('brunch_events').select('title, theme, starts_at, ends_at, cover_url').eq('slug', slug).maybeSingle();
    if (data) {
      const description = `${fmtWhen(data)}. ${data.theme || 'Chá, doces saudáveis e boa conversa com a Dolly.'} Lugares limitados.`;
      return {
        title: `${data.title} | Brunch Tropical`,
        description,
        openGraph: { title: `Brunch Tropical: ${data.title}`, description, images: [{ url: data.cover_url || '/brunch/brunch-jardim.webp' }] },
      };
    }
  } catch { /* fall through to the generic title */ }
  return { title: 'Brunch Tropical | The Tropical Bakery' };
}

export default async function BrunchEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <BrunchEventView slug={slug} />;
}

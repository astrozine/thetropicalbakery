import JournalHome from '@/components/journal/JournalHome';
import { journalMetadata } from './meta';

export const revalidate = 60;
export const metadata = journalMetadata('pt');

/** O Diário de Receitas (Recipe Journal), em português. Inglês: /en/journal. */
export default function DiarioPage() {
  return <JournalHome lang="pt" />;
}

import JournalHome from '@/components/journal/JournalHome';
import { journalMetadata } from '@/app/diario/meta';

export const revalidate = 60;
export const metadata = journalMetadata('en');

/** The Recipe Journal in English. Portuguese: /diario. */
export default function JournalPage() {
  return <JournalHome lang="en" />;
}

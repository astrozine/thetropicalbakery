import SweetEscapeLanding from '@/components/ebook/SweetEscapeLanding';
import { ebookMetadata } from '../meta';

export const metadata = ebookMetadata('pt');

/** Hand-written Portuguese version of the sales page. The book itself is English, and this page says so. */
export default function SweetEscapePTPage() {
  return <SweetEscapeLanding lang="pt" />;
}

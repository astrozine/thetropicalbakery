import SweetEscapeLanding from '@/components/ebook/SweetEscapeLanding';
import { ebookMetadata } from '../meta';

export const metadata = ebookMetadata('de');

/** Hand-written German version of the sales page; the book itself also exists in German. */
export default function SweetEscapeDEPage() {
  return <SweetEscapeLanding lang="de" />;
}

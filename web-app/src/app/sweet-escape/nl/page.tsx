import SweetEscapeLanding from '@/components/ebook/SweetEscapeLanding';
import { ebookMetadata } from '../meta';

export const metadata = ebookMetadata('nl');

/** Hand-written Dutch version of the sales page; the book itself also exists in Dutch. */
export default function SweetEscapeNLPage() {
  return <SweetEscapeLanding lang="nl" />;
}

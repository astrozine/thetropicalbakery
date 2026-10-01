import SweetEscapeLanding from '@/components/ebook/SweetEscapeLanding';
import { ebookMetadata } from '../meta';

export const metadata = ebookMetadata('es');

/** Hand-written Spanish version of the sales page. The book itself is English, and this page says so. */
export default function SweetEscapeESPage() {
  return <SweetEscapeLanding lang="es" />;
}

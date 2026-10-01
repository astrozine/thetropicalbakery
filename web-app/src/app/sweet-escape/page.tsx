import SweetEscapeLanding from '@/components/ebook/SweetEscapeLanding';
import { ebookMetadata } from './meta';

export const metadata = ebookMetadata('en');

export default function SweetEscapePage() {
  return <SweetEscapeLanding lang="en" />;
}

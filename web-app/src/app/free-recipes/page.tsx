import FreeRecipesLanding from '@/components/funnel/FreeRecipesLanding';
import { funnelMetadata } from './meta';

export const metadata = funnelMetadata('en');

export default function FreeRecipesPage() {
  return <FreeRecipesLanding lang="en" />;
}

import FreeRecipesLanding from '@/components/funnel/FreeRecipesLanding';
import { funnelMetadata } from '../meta';

export const metadata = funnelMetadata('de');

export default function FreeRecipesPage() {
  return <FreeRecipesLanding lang="de" />;
}

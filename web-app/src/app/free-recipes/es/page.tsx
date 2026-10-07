import FreeRecipesLanding from '@/components/funnel/FreeRecipesLanding';
import { funnelMetadata } from '../meta';

export const metadata = funnelMetadata('es');

export default function FreeRecipesPage() {
  return <FreeRecipesLanding lang="es" />;
}

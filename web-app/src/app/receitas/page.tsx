import FreeRecipesLanding from '@/components/funnel/FreeRecipesLanding';
import { funnelMetadata } from '../free-recipes/meta';

export const metadata = funnelMetadata('pt');

/** The Portuguese free-recipes page: the short address for Brazilian ads and posts. */
export default function ReceitasPage() {
  return <FreeRecipesLanding lang="pt" />;
}

import CoachingLanding from '@/components/coaching/CoachingLanding';
import { coachingMetadata } from './meta';

export const metadata = coachingMetadata('pt');

/** /coaching: Dolly's food coaching (her "Food Healing Studio"), from her Paradise Pantry guide and the Sweet Escape e-book. */
export default function CoachingPage() {
  return <CoachingLanding lang="pt" />;
}

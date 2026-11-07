import CoachingLanding from '@/components/coaching/CoachingLanding';
import { coachingMetadata } from '../meta';

export const metadata = coachingMetadata('es');

/** Hand-written Spanish version of the coaching page. */
export default function CoachingESPage() {
  return <CoachingLanding lang="es" />;
}

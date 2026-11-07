import CoachingLanding from '@/components/coaching/CoachingLanding';
import { coachingMetadata } from '../meta';

export const metadata = coachingMetadata('nl');

/** Hand-written Dutch version of the coaching page. */
export default function CoachingNLPage() {
  return <CoachingLanding lang="nl" />;
}

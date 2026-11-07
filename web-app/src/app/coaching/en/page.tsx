import CoachingLanding from '@/components/coaching/CoachingLanding';
import { coachingMetadata } from '../meta';

export const metadata = coachingMetadata('en');

/** Hand-written English version of the coaching page. */
export default function CoachingENPage() {
  return <CoachingLanding lang="en" />;
}

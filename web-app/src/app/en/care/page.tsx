import { TreatCarePage } from '@/components/TreatCare';

export const metadata = {
  title: 'Treat care & storage | The Tropical Bakery',
  description: 'How to store and serve The Tropical Bakery treats: straight into the freezer, up to 4 weeks, and 10 minutes before eating.',
};

export default function CarePage() {
  return <TreatCarePage locale="en" />;
}

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { publicOffer } from '@/lib/payments/offer';
import { mercadoPagoConfigured } from '@/lib/payments/mercadopago';
import { paypalConfigured } from '@/lib/payments/paypal';
import { stripeConfigured } from '@/lib/payments/stripe';
import OfferLanding from '@/components/offer/OfferLanding';

export const dynamic = 'force-dynamic';

/** A personal page: never in search results, never shared as a preview with someone's name in it. */
export const metadata: Metadata = {
  title: 'Sua proposta | The Tropical Bakery',
  robots: { index: false, follow: false },
};

/** /proposta/<id>: the course or retreat proposal Dolly sent from /admin/propostas, with the payment on the page. */
export default async function ProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const offer = await publicOffer(id).catch(() => null);
  if (!offer) notFound();

  const service = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const methods = {
    card: service && mercadoPagoConfigured(),
    paypal: service && paypalConfigured(),
    stripe: service && stripeConfigured(),
  };

  return (
    <Suspense fallback={null}>
      <OfferLanding offer={offer} methods={methods} />
    </Suspense>
  );
}

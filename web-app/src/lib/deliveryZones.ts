/**
 * The delivery areas and their fees, in one place.
 *
 * Previously these were declared inside the tasting-box checkout. Subscriptions
 * need the same list, and two copies would eventually disagree about a price.
 */

export interface DeliveryZone {
  id: string;
  label: string;
  /** Per-delivery fee in BRL. */
  fee: number;
  /** Minimum boxes per order for this area. */
  minBoxes: number;
  /** Whether a weekly subscription can be delivered here. */
  subscriptionAvailable: boolean;
}

export const DELIVERY_ZONES: DeliveryZone[] = [
  { id: 'zone1', label: 'Itamambuca', fee: 0, minBoxes: 1, subscriptionAvailable: true },
  { id: 'zone2', label: 'Praia do Félix, Prumirim, Praia Vermelha, Perequê-Açú', fee: 15, minBoxes: 1, subscriptionAvailable: true },
  { id: 'zone3', label: 'Ubatuba (Centro), Praia Grande, Puruba, Ubatumirim', fee: 25, minBoxes: 1, subscriptionAvailable: true },
  // Wholesale and events only — a weekly box to Paraty isn't viable.
  { id: 'zone4', label: 'Paraty, Picinguaba (Somente Atacado/Eventos)', fee: 100, minBoxes: 10, subscriptionAvailable: false },
];

export const SUBSCRIPTION_ZONES = DELIVERY_ZONES.filter(z => z.subscriptionAvailable);

export const getZone = (id: string | null | undefined) =>
  DELIVERY_ZONES.find(z => z.id === id);

export const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

/**
 * Itamambuca is our own backyard — people there are a short walk from the
 * courses, the retreat house and the weekly box, not just a delivery zone.
 * Checked against the zone selector first (the reliable signal), then
 * against free-text neighbourhood/city for accounts filled in before that
 * selector existed.
 */
export const isItamambuca = (p: {
  delivery_zone?: string | null;
  address_neighborhood?: string | null;
  address_city?: string | null;
}) =>
  p.delivery_zone === 'zone1' ||
  /itamambuca/i.test(p.address_neighborhood || '') ||
  /itamambuca/i.test(p.address_city || '');

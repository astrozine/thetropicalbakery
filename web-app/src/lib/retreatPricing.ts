/**
 * The retreat package is booked OUTSIDE Airbnb, at a higher price than the
 * room alone — because it isn't just a place to sleep, it's the room plus
 * the Tropical Bakery immersion (confeitaria workshop, meals, activities).
 *
 * Total = (room's Airbnb-equivalent nightly rate x nights)
 *       + (immersion fee per person per night x guests x nights)
 *
 * The room rate comes from `retreat_rooms.airbnb_nightly_rate` (set in
 * /admin/retreats, copied from the live Airbnb listing so it always tracks
 * market rate). The immersion fee below is ours to set — adjust it here as
 * the offering (workshops, meals, activities included) evolves.
 */
// Andrew asked Claude to set it (2026-11-25): R$ 490 per guest per night, every meal + cooking with Dolly + outings.
// The top rung: one 3-hour class alone is R$ 330, so a full day with the family sits above it. Admin › Retiros (site_settings) wins.
export const IMMERSION_FEE_PER_GUEST_PER_NIGHT = 490; // R$

export interface RetreatRoom {
  id: string;
  name: string;
  airbnb_nightly_rate: number;
  max_guests: number;
}

export interface RetreatPackageQuote {
  nights: number;
  guests: number;
  roomSubtotal: number;
  immersionSubtotal: number;
  total: number;
  perNightPerGuest: number;
}

export function quoteRetreatPackage(
  room: RetreatRoom,
  nights: number,
  guests: number,
  immersionFeePerGuestPerNight: number = IMMERSION_FEE_PER_GUEST_PER_NIGHT,
): RetreatPackageQuote {
  const roomSubtotal = room.airbnb_nightly_rate * nights;
  const immersionSubtotal = immersionFeePerGuestPerNight * guests * nights;
  const total = roomSubtotal + immersionSubtotal;

  return {
    nights,
    guests,
    roomSubtotal,
    immersionSubtotal,
    total,
    perNightPerGuest: guests > 0 ? total / nights / guests : 0,
  };
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { DeliverySchedule, fetchSchedule, selectableDates } from '@/lib/deliverySchedule';
import { BoxWindowFields, boxRange, deliveryWindowLabel, inDeliveryWindow, isPresale, isRolledOver, lastOrderDay, saleState, shortDay } from '@/lib/boxWindow';

/**
 * Whether this box can be ordered right now, given the delivery calendar (null while it loads).
 * `rolledOver`: the planned delivery window is over but the box is still on sale, so deliveries now start
 * from the first day that can still be picked (`windowLabel` says so).
 */
export function boxSale(box: BoxWindowFields, schedule: DeliverySchedule | null) {
  const leadDays = schedule?.leadDays ?? 2;
  const all = schedule ? selectableDates(schedule) : null;
  const choosable = all ? inDeliveryWindow(all, box) : null;
  const rolledOver = !!all && isRolledOver(all, boxRange(box));
  const windowLabel = rolledOver && choosable?.length ? `a partir de ${shortDay(choosable[0])}` : deliveryWindowLabel(box);
  const presale = isPresale(box);
  // A pre-sale closes on its own deadline; the ready box only ever closes by selling out.
  const closesOn = presale ? (box.orders_close_on || null) : lastOrderDay(box, leadDays);
  return { ...saleState(box, choosable), choosable, leadDays, loaded: !!schedule, rolledOver, windowLabel, closesOn, presale };
}

export type BoxSale = ReturnType<typeof boxSale>;

/** The delivery calendar, loaded once. */
export function useSchedule() {
  const [schedule, setSchedule] = useState<DeliverySchedule | null>(null);
  useEffect(() => { fetchSchedule().then(setSchedule); }, []);
  return schedule;
}

/** Loads the delivery calendar once and says whether this box can be ordered right now. */
export function useBoxSale(box: BoxWindowFields | null) {
  const schedule = useSchedule();
  return useMemo(() => (box ? boxSale(box, schedule) : null), [box, schedule]);
}

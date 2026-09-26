'use client';

import { useEffect, useMemo, useState } from 'react';
import { DeliverySchedule, fetchSchedule, selectableDates } from '@/lib/deliverySchedule';
import { BoxWindowFields, deliveryWindowLabel, inDeliveryWindow, isRolledOver, lastOrderDay, saleState, shortDay } from '@/lib/boxWindow';

/**
 * Loads the delivery calendar once and says whether this box can be ordered right now.
 * `rolledOver`: the planned delivery window is over but the box is still on sale, so deliveries now start
 * from the first day that can still be picked (`windowLabel` says so).
 */
export function useBoxSale(box: BoxWindowFields | null) {
  const [schedule, setSchedule] = useState<DeliverySchedule | null>(null);
  useEffect(() => { fetchSchedule().then(setSchedule); }, []);

  return useMemo(() => {
    if (!box) return null;
    const leadDays = schedule?.leadDays ?? 2;
    const all = schedule ? selectableDates(schedule) : null;
    const choosable = all ? inDeliveryWindow(all, box) : null;
    const rolledOver = !!all && isRolledOver(all, { from: box.delivery_from, until: box.delivery_until });
    const windowLabel = rolledOver && choosable?.length ? `a partir de ${shortDay(choosable[0])}` : deliveryWindowLabel(box);
    return { ...saleState(box, choosable), choosable, leadDays, loaded: !!schedule, rolledOver, windowLabel, closesOn: lastOrderDay(box, leadDays) };
  }, [box, schedule]);
}

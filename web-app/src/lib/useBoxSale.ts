'use client';

import { useEffect, useMemo, useState } from 'react';
import { DeliverySchedule, fetchSchedule, selectableDates } from '@/lib/deliverySchedule';
import { BoxWindowFields, inDeliveryWindow, saleState } from '@/lib/boxWindow';

/** Loads the delivery calendar once and says whether this box can be ordered right now. */
export function useBoxSale(box: BoxWindowFields | null) {
  const [schedule, setSchedule] = useState<DeliverySchedule | null>(null);
  useEffect(() => { fetchSchedule().then(setSchedule); }, []);

  return useMemo(() => {
    if (!box) return null;
    const leadDays = schedule?.leadDays ?? 2;
    const choosable = schedule ? inDeliveryWindow(selectableDates(schedule), box) : null;
    return { ...saleState(box, leadDays, choosable), choosable, leadDays, loaded: !!schedule };
  }, [box, schedule]);
}

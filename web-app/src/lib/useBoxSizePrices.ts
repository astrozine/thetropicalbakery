'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BoxSizePrices, DEFAULT_BOX_PRICES, fetchBoxSizePrices } from '@/lib/boxSizes';

/** The 2 / 4 / 6-treat box prices from site_settings (the defaults until they load or if the migration has not run). */
export function useBoxSizePrices(): BoxSizePrices {
  const [prices, setPrices] = useState<BoxSizePrices>(DEFAULT_BOX_PRICES);
  useEffect(() => {
    let alive = true;
    fetchBoxSizePrices(supabase).then(r => { if (alive) setPrices(r.prices); });
    return () => { alive = false; };
  }, []);
  return prices;
}

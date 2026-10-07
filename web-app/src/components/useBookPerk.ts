'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * True when the signed-in visitor has the reader's gift (15% off their first purchase after Sweet Escape,
 * lib/bookPerk.ts), so a page can show the lower price before they pay. Only a preview: the server decides again
 * when it creates the order. Logged-out visitors get false (they see the discount on the order itself).
 */
export function useBookPerk(signedIn: boolean | string | null | undefined): boolean {
  const [perk, setPerk] = useState(false);
  useEffect(() => {
    if (!signedIn) return;
    let live = true;
    supabase.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token;
      if (!token) return;
      return fetch('/api/perk', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
        .then(r => r.json())
        .then(j => { if (live) setPerk(!!j.perk); });
    }).catch(() => {});
    return () => { live = false; };
  }, [signedIn]);
  return perk;
}

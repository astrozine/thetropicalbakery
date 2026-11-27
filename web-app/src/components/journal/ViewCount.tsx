'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/** Counts one view of a recipe per visitor per day (the admin's numbers and the "most viewed" sort). */
export default function ViewCount({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `rj-view:${slug}:${new Date().toISOString().slice(0, 10)}`;
    try { if (localStorage.getItem(key)) return; localStorage.setItem(key, '1'); } catch { /* private mode: count anyway */ }
    Promise.resolve(supabase.rpc('journal_count_view', { p_slug: slug })).catch(() => {});
  }, [slug]);
  return null;
}

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * The slugs of the courses switched on in /admin/courses. The course pages themselves are written
 * in code (courseContent.ts), so the nav and "Outros Cursos" list them by hand; this is how a course
 * Dolly has hidden ("em preparo") drops out of those lists too.
 *
 * `null` means "not known" (still loading, or the database could not be reached): callers then show
 * everything, as they did before. One request per page load, shared by every caller.
 */
let cache: Promise<Set<string> | null> | null = null;

function load() {
  cache ??= Promise.resolve(
    supabase.from('courses').select('slug').eq('is_active', true)
      .then(({ data, error }) => (error || !data ? null : new Set(data.map(c => c.slug as string)))),
  ).catch(() => null);
  return cache;
}

export function useShownCourses() {
  const [shown, setShown] = useState<Set<string> | null>(null);
  useEffect(() => {
    let live = true;
    load().then(s => { if (live) setShown(s); });
    return () => { live = false; };
  }, []);
  return shown;
}

/** Keep a hand-written course link unless we know that course is hidden. */
export const courseIsShown = (shown: Set<string> | null, slug: string) => !shown || shown.has(slug);

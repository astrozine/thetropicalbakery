import { supabase } from '@/lib/supabase';

/**
 * Admin "ver como" mode for the partner and staff areas.
 *
 * `/parceiro?preview=<id>` and `/equipe?preview=<id>` show that person's real area to an admin,
 * read-only. The database still decides what can be read: only an admin can read other people's
 * rows, so for anyone else the preview parameter simply finds nothing.
 */
export function previewIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const id = new URLSearchParams(window.location.search).get('preview');
  return id && /^[0-9a-f-]{36}$/i.test(id) ? id : null;
}

export async function isAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin');
  return !error && data === true;
}

/** An e-mail as an exact, case-insensitive match (escapes the LIKE wildcards `_` and `%`). */
export const exactEmail = (email: string) => email.trim().replace(/[\%_]/g, m => `\${m}`);

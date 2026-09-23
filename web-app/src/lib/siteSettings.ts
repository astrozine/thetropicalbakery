import { supabase } from '@/lib/supabase';

/**
 * Numbers that drift over time (minimum wage, the retreat immersion fee) but
 * shouldn't need a code deploy to update — see migration_06_site_settings.sql
 * and /admin/configuracoes. Falls back to the hardcoded default if the
 * migration hasn't run yet, so nothing breaks on an older database.
 */
export async function getSiteSetting(key: string, fallback: number): Promise<number> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();

  if (error || !data) return fallback;
  return Number(data.value) || fallback;
}

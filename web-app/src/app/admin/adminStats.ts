'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface ActiveBox {
  id: string;
  title: string;
  batch_date_label: string | null;
  total_quantity: number;
  sold_quantity: number;
}

export interface AdminStats {
  loading: boolean;
  /** The box customers can order right now, if any. */
  box: ActiveBox | null;
  /** Orders nobody has looked at yet. */
  newOrders: number;
  /** Orders placed in the last 7 days, and what they add up to. */
  weekOrders: number;
  weekRevenue: number;
  partnersPending: number;
  restockOpen: number;
  customers: number;
}

const EMPTY: AdminStats = {
  loading: true, box: null, newOrders: 0, weekOrders: 0, weekRevenue: 0, partnersPending: 0, restockOpen: 0, customers: 0,
};

/**
 * The few numbers the admin overview and the sidebar badges need, loaded together.
 * Each query fails on its own (a missing migration must never blank the whole page).
 */
export function useAdminStats(): AdminStats & { reload: () => void } {
  const [stats, setStats] = useState<AdminStats>(EMPTY);

  const load = useCallback(async () => {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const [box, orders, status, partners, restock, customers] = await Promise.all([
      supabase.from('tasting_boxes').select('id, title, batch_date_label, total_quantity, sold_quantity').eq('is_active', true).limit(1),
      supabase.from('orders').select('id, total_price, created_at').order('created_at', { ascending: false }).limit(1000),
      supabase.from('inbox_status').select('source_id, status').eq('source_table', 'orders'),
      supabase.from('partners').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
      supabase.from('partner_restock_requests').select('id', { count: 'exact', head: true }).eq('status', 'novo'),
      supabase.from('users').select('id', { count: 'exact', head: true }),
    ]);

    const orderRows = (orders.data || []) as { id: string; total_price: number | string | null; created_at: string }[];
    const handled = new Set(((status.data || []) as { source_id: string; status: string }[])
      .filter(s => s.status !== 'new').map(s => String(s.source_id)));
    const week = orderRows.filter(o => o.created_at >= weekAgo);

    setStats({
      loading: false,
      box: (box.data?.[0] as ActiveBox | undefined) ?? null,
      newOrders: orderRows.filter(o => !handled.has(String(o.id))).length,
      weekOrders: week.length,
      weekRevenue: week.reduce((sum, o) => sum + (Number.isFinite(Number(o.total_price)) ? Number(o.total_price) : 0), 0),
      partnersPending: partners.count || 0,
      restockOpen: restock.count || 0,
      customers: customers.count || 0,
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  return { ...stats, reload: load };
}

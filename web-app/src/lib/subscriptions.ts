export interface SubscriptionPlan {
  id: string;
  name: string;
  tagline: string | null;
  commitment_months: number;
  boxes_per_week: number;
  monthly_price: number;
  price_per_box: number;
  badge: string | null;
  perks: string[];
  sort_order: number;
  is_active: boolean;
}

export type SubscriptionStatus = 'pending' | 'active' | 'paused' | 'cancelled';

export interface Subscription {
  id: string;
  user_id: string | null;
  plan_id: string;
  status: SubscriptionStatus;
  boxes_per_week: number;
  full_name: string;
  whatsapp_number: string;
  email: string | null;
  delivery_zone: string | null;
  address_oneline: string | null;
  address_neighborhood: string | null;
  address_reference: string | null;
  is_vegan: boolean;
  is_gluten_free: boolean;
  is_sugar_free: boolean;
  is_salt_free: boolean;
  is_oil_free: boolean;
  allergies: string | null;
  monthly_price: number | null;
  delivery_fee: number | null;
  started_on: string | null;
  next_delivery_on: string | null;
  committed_until: string | null;
  paused_until: string | null;
  customer_message: string | null;
  admin_notes: string | null;
  created_at: string;
}

export const STATUS_LABELS: Record<SubscriptionStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Aguardando pagamento', color: '#7a4a00', bg: '#fff4e5' },
  active:    { label: 'Ativa',                color: '#0b6b3a', bg: '#e6f4ec' },
  paused:    { label: 'Pausada',              color: '#4a5568', bg: '#edf2f7' },
  cancelled: { label: 'Cancelada',            color: '#a03027', bg: '#fdecea' },
};

/** What the customer pays each month, including delivery for their area. */
export const monthlyTotal = (plan: SubscriptionPlan, boxesPerWeek: number, deliveryFee: number) =>
  plan.monthly_price * boxesPerWeek + deliveryFee * 4;

/** Savings against paying the full per-box price every week. */
export const monthlySavings = (plan: SubscriptionPlan, basePricePerBox: number, boxesPerWeek: number) =>
  Math.max(0, (basePricePerBox - plan.price_per_box) * 4 * boxesPerWeek);

export const DIETARY_FIELDS = [
  { key: 'is_vegan', label: 'Vegano' },
  { key: 'is_gluten_free', label: 'Sem Glúten' },
  { key: 'is_sugar_free', label: 'Sem Açúcar' },
  { key: 'is_salt_free', label: 'Sem Sal' },
  { key: 'is_oil_free', label: 'Sem Óleo' },
] as const;

export type DietaryKey = typeof DIETARY_FIELDS[number]['key'];

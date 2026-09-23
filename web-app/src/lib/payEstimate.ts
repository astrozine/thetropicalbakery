/**
 * Reference figures for the pay estimator on /trabalhe-conosco.
 *
 * IMPORTANT: `MINIMUM_WAGE` is set by federal decree at the start of each
 * year (R$1.518,00 was the 2025 figure — the last one confirmed as of this
 * writing). Whoever maintains the site should update it every January to
 * that year's official salário mínimo before candidates rely on it.
 *
 * The estimator exists to give candidates an honest, order-of-magnitude
 * sense of pay under Brazilian labour law (CLT) for informal/part-time
 * kitchen and delivery work — never a binding offer. The actual number is
 * always confirmed one-on-one at hiring.
 */
export const MINIMUM_WAGE = 1518; // R$ — update every January

/** The standard CLT monthly-hours divisor used to derive an hourly rate from a monthly salary. */
export const MONTHLY_HOURS_DIVISOR = 220;

export const WEEKS_PER_MONTH = 4.33;

export interface PayBreakdown {
  hourlyRate: number;
  weeklyPay: number;
  monthlyPay: number;
  /** 13º salário accrues at 1/12 of one month's pay per month worked. */
  thirteenthPerMonth: number;
  /** Férias + 1/3 also accrues at roughly 1/12 of one month's pay (plus the constitutional third) per month worked. */
  vacationPerMonth: number;
  /** FGTS: 8% of monthly pay, deposited by the employer into the worker's account — not part of take-home pay. */
  fgtsPerMonth: number;
}

export function estimatePay(daysPerWeek: number, hoursPerDay: number): PayBreakdown {
  const hourlyRate = MINIMUM_WAGE / MONTHLY_HOURS_DIVISOR;
  const weeklyHours = daysPerWeek * hoursPerDay;
  const weeklyPay = hourlyRate * weeklyHours;
  const monthlyPay = weeklyPay * WEEKS_PER_MONTH;

  return {
    hourlyRate,
    weeklyPay,
    monthlyPay,
    thirteenthPerMonth: monthlyPay / 12,
    vacationPerMonth: (monthlyPay / 12) * (4 / 3),
    fgtsPerMonth: monthlyPay * 0.08,
  };
}

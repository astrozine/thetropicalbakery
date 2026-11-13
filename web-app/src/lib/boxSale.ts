/**
 * Is Dolly selling the weekly tasting box right now? (Andrew, 2026-11-13: no.)
 * While false: the "Caixa de Degustação" menu is hidden, the footer points to events instead,
 * and /caixas and /assinatura send visitors to the box showcase on the home page
 * (that redirect lives in next.config.ts; flip it there too).
 * Nothing is deleted: set this to true (and remove the redirects) to bring the box back.
 */
export const BOX_SALE_ON = false;

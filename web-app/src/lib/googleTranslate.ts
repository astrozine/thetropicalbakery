/**
 * Google Translate keeps the chosen language in a `googtrans` cookie, and it may write that cookie on the
 * page's host AND on every parent domain (on www.thetropicalbakery.com it also lands on
 * .thetropicalbakery.com). Back to Portuguese only works if every copy is gone, so expire it on the host
 * and on each parent domain, with and without the leading dot.
 */
export function clearGoogleTranslate() {
  const expire = 'expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = `googtrans=; ${expire}`;
  const parts = window.location.hostname.split('.');
  for (let i = 0; i < parts.length - 1; i++) {
    const domain = parts.slice(i).join('.');
    document.cookie = `googtrans=; ${expire} domain=${domain};`;
    document.cookie = `googtrans=; ${expire} domain=.${domain};`;
  }
}

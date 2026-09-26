/**
 * Branded replacements for window.alert / window.confirm.
 * <BrandDialogHost /> (mounted once in the root layout) listens and draws the popup.
 * If the host isn't mounted (server render, very early click) we fall back to the browser's own dialog
 * so a message is never lost.
 */

export type BrandDialogRequest = {
  kind: 'alert' | 'confirm';
  message: string;
  title?: string;
  icon?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button, for deletes. */
  danger?: boolean;
  resolve: (ok: boolean) => void;
};

export type BrandDialogOptions = Partial<Pick<BrandDialogRequest, 'title' | 'icon' | 'confirmLabel' | 'cancelLabel' | 'danger'>>;

let listener: ((req: BrandDialogRequest) => void) | null = null;

export function registerBrandDialog(fn: ((req: BrandDialogRequest) => void) | null) {
  listener = fn;
}

export function brandAlert(message: string, opts: BrandDialogOptions = {}): Promise<void> {
  return new Promise(resolve => {
    if (!listener) {
      if (typeof window !== 'undefined') window.alert(message);
      resolve();
      return;
    }
    listener({ kind: 'alert', message, ...opts, resolve: () => resolve() });
  });
}

export function brandConfirm(message: string, opts: BrandDialogOptions = {}): Promise<boolean> {
  return new Promise(resolve => {
    if (!listener) {
      resolve(typeof window !== 'undefined' ? window.confirm(message) : false);
      return;
    }
    listener({ kind: 'confirm', message, ...opts, resolve });
  });
}

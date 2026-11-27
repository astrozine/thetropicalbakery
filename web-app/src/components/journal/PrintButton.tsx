'use client';

export default function PrintButton({ label }: { label: string }) {
  return <button type="button" className="rj-pill rj-noprint" onClick={() => window.print()}>{label}</button>;
}

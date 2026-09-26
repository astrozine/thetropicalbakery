import React from 'react';
import Link from 'next/link';

/**
 * The footer for the back-office pages: one slim line instead of the public footer's photo, columns and
 * newsletter. It sits at the bottom of the window when a page is short and simply follows the content when a
 * page is long (the inbox), because it is the last thing in the page and the admin fills the space above it.
 */
export default function AdminFooter() {
  return (
    <footer style={{
      background: '#f5f6fa', borderTop: '1px solid #dfe4ea', color: '#7f8c8d',
      padding: '0 1.25rem', minHeight: '44px',
      display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.25rem 1rem',
      fontSize: '0.8rem',
    }}>
      <span>&copy; {new Date().getFullYear()} The Tropical Bakery · Painel administrativo</span>
      <span style={{ display: 'inline-flex', gap: '0.25rem' }}>
        <Link href="/" style={{ color: '#5d6d7e', padding: '0.8rem 0.5rem', textDecoration: 'none' }}>Ver o site</Link>
        <Link href="/privacidade" style={{ color: '#5d6d7e', padding: '0.8rem 0.5rem', textDecoration: 'none' }}>Privacidade</Link>
      </span>
    </footer>
  );
}

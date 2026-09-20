'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session && !pathname.includes('/login')) {
        router.push('/admin/login');
      } else {
        setUser(session?.user || null);
      }
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (!session && !pathname.includes('/login')) {
        router.push('/admin/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Carregando...</div>;
  }

  // If we are on the login page, just render the children without the admin sidebar
  if (pathname.includes('/login')) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f6fa' }}>
      {/* Admin Sidebar */}
      <aside style={{ width: '250px', background: '#2c3e50', color: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>The Tropical Bakery</h2>
          <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem' }}>Painel Administrativo</p>
        </div>
        
        <nav style={{ flex: 1, padding: '1.5rem 0' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>
              <Link href="/admin" style={{ display: 'block', padding: '0.8rem 1.5rem', color: pathname === '/admin' ? '#f1c40f' : 'white', textDecoration: 'none', background: pathname === '/admin' ? 'rgba(255,255,255,0.05)' : 'transparent' }}>
                Visão Geral
              </Link>
            </li>
            <li>
              <Link href="/admin/treats" style={{ display: 'block', padding: '0.8rem 1.5rem', color: pathname.includes('/treats') ? '#f1c40f' : 'white', textDecoration: 'none', background: pathname.includes('/treats') ? 'rgba(255,255,255,0.05)' : 'transparent' }}>
                Catálogo de Doces
              </Link>
            </li>
            <li>
              <Link href="/admin/crm" style={{ display: 'block', padding: '0.8rem 1.5rem', color: pathname.includes('/crm') ? '#f1c40f' : 'white', textDecoration: 'none', background: pathname.includes('/crm') ? 'rgba(255,255,255,0.05)' : 'transparent' }}>
                CRM & Campanhas
              </Link>
            </li>
          </ul>
        </nav>

        <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '1rem', wordBreak: 'break-all' }}>
            {user?.email}
          </div>
          <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', width: '100%', transition: 'all 0.2s' }}>
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}

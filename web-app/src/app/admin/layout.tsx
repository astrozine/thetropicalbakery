'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session && pathname !== '/admin/login') {
        router.push('/admin/login');
      } else {
        setUser(session?.user || null);
      }
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (!session && pathname !== '/admin/login') {
        router.push('/admin/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  if (loading && pathname !== '/admin/login') {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Carregando...</div>;
  }

  // If we are on the login page, don't show the sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const navItems = [
    { name: 'Visão Geral', path: '/admin' },
    { name: 'Caixas da Semana', path: '/admin/caixas' },
    { name: 'Catálogo de Doces', path: '/admin/treats' },
    { name: 'Cursos', path: '/admin/courses' },
    { name: 'Retiros (Imagens)', path: '/admin/retreats' },
    { name: 'Conteúdo do Site', path: '/admin/content' },
    { name: 'CRM & Campanhas', path: '/admin/crm' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: '100vh', background: '#f5f6fa' }}>
      
      {/* Mobile Header */}
      {isMobile && (
        <header style={{ background: '#2c3e50', color: 'white', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)' }}>The Tropical Bakery</h2>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}
          >
            ☰
          </button>
        </header>
      )}

      {/* Sidebar Navigation */}
      <aside style={{ 
        width: '280px', 
        background: '#2c3e50', 
        color: 'white', 
        display: 'flex', 
        flexDirection: 'column',
        position: isMobile ? 'fixed' : 'static',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
        transform: isMobile ? (isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
        transition: 'transform 0.3s ease-in-out'
      }}>
        <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', letterSpacing: '1px' }}>
              The Tropical Bakery
            </h2>
            <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Painel Administrativo</span>
          </div>
          {isMobile && (
            <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
          )}
        </div>

        <nav style={{ flex: 1, padding: '1.5rem 0', overflowY: 'auto' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <li key={item.path}>
                  <Link href={item.path} 
                    onClick={() => { if(isMobile) setIsSidebarOpen(false); }}
                    style={{
                    display: 'block',
                    padding: '1rem 1.5rem',
                    color: isActive ? '#d4af37' : '#ecf0f1',
                    background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
                    textDecoration: 'none',
                    fontWeight: isActive ? 'bold' : 'normal',
                    borderLeft: isActive ? '4px solid #d4af37' : '4px solid transparent',
                    transition: 'all 0.2s'
                  }}>
                    {item.name}
                  </Link>
                </li>
              );
            })}
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

      {/* Backdrop for mobile */}
      {isMobile && isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
        />
      )}

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}

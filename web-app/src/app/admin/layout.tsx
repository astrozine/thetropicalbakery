'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

/**
 * Asks the database whether the signed-in person is on the admin list.
 *
 * Being signed in is NOT enough — customers sign in too, and without this
 * check any of them could open /admin and read the whole customer database.
 *
 * If the security migration hasn't been run yet the function doesn't exist, so
 * we report 'unprotected' and let the owner in with a warning rather than
 * locking them out of their own panel.
 */
async function checkAdminAccess(): Promise<'allowed' | 'denied' | 'unprotected'> {
  const { data, error } = await supabase.rpc('is_admin');

  if (error) {
    const missing = error.code === 'PGRST202' || /does not exist|not found/i.test(error.message);
    if (missing) return 'unprotected';
    console.error('Admin check failed:', error);
    return 'denied';
  }

  return data === true ? 'allowed' : 'denied';
}

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
  // 'allowed'        — on the admin list
  // 'denied'         — signed in, but not an admin
  // 'unprotected'    — the security migration hasn't been run yet
  const [access, setAccess] = useState<'checking' | 'allowed' | 'denied' | 'unprotected'>('checking');
  const [unreadCount, setUnreadCount] = useState(0);

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
        if (session) setAccess(await checkAdminAccess());
      }
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user || null);
      if (!session && pathname !== '/admin/login') {
        router.push('/admin/login');
      } else if (session) {
        setAccess(await checkAdminAccess());
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  // Slack-bell-style unread count for the inbox: total inbound items minus
  // however many have moved past "new" in inbox_status. Approximate but
  // cheap — the inbox page itself computes the exact per-item state.
  useEffect(() => {
    if (access !== 'allowed') return;
    const loadUnread = async () => {
      const [jobs, orders, courses, waitlist, handled] = await Promise.all([
        supabase.from('job_applications').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('course_registrations').select('id', { count: 'exact', head: true }),
        supabase.from('waitlist').select('id', { count: 'exact', head: true }),
        supabase.from('inbox_status').select('source_id', { count: 'exact', head: true }).neq('status', 'new'),
      ]);
      const total = (jobs.count || 0) + (orders.count || 0) + (courses.count || 0) + (waitlist.count || 0);
      setUnreadCount(Math.max(0, total - (handled.count || 0)));
    };
    loadUnread();
  }, [access]);

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

  if (access === 'checking') {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Verificando acesso...</div>;
  }

  // Signed in, but not on the admin list — a customer account, most likely.
  if (access === 'denied') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f6fa', padding: '2rem' }}>
        <div style={{ background: 'white', padding: '2.5rem', borderRadius: '12px', maxWidth: '440px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <h1 style={{ fontSize: '1.5rem', color: '#2c3e50', marginBottom: '1rem' }}>Acesso Restrito</h1>
          <p style={{ color: '#7f8c8d', lineHeight: 1.7, marginBottom: '1.5rem' }}>
            Esta área é só para a equipe da Tropical Bakery. A conta{' '}
            <strong style={{ color: '#2c3e50', wordBreak: 'break-all' }}>{user?.email || user?.phone}</strong>{' '}
            não tem permissão de administrador.
          </p>
          <button onClick={handleLogout} style={{ background: '#2c3e50', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            Entrar com outra conta
          </button>
          <p style={{ marginTop: '1.5rem' }}>
            <Link href="/" style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>← Voltar para o site</Link>
          </p>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'Visão Geral', path: '/admin' },
    { name: 'Caixa de Entrada', path: '/admin/inbox', badge: unreadCount },
    { name: 'Calendário de Entregas', path: '/admin/calendario' },
    { name: 'Assinaturas', path: '/admin/assinaturas' },
    { name: 'Caixas da Semana', path: '/admin/caixas' },
    { name: 'Fila de Espera', path: '/admin/waitlist' },
    { name: 'Inscrições em Cursos', path: '/admin/inscricoes' },
    { name: 'Catálogo de Doces', path: '/admin/treats' },
    { name: 'Cursos', path: '/admin/courses' },
    { name: 'Retiros (Imagens)', path: '/admin/retreats' },
    { name: 'Manutenção & Reparos', path: '/admin/manutencao' },
    { name: 'Anúncio Especial', path: '/admin/anuncio' },
    { name: 'CRM & Campanhas', path: '/admin/crm' },
    { name: 'Candidaturas', path: '/admin/vagas' },
    { name: 'Administradores', path: '/admin/administradores' },
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
        zIndex: 99999,
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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 1.5rem',
                    color: isActive ? '#d4af37' : '#ecf0f1',
                    background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
                    textDecoration: 'none',
                    fontWeight: isActive ? 'bold' : 'normal',
                    borderLeft: isActive ? '4px solid #d4af37' : '4px solid transparent',
                    transition: 'all 0.2s'
                  }}>
                    <span>{item.name}</span>
                    {!!item.badge && (
                      <span style={{ background: '#e74c3c', color: 'white', fontSize: '0.72rem', fontWeight: 'bold', padding: '0.15rem 0.5rem', borderRadius: '20px', minWidth: '18px', textAlign: 'center' }}>
                        {item.badge}
                      </span>
                    )}
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
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99998 }}
        />
      )}

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        {access === 'unprotected' && (
          <div style={{
            background: '#fff4e5', border: '1px solid #ffb74d', borderLeft: '5px solid #f57c00',
            borderRadius: '8px', padding: '1rem 1.25rem', marginBottom: '2rem', color: '#7a4a00', lineHeight: 1.6,
          }}>
            <strong>Atenção: esta área ainda não está protegida.</strong><br />
            Qualquer cliente que entre no site pode abrir este painel e ver a lista de clientes.
            Rode o arquivo <code>migration_02_accounts_and_security.sql</code> no SQL Editor do
            Supabase para corrigir isso.
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

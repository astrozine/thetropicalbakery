'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import AdminSidebarNav from './AdminSidebarNav';
import { NEW_BOX_PATH } from './adminNav';

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
  const [partnerCount, setPartnerCount] = useState(0);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  // The little account menu closes when you click anywhere else, or press Escape.
  useEffect(() => {
    if (!accountOpen) return;
    const away = (e: MouseEvent) => { if (!accountRef.current?.contains(e.target as Node)) setAccountOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAccountOpen(false); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [accountOpen]);

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

      // Partners waiting for approval + restock requests nobody has answered.
      const [pending, restock] = await Promise.all([
        supabase.from('partners').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
        supabase.from('partner_restock_requests').select('id', { count: 'exact', head: true }).eq('status', 'novo'),
      ]);
      setPartnerCount((pending.count || 0) + (restock.count || 0));
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

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: '100vh', background: '#f5f6fa' }}>
      {/* The sidebar is fixed, so on desktop the whole page (announcement bar, header, content,
          footer) gets the sidebar's width as a left margin and flows in the column beside it. */}
      {!isMobile && <style>{'body { padding-left: 280px; }'}</style>}

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
        background: '#22323f', 
        color: 'white', 
        display: 'flex', 
        flexDirection: 'column',
        // Locked to the window on every screen, top to bottom: the page (site header, content and
        // footer) scrolls past it, the menu scrolls inside it, and the account chip stays put at the
        // bottom. On desktop the page is nudged right by the <style> below to make room for it.
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        height: '100dvh',
        overflow: 'hidden',
        flexShrink: 0,
        zIndex: 99999,
        transform: isMobile ? (isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
        transition: 'transform 0.3s ease-in-out'
      }}>
        <div style={{ padding: '1.6rem 1.5rem 1.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
        {/* 70s stripe */}
        <div aria-hidden style={{ height: '6px', background: 'linear-gradient(90deg, #f4c542 0 25%, #e2792a 25% 50%, #d9453a 50% 75%, #9bab3c 75% 100%)' }} />

        <AdminSidebarNav pathname={pathname} unreadCount={unreadCount} partnerCount={partnerCount} onNavigate={() => { if (isMobile) setIsSidebarOpen(false); }} />

        {/* Account chip: who is signed in, and Sair one deliberate click away (never a bare button in the list). */}
        <div ref={accountRef} style={{ position: 'relative', padding: '0.75rem 0.9rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {accountOpen && (
            <div role="menu" style={{ position: 'absolute', left: '0.9rem', right: '0.9rem', bottom: 'calc(100% - 0.25rem)', background: '#2e455c', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: '0.4rem', boxShadow: '0 -10px 28px rgba(0,0,0,0.35)' }}>
              <Link href="/" role="menuitem" style={{ display: 'block', padding: '0.6rem 0.8rem', borderRadius: '8px', color: '#dfe7ee', textDecoration: 'none', fontSize: '0.9rem' }}>
                🌐 Ver o site
              </Link>
              <button role="menuitem" onClick={handleLogout} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.6rem 0.8rem', borderRadius: '8px', background: 'transparent', border: 'none', color: '#ffb4ab', cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'inherit' }}>
                🚪 Sair da conta
              </button>
            </div>
          )}
          <button type="button" onClick={() => setAccountOpen(o => !o)} aria-haspopup="menu" aria-expanded={accountOpen}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.5rem 0.6rem', background: accountOpen ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', borderRadius: '10px', cursor: 'pointer', color: '#fff', textAlign: 'left', fontFamily: 'inherit' }}>
            <span aria-hidden style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: '#f4c542', color: '#3c2a21', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
              {(user?.email || '?')[0].toUpperCase()}
            </span>
            <span style={{ flex: 1, minWidth: 0, fontSize: '0.8rem', opacity: 0.85, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</span>
            <span aria-hidden style={{ fontSize: '0.7rem', opacity: 0.7, transform: accountOpen ? 'rotate(180deg)' : 'none' }}>▲</span>
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
      <main style={{ flex: 1, padding: isMobile ? '1.25rem 1rem 6.5rem' : '2rem', overflowX: 'clip', minWidth: 0 }}>
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

      {/* Phones: the four things that matter live in a thumb-reach bar, with the big + in the middle. */}
      {isMobile && (
        <nav aria-label="Atalhos principais" style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'grid', gridTemplateColumns: '1fr 1fr 72px 1fr 1fr', alignItems: 'end',
          background: '#22323f', borderTop: '1px solid rgba(255,255,255,0.12)', padding: '0.4rem 0.25rem calc(0.4rem + env(safe-area-inset-bottom))',
          boxShadow: '0 -6px 20px rgba(0,0,0,0.25)',
        }}>
          {([
            { href: '/admin', emoji: '🏠', label: 'Início', badge: 0 },
            { href: '/admin/inbox', emoji: '📥', label: 'Entrada', badge: unreadCount },
          ] as const).map(t => <TabLink key={t.href} {...t} active={pathname === t.href} />)}

          <Link href={NEW_BOX_PATH} aria-label="Nova caixa da semana" style={{
            justifySelf: 'center', marginTop: '-1.6rem', width: '60px', height: '60px', borderRadius: '50%', textDecoration: 'none',
            background: 'linear-gradient(135deg, #f4c542, #e2a52a)', color: '#3c2a21', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.4rem', fontWeight: 300, lineHeight: 1, paddingBottom: '0.3rem', border: '4px solid #22323f', boxShadow: '0 6px 14px rgba(0,0,0,0.4)',
          }}>+</Link>

          {([
            { href: '/admin/crm', emoji: '💌', label: 'Clientes', badge: 0 },
            { href: '/admin/parceiros', emoji: '🤝', label: 'Parceiros', badge: partnerCount },
          ] as const).map(t => <TabLink key={t.href} {...t} active={pathname === t.href} />)}
        </nav>
      )}
    </div>
  );
}

function TabLink({ href, emoji, label, badge, active }: { href: string; emoji: string; label: string; badge: number; active: boolean }) {
  return (
    <Link href={href} aria-current={active ? 'page' : undefined} style={{
      position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem', padding: '0.3rem 0.2rem', textDecoration: 'none',
      color: active ? '#f4c542' : '#c9d5df', fontSize: '0.68rem', fontWeight: active ? 800 : 600,
    }}>
      <span aria-hidden style={{ fontSize: '1.4rem', lineHeight: 1.1 }}>{emoji}</span>
      {label}
      {badge > 0 && (
        <span style={{ position: 'absolute', top: '0.05rem', right: 'calc(50% - 1.5rem)', background: '#e74c3c', color: '#fff', fontSize: '0.62rem', fontWeight: 800, minWidth: '17px', textAlign: 'center', padding: '0.05rem 0.3rem', borderRadius: '999px' }}>{badge}</span>
      )}
    </Link>
  );
}

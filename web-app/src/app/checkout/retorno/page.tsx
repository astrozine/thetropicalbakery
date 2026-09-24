'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const STORE_WHATSAPP = '5511932119196';

type Phase = 'checking' | 'paid' | 'waiting' | 'failed' | 'cancelled' | 'unknown';

/** Where Mercado Pago and PayPal send the customer back to after paying. */
function ReturnInner() {
  const q = useSearchParams();
  const provider = q.get('provider') === 'paypal' ? 'paypal' : 'mercadopago';
  const ref = q.get('ref') || '';
  const result = q.get('result') || '';
  const paypalToken = q.get('token') || '';
  // Mercado Pago puts the payment number in one of these two.
  const mpPaymentId = q.get('payment_id') || q.get('collection_id') || '';

  const [phase, setPhase] = useState<Phase>('checking');
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState('');
  const ran = useRef(false);

  const check = useCallback(async () => {
    try {
      const r = await fetch(`/api/pay/status?ref=${encodeURIComponent(ref)}`, { cache: 'no-store' });
      const j = await r.json();
      if (!j.found) return 'unknown' as const;
      return j.paid ? ('paid' as const) : ('waiting' as const);
    } catch { return 'waiting' as const; }
  }, [ref]);

  useEffect(() => {
    if (ran.current || !ref) { if (!ref) setPhase('unknown'); return; }
    ran.current = true;
    let cancelled = false;

    (async () => {
      if (provider === 'paypal') {
        if (result === 'cancel') { setPhase('cancelled'); return; }
        if (paypalToken) {
          await fetch('/api/pay/paypal/capture', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: paypalToken, reference: ref }),
          }).catch(() => null);
        }
      } else if (mpPaymentId) {
        await fetch('/api/pay/mercadopago/confirm', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment_id: mpPaymentId }),
        }).catch(() => null);
      }

      // Card payments can take a few seconds to be approved: ask a few times.
      for (let i = 0; i < 10 && !cancelled; i++) {
        const s = await check();
        if (s === 'paid' || s === 'unknown') { setPhase(s); return; }
        if (i === 0 && result === 'failure') break;
        await new Promise(res => setTimeout(res, 3000));
      }
      if (!cancelled) setPhase(result === 'failure' ? 'failed' : 'waiting');
    })();

    return () => { cancelled = true; };
  }, [ref, provider, result, paypalToken, mpPaymentId, check]);

  const retry = async (which: 'mercadopago' | 'paypal') => {
    setRetrying(true);
    setError('');
    try {
      const r = await fetch(`/api/pay/${which}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reference: ref }) });
      const j = await r.json();
      if (!r.ok || !j.url) throw new Error(j.error || 'Não foi possível abrir o pagamento.');
      window.location.href = j.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível abrir o pagamento.');
      setRetrying(false);
    }
  };

  const wa = `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(`Olá Tropical Bakery! Sobre o meu pedido ${ref}.`)}`;

  const box: React.CSSProperties = { maxWidth: '620px', margin: '0 auto', padding: 'clamp(1.75rem, 4vw, 3rem)', textAlign: 'center' };
  const h: React.CSSProperties = { fontFamily: 'var(--font-heading)', fontWeight: 'bold', color: 'var(--color-primary)', fontSize: 'clamp(1.7rem, 5vw, 2.4rem)', marginBottom: '0.75rem' };
  const p: React.CSSProperties = { color: 'var(--color-text)', lineHeight: 1.8, marginBottom: '1.5rem' };

  return (
    <main style={{ minHeight: '100vh', paddingTop: '9rem', paddingBottom: '4rem', paddingLeft: '1rem', paddingRight: '1rem', backgroundColor: 'var(--color-background)' }}>
      <div className="liquid-glass-card" style={box}>
        {phase === 'checking' && (
          <>
            <p style={{ fontSize: '2.6rem', marginBottom: '0.5rem' }}>⏳</p>
            <h1 style={h}>Confirmando seu pagamento…</h1>
            <p style={p}>Só um instante, estamos conferindo com o {provider === 'paypal' ? 'PayPal' : 'Mercado Pago'}. Não feche esta página.</p>
          </>
        )}

        {phase === 'paid' && (
          <>
            <p style={{ fontSize: '2.6rem', marginBottom: '0.5rem' }}>🎉</p>
            <h1 style={h}>Pagamento confirmado!</h1>
            <p style={p}>Muito obrigada! Seu pedido já está com a gente e começa a ser preparado. Se você escolheu retirar, o endereço aparece agora em <strong>Minha Conta</strong>.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/minha-conta" className="btn btn-primary" style={{ padding: '0.9rem 1.6rem' }}>Ver minha conta</Link>
              <Link href="/" className="btn btn-secondary" style={{ padding: '0.9rem 1.6rem' }}>Voltar ao início</Link>
            </div>
          </>
        )}

        {phase === 'waiting' && (
          <>
            <p style={{ fontSize: '2.6rem', marginBottom: '0.5rem' }}>🕐</p>
            <h1 style={h}>Estamos aguardando a confirmação</h1>
            <p style={p}>Seu pedido está registrado. Alguns pagamentos demoram uns minutos para o banco aprovar. Assim que confirmar, a gente começa o preparo — sem você precisar fazer nada.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ padding: '0.9rem 1.6rem' }}>Conferir de novo</button>
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.9rem 1.6rem' }}>Falar no WhatsApp</a>
            </div>
          </>
        )}

        {(phase === 'failed' || phase === 'cancelled') && (
          <>
            <p style={{ fontSize: '2.6rem', marginBottom: '0.5rem' }}>😕</p>
            <h1 style={h}>{phase === 'cancelled' ? 'Pagamento cancelado' : 'O pagamento não foi aprovado'}</h1>
            <p style={p}>Nada foi cobrado. Seu pedido continua guardado — você pode tentar de novo, com outro cartão ou outra forma de pagamento.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <button disabled={retrying} onClick={() => retry('mercadopago')} className="btn btn-primary" style={{ padding: '0.9rem 1.6rem' }}>💳 Tentar com cartão</button>
              <button disabled={retrying} onClick={() => retry('paypal')} className="btn btn-secondary" style={{ padding: '0.9rem 1.6rem' }}>PayPal</button>
            </div>
            {error && <p style={{ color: '#c0392b', fontSize: '0.9rem', marginBottom: '1rem' }}>{error}</p>}
            <a href={wa} target="_blank" rel="noopener noreferrer" style={{ color: '#a6832b', fontWeight: 700 }}>Prefere pagar por Pix? Fale com a gente no WhatsApp</a>
          </>
        )}

        {phase === 'unknown' && (
          <>
            <p style={{ fontSize: '2.6rem', marginBottom: '0.5rem' }}>🤔</p>
            <h1 style={h}>Não encontramos este pedido</h1>
            <p style={p}>Se você acabou de pagar, não se preocupe: fale com a gente no WhatsApp e confirmamos na hora.</p>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '0.9rem 1.6rem' }}>Falar no WhatsApp</a>
          </>
        )}
      </div>
    </main>
  );
}

export default function CheckoutReturnPage() {
  return (
    <Suspense fallback={null}>
      <ReturnInner />
    </Suspense>
  );
}

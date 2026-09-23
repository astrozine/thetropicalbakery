import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Política de Privacidade | The Tropical Bakery',
  description: 'Como a The Tropical Bakery coleta, usa e protege os dados dos seus clientes.',
};

const sectionStyle: React.CSSProperties = { marginBottom: '2.5rem' };
const h2Style: React.CSSProperties = { fontSize: '1.5rem', color: 'var(--color-primary)', fontFamily: 'var(--font-heading)', marginBottom: '1rem' };
const pStyle: React.CSSProperties = { color: '#594a42', lineHeight: '1.8', marginBottom: '1rem' };
const liStyle: React.CSSProperties = { color: '#594a42', lineHeight: '1.8', marginBottom: '0.5rem' };

export default function PrivacyPolicyPage() {
  return (
    <main style={{ minHeight: '100vh', paddingTop: '8rem', paddingBottom: '6rem', background: 'var(--color-background)' }}>
      <div className="container" style={{ maxWidth: '820px', margin: '0 auto', padding: '0 1.5rem' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
          Política de Privacidade
        </h1>
        <p style={{ color: '#7a6a61', marginBottom: '3rem', fontSize: '0.9rem' }}>
          Última atualização: {new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <section style={sectionStyle}>
          <p style={pStyle}>
            A The Tropical Bakery ("nós") respeita a privacidade de quem visita e faz pedidos no nosso site.
            Esta página explica quais dados coletamos, por que coletamos, como eles são armazenados e quais
            direitos você tem sobre eles, em conformidade com a Lei Geral de Proteção de Dados (LGPD).
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>1. Quais dados coletamos</h2>
          <p style={pStyle}>Coletamos apenas o necessário para preparar e entregar seu pedido, e para manter contato sobre ele:</p>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
            <li style={liStyle}>Nome completo</li>
            <li style={liStyle}>Número de WhatsApp</li>
            <li style={liStyle}>E-mail</li>
            <li style={liStyle}>Endereço de entrega e região</li>
            <li style={liStyle}>Restrições e preferências alimentares (vegano, sem glúten, sem açúcar, sem sal, sem óleo refinado)</li>
            <li style={liStyle}>Data desejada para entrega, curso ou retiro</li>
          </ul>
          <p style={pStyle}>
            Se você optar por entrar com Google ou Facebook para não precisar preencher esses dados a cada
            pedido, recebemos do provedor apenas seu nome, e-mail e foto de perfil — nunca sua senha.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>2. Como usamos seus dados</h2>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li style={liStyle}>Processar e entregar seu pedido, curso ou reserva de retiro</li>
            <li style={liStyle}>Entrar em contato pelo WhatsApp para confirmar detalhes do pedido</li>
            <li style={liStyle}>Preencher automaticamente seus dados em pedidos futuros, para agilizar seu checkout</li>
            <li style={liStyle}>Notificar sobre novos lotes de Caixas de Degustação, se você entrar na lista de espera</li>
          </ul>
          <p style={pStyle}>Não vendemos nem alugamos seus dados a terceiros para fins de marketing.</p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>3. Onde seus dados ficam armazenados</h2>
          <p style={pStyle}>
            Seus dados são armazenados com segurança na infraestrutura da Supabase, com controle de acesso
            restrito (Row Level Security) para que cada cliente só possa acessar suas próprias informações.
            Usamos ainda:
          </p>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li style={liStyle}><strong>Google e Facebook</strong> — apenas se você optar por entrar com essas contas</li>
            <li style={liStyle}><strong>WhatsApp/Twilio</strong> — para enviar confirmações e notificações sobre seu pedido</li>
            <li style={liStyle}><strong>Google Translate</strong> — para traduzir o conteúdo do site para visitantes de outros idiomas</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>4. Cookies e armazenamento local</h2>
          <p style={pStyle}>
            Usamos o armazenamento local do seu navegador (localStorage) para lembrar os itens do seu
            carrinho e os dados já preenchidos em um checkout anterior, para que você não precise digitá-los
            novamente. Essas informações ficam apenas no seu navegador e não são compartilhadas.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>5. Seus direitos</h2>
          <p style={pStyle}>Você pode, a qualquer momento, solicitar:</p>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li style={liStyle}>Acesso aos dados que temos sobre você</li>
            <li style={liStyle}>Correção de dados incorretos ou desatualizados</li>
            <li style={liStyle}>Exclusão da sua conta e dos seus dados</li>
          </ul>
          <p style={pStyle}>
            Para qualquer uma dessas solicitações, entre em contato pelo{' '}
            <a href="https://wa.me/5511932119196" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>
              WhatsApp
            </a>.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>6. Alterações a esta política</h2>
          <p style={pStyle}>
            Podemos atualizar esta política periodicamente para refletir mudanças em como operamos o site.
            A data no topo desta página sempre indica a versão mais recente.
          </p>
        </section>

        <Link href="/" style={{ color: 'var(--color-secondary)', fontWeight: 600, textDecoration: 'none' }}>
          ← Voltar para o início
        </Link>
      </div>
    </main>
  );
}

/**
 * The admin sections, grouped by what you're trying to do. One list feeds both the sidebar menu and
 * the big-button quick menu on the overview page, so a new section only has to be added here.
 */

export interface NavItem {
  name: string;
  path: string;
  emoji: string;
  /** Plain-words explanation, shown on hover. */
  hint: string;
  badge?: number;
}

export interface NavGroup {
  id: string;
  name: string;
  emoji: string;
  /** Retro-70s accent for this group. */
  accent: string;
  /** A slightly different shade of the sidebar blue for this group's panel. */
  shade: string;
  items: NavItem[];
}

export const PINNED: Omit<NavItem, 'badge'>[] = [
  { name: 'Visão Geral', path: '/admin', emoji: '🏠', hint: 'Resumo do que está acontecendo' },
  { name: 'Caixa de Entrada', path: '/admin/inbox', emoji: '📥', hint: 'Tudo o que chega do site: pedidos, candidaturas, contatos' },
];

export const buildGroups = (): NavGroup[] => [
  {
    id: 'pedidos', name: 'Pedidos & Entregas', emoji: '🚚', accent: '#e2792a', shade: '#2a3d52',
    items: [
      { name: 'Calendário de Entregas', path: '/admin/calendario', emoji: '📅', hint: 'Em quais dias as caixas saem (toda sexta, dias soltos…)' },
      { name: 'Assinaturas', path: '/admin/assinaturas', emoji: '🔁', hint: 'Quem assina a caixa semanal' },
      { name: 'Fila de Espera', path: '/admin/waitlist', emoji: '⏳', hint: 'Gente esperando o próximo lote' },
    ],
  },
  {
    id: 'doces', name: 'Doces & Caixas', emoji: '🍫', accent: '#f4c542', shade: '#2e455c',
    items: [
      { name: 'Caixas de Degustação', path: '/admin/caixas', emoji: '📦', hint: 'Criar a caixa da semana com cada doce, ingredientes e alérgenos' },
      { name: 'Menu de Eventos (doces)', path: '/admin/treats', emoji: '🧁', hint: 'O catálogo de doces para eventos e atacado' },
    ],
  },
  {
    id: 'cursos', name: 'Cursos & Retiros', emoji: '🌴', accent: '#d9453a', shade: '#324c66',
    items: [
      { name: 'Cursos', path: '/admin/courses', emoji: '🎓', hint: 'Criar e editar os cursos' },
      { name: 'Inscrições em Cursos', path: '/admin/inscricoes', emoji: '✍️', hint: 'Quem se inscreveu' },
      { name: 'Retiros: fotos e preços', path: '/admin/retreats', emoji: '🏝️', hint: 'Fotos, diárias e capacidade das acomodações' },
    ],
  },
  {
    id: 'divulgacao', name: 'Divulgação', emoji: '📣', accent: '#9bab3c', shade: '#36536f',
    items: [
      { name: 'E-mails', path: '/admin/emails', emoji: '✉️', hint: 'Escrever e enviar e-mails para clientes, parceiros e candidatos' },
      { name: 'Faixa de Anúncio', path: '/admin/anuncio', emoji: '🎉', hint: 'O aviso especial que aparece no topo da página inicial' },
      { name: 'Clientes & Campanhas', path: '/admin/crm', emoji: '💌', hint: 'Lista de clientes e mensagens em massa' },
      { name: 'Parceiros B2B', path: '/admin/parceiros', emoji: '🤝', hint: 'Hotéis, pousadas, restaurantes, afiliados e os pedidos de reposição' },
    ],
  },
  {
    id: 'equipe', name: 'Equipe & Casa', emoji: '🏡', accent: '#5aa9e6', shade: '#3a5a78',
    items: [
      { name: 'Escala da Equipe', path: '/admin/equipe', emoji: '📋', hint: 'Quem trabalha com a gente, turnos e pagamento' },
      { name: 'Candidaturas de Emprego', path: '/admin/vagas', emoji: '🧑‍🍳', hint: 'Pessoas que querem trabalhar com a gente' },
      { name: 'Contatos de Reparos', path: '/admin/manutencao', emoji: '🔧', hint: 'Encanador, eletricista, geladeira, forno…' },
      { name: 'Administradores', path: '/admin/administradores', emoji: '🔑', hint: 'Quem pode entrar neste painel' },
    ],
  },
];

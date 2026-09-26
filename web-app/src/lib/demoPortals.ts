import type { Partner, RestockRequest, Worker, WorkShift } from '@/lib/portals';

/**
 * Made-up people for "Ver como", so the partner and staff areas can be looked at without
 * registering anyone. Their ids start with `demo-`; the portals read them from here, never
 * from the database, and only for an admin.
 */

const iso = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const stamp = (offset: number) => new Date(Date.now() + offset * 86400000).toISOString();

export const isDemoId = (id: string | null | undefined): id is string => !!id && id.startsWith('demo-');

export const DEMO_PARTNERS: Partner[] = [
  {
    id: 'demo-pousada', business_name: 'Pousada Vila dos Corais', kind: 'pousada', contact_name: 'Marina Albuquerque',
    email: 'marina@viladoscorais.example', whatsapp: '5511987654321',
    address: 'Rua das Gaivotas, 128', neighborhood: 'Praia do Forte', commission_pct: 20, affiliate_code: null,
    monthly_goal: 6, status: 'ativo', notes: 'Exemplo',
    portal_message: 'Oi, Marina! Os bolos de banana foram um sucesso na semana passada, obrigada por indicar aos hóspedes. Já separei a próxima leva para quinta. 🍌',
    created_at: stamp(-90),
  },
  {
    id: 'demo-afiliada', business_name: 'Camila Duarte (@camilaviaja)', kind: 'afiliado', contact_name: 'Camila Duarte',
    email: 'camila@camilaviaja.example', whatsapp: '5511976543210', address: null, neighborhood: null,
    commission_pct: 10, affiliate_code: 'CAMILA10', monthly_goal: 0, status: 'ativo', notes: 'Exemplo',
    portal_message: 'Camila, seu código passou de 20 pedidos este mês. Parabéns! 🎉',
    created_at: stamp(-45),
  },
  {
    id: 'demo-pendente', business_name: 'Café do Mirante', kind: 'restaurante', contact_name: 'Paulo Henrique Sousa',
    email: 'paulo@cafedomirante.example', whatsapp: '5511965432109', address: 'Av. Beira Mar, 900', neighborhood: 'Centro',
    commission_pct: 15, affiliate_code: null, monthly_goal: 4, status: 'pendente', notes: 'Exemplo',
    portal_message: null, created_at: stamp(-2),
  },
];

const req = (id: string, partner_id: string, items: string, status: RestockRequest['status'], ago: number, notes: string | null = null, wanted: number | null = null): RestockRequest =>
  ({ id, partner_id, items, notes, wanted_date: wanted === null ? null : iso(wanted), status, created_at: stamp(-ago) });

export const DEMO_RESTOCKS: RestockRequest[] = [
  req('demo-r1', 'demo-pousada', '12 fatias de bolo de banana com canela\n6 brownies', 'novo', 1, 'Chegam hóspedes novos no sábado.', 3),
  req('demo-r2', 'demo-pousada', '10 fatias de bolo de cenoura', 'confirmado', 4, null, 1),
  req('demo-r3', 'demo-pousada', '12 fatias de bolo de banana', 'entregue', 9),
  req('demo-r4', 'demo-pousada', '8 brownies + 8 cookies', 'entregue', 16),
  req('demo-r5', 'demo-pousada', '10 fatias de bolo de limão', 'entregue', 24),
];

export const DEMO_AFFILIATE = { orders_count: 23, revenue: 3187.5, commission: 318.75 };

export const DEMO_WORKERS: Worker[] = [
  {
    id: 'demo-cozinha', full_name: 'Rafael Monteiro', email: 'rafael@example.com', whatsapp: '5511954321098',
    role: 'cozinha', hourly_rate: 28, monthly_wage: 0, status: 'ativo', notes: 'Exemplo (paga por hora)',
    portal_message: 'Rafael, na sexta chega a farinha nova. Confere o estoque antes de começar as massas. 👩‍🍳', created_at: stamp(-120),
  },
  {
    id: 'demo-entregas', full_name: 'Juliana Prado', email: 'juliana@example.com', whatsapp: '5511943210987',
    role: 'entregas', hourly_rate: 0, monthly_wage: 2400, status: 'ativo', notes: 'Exemplo (salário mensal)',
    portal_message: null, created_at: stamp(-200),
  },
];

const shift = (n: number, worker_id: string, offset: number, start: string, end: string, task: string, status: WorkShift['status'], paid = false): WorkShift =>
  ({ id: `demo-s${n}`, worker_id, shift_date: iso(offset), start_time: start, end_time: end, task, status, paid, notes: null });

export const DEMO_SHIFTS: WorkShift[] = [
  ...[-6, -5, -4, -3, -2, -1].map((o, i) => shift(i + 1, 'demo-cozinha', o, '07:00', '13:00', i % 2 ? 'Massas e recheios' : 'Assar bolos e brownies', 'feito', i < 3)),
  shift(20, 'demo-cozinha', 1, '07:00', '13:00', 'Caixas de degustação', 'agendado'),
  shift(21, 'demo-cozinha', 2, '07:00', '12:00', 'Bolos para a pousada', 'agendado'),
  shift(22, 'demo-cozinha', 4, '08:00', '14:00', 'Menu de eventos: cupcakes', 'agendado'),
  shift(23, 'demo-cozinha', 6, '07:00', '13:00', 'Assar bolos e brownies', 'agendado'),
  ...[-4, -3, -2, -1].map((o, i) => shift(30 + i, 'demo-entregas', o, '14:00', '18:00', 'Entregas da tarde', 'feito', true)),
  shift(40, 'demo-entregas', 1, '14:00', '18:00', 'Entregas da tarde', 'agendado'),
  shift(41, 'demo-entregas', 3, '09:00', '13:00', 'Entrega nas pousadas', 'agendado'),
];

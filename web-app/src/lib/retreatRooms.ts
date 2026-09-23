/**
 * The Salt n' Paradise accommodations, with copy adapted from our own Airbnb
 * listings and photos taken from them (saved in /public/retreats/rooms).
 *
 * `dbId` links an entry to a row in `retreat_rooms`, so a photo list edited in
 * /admin/retreats overrides the defaults below without a code change.
 */
export interface RetreatRoomInfo {
  id: string;
  dbId: string | null;
  name: string;
  capacity: string;
  tagline: string;
  description: string;
  highlights: string[];
  amenities: string[];
  photos: string[];
  airbnbUrl: string;
}

const photos = (slug: string, n: number) =>
  Array.from({ length: n }, (_, i) => `/retreats/rooms/${slug}-${i + 1}.jpg`);

export const RETREAT_ROOMS: RetreatRoomInfo[] = [
  {
    id: 'house',
    dbId: 'house',
    name: 'A Casa Toda',
    capacity: 'Até 11 pessoas',
    tagline: 'Salt n’ Paradise inteira, só para o seu grupo.',
    description:
      'Uma casa de praia tropical moderna, a 100 metros do mar em Itamambuca, com três acomodações — a Cobertura para até 6, a Suíte Master para 3 e a Kitnet para 2. Jardim com bananeiras e flores exóticas, terraço amplo, lavanderia e chuveiro de praia ao ar livre. O lugar certo para retiros de grupo, famílias grandes e organizadores que querem a casa inteira para a experiência.',
    highlights: [
      'Três acomodações, até 11 pessoas',
      'A 100 m das ondas de Itamambuca',
      'Jardim, terraço e chuveiro ao ar livre',
      'Madeira nobre e arquitetura aberta, pensada contra o mofo',
    ],
    amenities: ['Ar-condicionado', 'Wi-Fi', 'Lavanderia grátis', 'Chuveiro de praia', 'Terraço e jardim', 'Cafeteira e café'],
    photos: photos('house', 14),
    airbnbUrl:
      'https://www.airbnb.com/rooms/1257394362209121684?guests=1&adults=1&s=67&unique_share_id=cf9c74bc-e0ea-4161-9b3f-e9f1faa303d5',
  },
  {
    id: 'penthouse',
    dbId: 'penthouse',
    name: 'Quarto Grande — Cobertura',
    capacity: 'Até 6 pessoas',
    tagline: 'A suíte mais ampla da casa, com vista para a montanha.',
    description:
      'No primeiro andar, uma suíte enorme com varanda voltada para as montanhas, teto abobadado, janelas grandes, iluminação aconchegante e piso artesanal de madeira local. Feita para famílias e grupos de amigos que querem dividir o mesmo espaço, com privacidade e muito conforto.',
    highlights: ['Varanda com vista para a montanha', 'Teto abobadado em madeira', 'Espaço para até 6 pessoas', 'Banheiro completo'],
    amenities: ['Ar-condicionado', 'Wi-Fi', 'Espaço de trabalho', 'Geladeira e micro-ondas', 'Cafeteira e café', 'Closet', 'Roupas de cama extras'],
    photos: photos('penthouse', 12),
    airbnbUrl: 'https://www.airbnb.com/rooms/1257394362209121684?viralityEntryPoint=1&s=76',
  },
  {
    id: 'big_suite',
    dbId: 'big_suite',
    name: 'Suíte Master — “Salty Waves”',
    capacity: 'Até 3 pessoas',
    tagline: 'Portas de madeira ripada, paredes brancas e calma.',
    description:
      'Uma cama de casal e uma de solteiro, banheiro privativo e entrada própria pelos fundos da casa. Fresca, moderna e silenciosa, com pequeno deck privativo ao ar livre, Nespresso, frigobar, micro-ondas e mesa de trabalho.',
    highlights: ['Entrada privativa', 'Pequeno deck ao ar livre', 'Banheiro privativo', 'Ar-condicionado'],
    amenities: ['Ar-condicionado', 'Wi-Fi', 'Nespresso', 'Frigobar e micro-ondas', 'Mesa de trabalho', 'Guarda-roupa', 'Chuveiro com água quente'],
    photos: photos('master', 11),
    airbnbUrl: 'https://www.airbnb.com/rooms/589851889015316995?guests=1&adults=1&s=67&unique_share_id=c014bdfc-a020-454b-8ad3-b7ad34d1d84f',
  },
  {
    id: 'small_suite',
    dbId: 'small_suite',
    name: 'Kitnet — “Tranquil Breeze”',
    capacity: 'Até 2 pessoas',
    tagline: 'Paleta suave de cinzas e brancos, ideal para casais.',
    description:
      'Suíte com cama de casal, banheiro privativo e um cantinho de cozinha com pia. Um toque moderno e calmante, a 100 metros da praia, com Nespresso, toalhas macias e a opção de usar a máquina de lavar roupa.',
    highlights: ['Cantinho de cozinha', 'Banheiro privativo', 'Ideal para casais ou viajantes solo', 'A 100 m da praia'],
    amenities: ['Ar-condicionado', 'Wi-Fi', 'Nespresso', 'Máquina de lavar', 'Cortinas blackout', 'Chuveiro com água quente'],
    photos: photos('kitnet', 11),
    airbnbUrl: 'https://www.airbnb.com/rooms/873138853997998343?guests=1&adults=1&s=67&unique_share_id=932bf745-0053-450d-8afd-7a6008f1f21e',
  },
];

export const EXPERIENCE_PHOTOS = photos('experience', 6);

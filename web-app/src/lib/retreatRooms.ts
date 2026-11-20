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
      'https://www.airbnb.com/rooms/873166894206646380',
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

/** The words of each room in English (/en/retreats). Photos, links and ids stay those of RETREAT_ROOMS. */
type RoomCopy = Pick<RetreatRoomInfo, 'name' | 'capacity' | 'tagline' | 'description' | 'highlights' | 'amenities'>;

const ROOM_COPY_EN: Record<string, RoomCopy> = {
  house: {
    name: 'The Whole House',
    capacity: 'Up to 11 guests',
    tagline: 'All of Salt n’ Paradise, just for your group.',
    description:
      'A modern tropical beach house 100 meters from the ocean in Itamambuca, with three places to stay: the Penthouse for up to 6, the Master Suite for 3 and the Studio for 2. A garden with banana trees and exotic flowers, a large terrace, a laundry room and an outdoor beach shower. The right place for group retreats, big families and organizers who want the whole house for their experience.',
    highlights: [
      'Three places to stay, up to 11 guests',
      '100 m from the Itamambuca waves',
      'Garden, terrace and outdoor shower',
      'Hardwood and open architecture, designed to keep mold away',
    ],
    amenities: ['Air conditioning', 'Wi-Fi', 'Free laundry', 'Beach shower', 'Terrace and garden', 'Coffee maker and coffee'],
  },
  penthouse: {
    name: 'Large Room — Penthouse',
    capacity: 'Up to 6 guests',
    tagline: 'The largest suite in the house, with a view of the mountains.',
    description:
      'Upstairs, a very large suite with a balcony facing the mountains, a vaulted ceiling, big windows, warm lighting and a handmade floor of local wood. Made for families and groups of friends who want to share one space, with privacy and plenty of comfort.',
    highlights: ['Balcony with a mountain view', 'Vaulted wooden ceiling', 'Room for up to 6 guests', 'Full bathroom'],
    amenities: ['Air conditioning', 'Wi-Fi', 'Workspace', 'Fridge and microwave', 'Coffee maker and coffee', 'Walk-in closet', 'Extra bed linen'],
  },
  big_suite: {
    name: 'Master Suite — “Salty Waves”',
    capacity: 'Up to 3 guests',
    tagline: 'Slatted wooden doors, white walls and calm.',
    description:
      'A double bed and a single bed, a private bathroom and its own entrance at the back of the house. Cool, modern and quiet, with a small private outdoor deck, a Nespresso machine, a mini fridge, a microwave and a work desk.',
    highlights: ['Private entrance', 'Small outdoor deck', 'Private bathroom', 'Air conditioning'],
    amenities: ['Air conditioning', 'Wi-Fi', 'Nespresso', 'Mini fridge and microwave', 'Work desk', 'Wardrobe', 'Hot shower'],
  },
  small_suite: {
    name: 'Studio — “Tranquil Breeze”',
    capacity: 'Up to 2 guests',
    tagline: 'Soft grays and whites, made for couples.',
    description:
      'A suite with a double bed, a private bathroom and a small kitchen corner with a sink. Modern and calming, 100 meters from the beach, with a Nespresso machine, soft towels and the option to use the washing machine.',
    highlights: ['Small kitchen corner', 'Private bathroom', 'Great for couples or solo travelers', '100 m from the beach'],
    amenities: ['Air conditioning', 'Wi-Fi', 'Nespresso', 'Washing machine', 'Blackout curtains', 'Hot shower'],
  },
};

/** The same in Spanish (/es/retiros), with "tú" like the rest of that page. */
const ROOM_COPY_ES: Record<string, RoomCopy> = {
  house: {
    name: 'La Casa Entera',
    capacity: 'Hasta 11 personas',
    tagline: 'Todo Salt n’ Paradise, solo para tu grupo.',
    description:
      'Una casa de playa tropical y moderna, a 100 metros del océano en Itamambuca, con tres alojamientos: el Ático para hasta 6, la Suite Master para 3 y el Estudio para 2. Jardín con bananos y flores exóticas, terraza amplia, lavandería y ducha de playa al aire libre. El lugar ideal para retiros en grupo, familias grandes y organizadores que quieren la casa entera para su experiencia.',
    highlights: [
      'Tres alojamientos, hasta 11 personas',
      'A 100 m de las olas de Itamambuca',
      'Jardín, terraza y ducha al aire libre',
      'Maderas nobles y arquitectura abierta, pensada contra la humedad',
    ],
    amenities: ['Aire acondicionado', 'Wi-Fi', 'Lavandería gratis', 'Ducha de playa', 'Terraza y jardín', 'Cafetera y café'],
  },
  penthouse: {
    name: 'Habitación Grande — Ático',
    capacity: 'Hasta 6 personas',
    tagline: 'La suite más amplia de la casa, con vista a la montaña.',
    description:
      'En el piso de arriba, una suite enorme con balcón hacia las montañas, techo abovedado, ventanas grandes, luz cálida y piso artesanal de madera local. Pensada para familias y grupos de amigos que quieren compartir el mismo espacio, con privacidad y mucha comodidad.',
    highlights: ['Balcón con vista a la montaña', 'Techo abovedado de madera', 'Espacio para hasta 6 personas', 'Baño completo'],
    amenities: ['Aire acondicionado', 'Wi-Fi', 'Espacio de trabajo', 'Refrigerador y microondas', 'Cafetera y café', 'Vestidor', 'Ropa de cama extra'],
  },
  big_suite: {
    name: 'Suite Master — “Salty Waves”',
    capacity: 'Hasta 3 personas',
    tagline: 'Puertas de listones de madera, paredes blancas y calma.',
    description:
      'Una cama doble y una individual, baño privado y entrada propia por la parte de atrás de la casa. Fresca, moderna y silenciosa, con una pequeña terraza privada al aire libre, Nespresso, frigobar, microondas y escritorio.',
    highlights: ['Entrada privada', 'Pequeña terraza al aire libre', 'Baño privado', 'Aire acondicionado'],
    amenities: ['Aire acondicionado', 'Wi-Fi', 'Nespresso', 'Frigobar y microondas', 'Escritorio', 'Armario', 'Ducha con agua caliente'],
  },
  small_suite: {
    name: 'Estudio — “Tranquil Breeze”',
    capacity: 'Hasta 2 personas',
    tagline: 'Tonos suaves de gris y blanco, ideal para parejas.',
    description:
      'Suite con cama doble, baño privado y un rinconcito de cocina con fregadero. Moderna y tranquila, a 100 metros de la playa, con Nespresso, toallas suaves y la opción de usar la lavadora.',
    highlights: ['Rinconcito de cocina', 'Baño privado', 'Ideal para parejas o viajeros solos', 'A 100 m de la playa'],
    amenities: ['Aire acondicionado', 'Wi-Fi', 'Nespresso', 'Lavadora', 'Cortinas blackout', 'Ducha con agua caliente'],
  },
};

/** The rooms in the visitor's language (Portuguese by default). */
export function retreatRoomsFor(locale: 'pt' | 'en' | 'es' = 'pt'): RetreatRoomInfo[] {
  const copy = locale === 'en' ? ROOM_COPY_EN : locale === 'es' ? ROOM_COPY_ES : null;
  if (!copy) return RETREAT_ROOMS;
  return RETREAT_ROOMS.map(r => ({ ...r, ...(copy[r.id] ?? {}) }));
}

/**
 * Short names for the rooms as the booking calculator lists them. Its names come from the database, in Portuguese,
 * so English and Spanish visitors get these instead (a room missing here keeps its database name).
 */
export const ROOM_SHORT_NAMES: Record<'en' | 'es', Record<string, string>> = {
  en: { house: 'The Whole House', penthouse: 'Penthouse', big_suite: 'Master Suite', small_suite: 'Standard Suite' },
  es: { house: 'La Casa Entera', penthouse: 'Ático (Penthouse)', big_suite: 'Suite Master', small_suite: 'Suite Estándar' },
};

/**
 * The retreat as the top of the value ladder (Andrew, 2026-11-25): people fly in and LIVE with Andrew, Dolly and
 * the family for a few days in Itamambuca. They eat at our table, cook with Dolly and go home knowing how to eat
 * this whole-food vegan way (Fuhrman's nutrient density, Goldhamer's "pleasure trap") and still feel satisfied.
 * For one person or a whole family. They pay a room (3 options, the Airbnb rate) + the experience fee per guest.
 *
 * Every word of the new sections on /retreats, /en/retreats and /es/retiros lives here.
 * Rules: never "sugar-free" or "gluten-free" (say wheat-free / no refined sugar); no medical promises;
 * jungle + ocean, never forest/sea; casual and warm, not salesy.
 */

export type StayLang = 'pt' | 'en' | 'es';

/** When nobody is home (the beach house is rented out). Nights inside this window can't be booked. */
export const AWAY = { firstNight: '2026-12-23', lastNight: '2027-02-17', backOn: '2027-02-18' } as const;

/** Every night from AWAY.firstNight to AWAY.lastNight, as YYYY-MM-DD. */
export function awayNights(): string[] {
  const out: string[] = [];
  const d = new Date(`${AWAY.firstNight}T12:00:00Z`);
  const end = new Date(`${AWAY.lastNight}T12:00:00Z`);
  while (d <= end) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

/** Official Brazilian page on the e-visa for US, Canadian and Australian citizens (required since 10 April 2025). */
export const EVISA_URL = 'https://www.gov.br/mre/pt-br/consulado-miami/information-about-visas-in-english/electronic-visitor-visa-e-visa';

export interface StayCopy {
  who: { kicker: string; title: string; text: string; cards: { emoji: string; title: string; text: string }[] };
  day: { kicker: string; title: string; text: string; steps: { time: string; title: string; text: string }[]; note: string };
  leave: { kicker: string; title: string; items: { title: string; text: string }[] };
  price: { kicker: string; title: string; text: string; parts: { n: string; title: string; text: string }[]; feeLine: (fee: string) => string; tip: string };
  travel: { kicker: string; title: string; text: string; cards: { emoji: string; title: string; text: string; link?: { label: string; href: string } }[] };
  steps: { kicker: string; title: string; items: { title: string; text: string }[]; cta: string };
  faq: { kicker: string; title: string; items: { q: string; a: string }[]; more: string };
  ctaBand: { title: string; text: string; cta: string };
}

const PT: StayCopy = {
  who: {
    kicker: 'O retiro',
    title: 'Venha morar uns dias com a gente',
    text: 'Não é hotel, não é spa. É a nossa casa em Itamambuca, a 100 m do mar. Você come na nossa mesa, cozinha com a Dolly e vive o nosso jeito de comer por dentro, até ele virar seu.',
    cards: [
      { emoji: '🙋', title: 'Sozinho(a)', text: 'Para quem quer um tempo só seu e um recomeço com a comida, com calma e companhia.' },
      { emoji: '💛', title: 'Em casal', text: 'Dois aprendendo juntos fica muito mais fácil de manter em casa depois.' },
      { emoji: '👨‍👩‍👧', title: 'A família toda', text: 'As crianças cozinham junto, provam tudo e descobrem doces de fruta de verdade. Dá até para ficar com a casa inteira.' },
    ],
  },
  day: {
    kicker: 'Um dia aqui',
    title: 'Como é um dia com a gente',
    text: 'Um ritmo simples, com muito tempo livre. Você entra no que quiser.',
    steps: [
      { time: '7h', title: 'Praia', text: 'Caminhada na areia ou alongamento com o barulho das ondas.' },
      { time: '8h', title: 'Café da manhã na mesa da família', text: 'Frutas, aveia, sementes e o que a estação dá. Comer bem cedo, sem pressa.' },
      { time: '10h', title: 'Na cozinha com a Dolly', text: 'Você prepara o almoço com ela: técnica, temperos sem sal, óleo ou açúcar refinado, e o porquê de cada coisa.' },
      { time: '13h', title: 'Almoço juntos', text: 'Prato cheio, colorido, e você sai satisfeito(a). É aí que a ficha cai.' },
      { time: 'Tarde', title: 'Livre', text: 'Cachoeira, rio, surfe, rede ou soneca. A gente indica e ajuda a combinar.' },
      { time: '17h', title: 'Conversa do fim de tarde', text: 'Meia hora sobre o que está por trás: densidade de nutrientes (Fuhrman), a "armadilha do prazer" (Goldhamer) e como a fome se acalma.' },
      { time: '19h', title: 'Jantar e doce', text: 'Jantar na varanda e um doce que você mesmo(a) fez.' },
    ],
    note: 'Os horários mudam com o tempo, a maré e as crianças. Faz parte.',
  },
  leave: {
    kicker: 'Na volta',
    title: 'O que você leva para casa',
    items: [
      { title: 'Saber se satisfazer', text: 'Comer até ficar bem, sem contar calorias, e entender por que a vontade de doce e de sal diminui.' },
      { title: 'As receitas que você fez', text: 'Tudo o que você cozinhou aqui, escrito, para repetir na sua cozinha.' },
      { title: 'Uma semana pronta', text: 'Um plano de refeições para a primeira semana em casa e a lista de compras do seu mercado.' },
      { title: 'A sua despensa nova', text: 'O que comprar, o que tirar de casa e como ler um rótulo.' },
      { title: 'Uma conversa depois', text: 'Uma chamada de vídeo com a Dolly umas semanas depois, para ajustar o que travou.' },
    ],
  },
  price: {
    kicker: 'Quanto custa',
    title: 'Quarto + experiência',
    text: 'Você monta do seu jeito. O preço tem duas partes, e o simulador abaixo mostra o total para as suas datas.',
    parts: [
      { n: '1', title: 'O quarto', text: 'Três opções na nossa casa (ou a casa inteira), pelo mesmo valor do Airbnb.' },
      { n: '2', title: 'A experiência', text: 'Todas as refeições com a família, cozinhar com a Dolly, as conversas e a ajuda com os passeios.' },
    ],
    feeLine: fee => `Experiência: ${fee} por pessoa, por noite. Crianças: fale com a gente.`,
    tip: 'A gente sugere de 5 a 7 noites. É mais ou menos o tempo que o paladar leva para mudar.',
  },
  travel: {
    kicker: 'Como chegar',
    title: 'Da sua casa até a nossa',
    text: 'Itamambuca fica em Ubatuba, no litoral norte de São Paulo, entre São Paulo e o Rio. A gente ajuda em cada passo.',
    cards: [
      { emoji: '🚗', title: 'De São Paulo ou do Rio', text: 'De São Paulo, umas 3h30 a 4h de carro (pela Tamoios). Do Rio, umas 5h pela costa, passando por Paraty. Também tem ônibus direto até Ubatuba.' },
      { emoji: '✈️', title: 'De outro país', text: 'Voe para São Paulo (GRU) ou Rio (GIG). Do aeroporto, carro alugado, ônibus ou um motorista que a gente indica.' },
      { emoji: '🛂', title: 'Visto', text: 'Brasileiros, Mercosul, Europa e Reino Unido não precisam de visto para turismo. EUA, Canadá e Austrália precisam do e-visa, feito online.', link: { label: 'E-visa (site oficial)', href: EVISA_URL } },
      { emoji: '📅', title: 'Quando', text: 'O ano todo, menos de 23 de dezembro a 17 de fevereiro, quando a gente está fora. Voltamos a receber em 18/02/2027.' },
    ],
  },
  steps: {
    kicker: 'Reservar',
    title: 'Como reservar',
    items: [
      { title: 'Conversa', text: 'Fale com a gente no WhatsApp. Contamos tudo e vemos se faz sentido para você (ou para a sua família).' },
      { title: 'Datas e quarto', text: 'Escolha no simulador. Um sinal de 30% segura as suas datas, e o resto até 30 dias antes da chegada.' },
      { title: 'Preparação', text: 'Mandamos uma lista do que trazer, o caminho até aqui e, se o seu consulado pedir, uma carta-convite.' },
    ],
    cta: 'Quero vir',
  },
  faq: {
    kicker: 'Dúvidas',
    title: 'Bom saber',
    items: [
      { q: 'É uma dieta ou um tratamento?', a: 'Não. É comida de verdade e uma rotina gostosa. Se você tem uma condição de saúde, siga o seu médico e conte para a gente antes.' },
      { q: 'Tenho alergia ou restrição. Dá?', a: 'Conte no primeiro contato. Tudo é vegano e sem trigo; castanhas, coco e aveia aparecem bastante, e a gente adapta.' },
      { q: 'Tenho que cozinhar?', a: 'Só se quiser. Dá para só olhar e provar, mas quase todo mundo acaba de avental.' },
      { q: 'Em que língua?', a: 'Português, inglês, holandês ou alemão.' },
      { q: 'Posso vir só por um dia?', a: 'Pode: a aula de doces na nossa cozinha é uma tarde, todo dia às 14h.' },
    ],
    more: 'Mais dúvidas',
  },
  ctaBand: {
    title: 'Pronto(a) para vir?',
    text: 'Escreva para a gente. Sem compromisso: primeiro a gente conversa.',
    cta: 'Falar no WhatsApp',
  },
};

const EN: StayCopy = {
  who: {
    kicker: 'The retreat',
    title: 'Come live with us for a few days',
    text: 'Not a hotel, not a spa. It’s our home in Itamambuca, 100 m from the ocean. You eat at our table, cook with Dolly and live our way of eating from the inside, until it becomes yours.',
    cards: [
      { emoji: '🙋', title: 'On your own', text: 'Time just for you, and a fresh start with food, at your pace and in good company.' },
      { emoji: '💛', title: 'As a couple', text: 'Learning it together makes it so much easier to keep going back home.' },
      { emoji: '👨‍👩‍👧', title: 'The whole family', text: 'Kids cook with us, taste everything and find out what real-fruit treats are. You can even take the whole house.' },
    ],
  },
  day: {
    kicker: 'A day here',
    title: 'What a day with us looks like',
    text: 'A simple rhythm with lots of free time. Join in as much as you like.',
    steps: [
      { time: '7 am', title: 'Beach', text: 'A walk on the sand or a stretch to the sound of the waves.' },
      { time: '8 am', title: 'Breakfast at the family table', text: 'Fruit, oats, seeds and whatever the season brings. No rush.' },
      { time: '10 am', title: 'In the kitchen with Dolly', text: 'You make lunch with her: technique, flavor without salt, oil or refined sugar, and the why behind each step.' },
      { time: '1 pm', title: 'Lunch together', text: 'A big, colorful plate, and you leave the table satisfied. That’s when it clicks.' },
      { time: 'Afternoon', title: 'Free', text: 'Waterfall, river, surf, hammock or a nap. We point the way and help you set it up.' },
      { time: '5 pm', title: 'Sunset talk', text: 'Half an hour on the ideas behind it: nutrient density (Fuhrman), the “pleasure trap” (Goldhamer) and how hunger settles down.' },
      { time: '7 pm', title: 'Dinner and dessert', text: 'Dinner on the terrace, and a treat you made yourself.' },
    ],
    note: 'Times move with the weather, the tide and the kids. That’s part of it.',
  },
  leave: {
    kicker: 'Going home',
    title: 'What you take home',
    items: [
      { title: 'Knowing how to feel satisfied', text: 'Eating until you’re content, no calorie counting, and understanding why cravings for sweet and salty fade.' },
      { title: 'The recipes you made', text: 'Everything you cooked here, written down, to make again in your own kitchen.' },
      { title: 'A week ready to go', text: 'A meal plan for your first week home and a shopping list for your own supermarket.' },
      { title: 'A new pantry', text: 'What to buy, what to clear out and how to read a label.' },
      { title: 'A call afterwards', text: 'A video call with Dolly a few weeks later, to fix whatever got stuck.' },
    ],
  },
  price: {
    kicker: 'What it costs',
    title: 'Room + experience',
    text: 'You put it together your way. The price has two parts, and the planner below shows the total for your dates.',
    parts: [
      { n: '1', title: 'The room', text: 'Three options in our house (or the whole house), at the same rate as on Airbnb.' },
      { n: '2', title: 'The experience', text: 'Every meal with the family, cooking with Dolly, the talks and help with outings.' },
    ],
    feeLine: fee => `Experience: ${fee} per person, per night. Kids: just ask us.`,
    tip: 'We suggest 5 to 7 nights. That’s about how long your taste buds take to change.',
  },
  travel: {
    kicker: 'Getting here',
    title: 'From your door to ours',
    text: 'Itamambuca is in Ubatuba, on the north coast of São Paulo state, between São Paulo and Rio de Janeiro. We help with every step.',
    cards: [
      { emoji: '✈️', title: 'Flights', text: 'Fly into São Paulo (GRU) or Rio de Janeiro (GIG). Both have direct flights from the US and Europe.' },
      { emoji: '🛂', title: 'Visa', text: 'EU, UK and most South American passports need no visa for a tourist stay. US, Canadian and Australian citizens need Brazil’s e-visa, done online a few weeks ahead.', link: { label: 'E-visa (official site)', href: EVISA_URL } },
      { emoji: '🚗', title: 'To Itamambuca', text: 'From São Paulo about 3.5 to 4 hours by car; from Rio about 5 hours along the coast via Paraty. Rental car, bus, or a driver we recommend.' },
      { emoji: '📅', title: 'When', text: 'All year, except 23 December to 17 February, when we’re away. We welcome guests again from 18 February 2027.' },
    ],
  },
  steps: {
    kicker: 'Booking',
    title: 'How to book',
    items: [
      { title: 'A chat', text: 'Message us on WhatsApp. We tell you everything and see if it’s right for you (or your family).' },
      { title: 'Dates and room', text: 'Pick them in the planner. A 30% deposit holds your dates; the rest up to 30 days before you arrive.' },
      { title: 'Getting ready', text: 'We send a packing list, the way here and, if your consulate asks for one, an invitation letter.' },
    ],
    cta: 'I want to come',
  },
  faq: {
    kicker: 'Questions',
    title: 'Good to know',
    items: [
      { q: 'Is it a diet or a treatment?', a: 'No. It’s real food and a lovely routine. If you have a health condition, follow your doctor and tell us beforehand.' },
      { q: 'I have an allergy or restriction. Is that OK?', a: 'Tell us in your first message. Everything is vegan and wheat-free; nuts, coconut and oats show up a lot, and we adapt.' },
      { q: 'Do I have to cook?', a: 'Only if you want to. You can just watch and taste, but almost everyone ends up in an apron.' },
      { q: 'What language?', a: 'English, Portuguese, Dutch or German.' },
      { q: 'Can I come for just one day?', a: 'Yes: the treats class in our kitchen is one afternoon, every day at 2 pm.' },
    ],
    more: 'More questions',
  },
  ctaBand: {
    title: 'Ready to come?',
    text: 'Write to us. No commitment: we talk first.',
    cta: 'Message us on WhatsApp',
  },
};

const ES: StayCopy = {
  who: {
    kicker: 'El retiro',
    title: 'Ven a vivir unos días con nosotros',
    text: 'No es un hotel ni un spa. Es nuestra casa en Itamambuca, a 100 m del océano. Comes en nuestra mesa, cocinas con Dolly y vives nuestra forma de comer desde adentro, hasta que se vuelve tuya.',
    cards: [
      { emoji: '🙋', title: 'Solo o sola', text: 'Un tiempo para ti y un nuevo comienzo con la comida, con calma y buena compañía.' },
      { emoji: '💛', title: 'En pareja', text: 'Aprenderlo juntos hace mucho más fácil seguir en casa.' },
      { emoji: '👨‍👩‍👧', title: 'Toda la familia', text: 'Los niños cocinan con nosotros, prueban todo y descubren dulces de fruta de verdad. Hasta pueden tener la casa entera.' },
    ],
  },
  day: {
    kicker: 'Un día aquí',
    title: 'Cómo es un día con nosotros',
    text: 'Un ritmo simple, con mucho tiempo libre. Te sumas a lo que quieras.',
    steps: [
      { time: '7 h', title: 'Playa', text: 'Una caminata por la arena o estiramientos con el sonido de las olas.' },
      { time: '8 h', title: 'Desayuno en la mesa familiar', text: 'Fruta, avena, semillas y lo que dé la estación. Sin apuro.' },
      { time: '10 h', title: 'En la cocina con Dolly', text: 'Preparas el almuerzo con ella: técnica, sabor sin sal, aceite ni azúcar refinado, y el porqué de cada paso.' },
      { time: '13 h', title: 'Almuerzo juntos', text: 'Un plato grande y colorido, y te levantas satisfecho. Ahí se entiende todo.' },
      { time: 'Tarde', title: 'Libre', text: 'Cascada, río, surf, hamaca o siesta. Te indicamos y ayudamos a organizarlo.' },
      { time: '17 h', title: 'Charla del atardecer', text: 'Media hora sobre las ideas de fondo: densidad de nutrientes (Fuhrman), la “trampa del placer” (Goldhamer) y cómo se calma el hambre.' },
      { time: '19 h', title: 'Cena y postre', text: 'Cena en la terraza y un dulce que hiciste tú.' },
    ],
    note: 'Los horarios cambian con el clima, la marea y los niños. Es parte de la experiencia.',
  },
  leave: {
    kicker: 'Al volver',
    title: 'Lo que te llevas a casa',
    items: [
      { title: 'Saber quedar satisfecho', text: 'Comer hasta estar bien, sin contar calorías, y entender por qué bajan las ganas de dulce y de sal.' },
      { title: 'Las recetas que hiciste', text: 'Todo lo que cocinaste aquí, por escrito, para repetirlo en tu cocina.' },
      { title: 'Una semana lista', text: 'Un plan de comidas para tu primera semana en casa y la lista de compras de tu supermercado.' },
      { title: 'Una despensa nueva', text: 'Qué comprar, qué sacar de casa y cómo leer una etiqueta.' },
      { title: 'Una llamada después', text: 'Una videollamada con Dolly unas semanas más tarde, para ajustar lo que se trabó.' },
    ],
  },
  price: {
    kicker: 'Cuánto cuesta',
    title: 'Habitación + experiencia',
    text: 'Lo armas a tu manera. El precio tiene dos partes, y el simulador de abajo muestra el total para tus fechas.',
    parts: [
      { n: '1', title: 'La habitación', text: 'Tres opciones en nuestra casa (o la casa entera), al mismo precio que en Airbnb.' },
      { n: '2', title: 'La experiencia', text: 'Todas las comidas con la familia, cocinar con Dolly, las charlas y ayuda con los paseos.' },
    ],
    feeLine: fee => `Experiencia: ${fee} por persona, por noche. Niños: pregúntanos.`,
    tip: 'Sugerimos de 5 a 7 noches. Es más o menos lo que tarda el paladar en cambiar.',
  },
  travel: {
    kicker: 'Cómo llegar',
    title: 'De tu casa a la nuestra',
    text: 'Itamambuca está en Ubatuba, en la costa norte del estado de São Paulo, entre São Paulo y Río de Janeiro. Te ayudamos en cada paso.',
    cards: [
      { emoji: '✈️', title: 'Vuelos', text: 'Vuela a São Paulo (GRU) o Río de Janeiro (GIG). Hay vuelos directos desde Buenos Aires, Santiago, Europa y EE. UU.' },
      { emoji: '🛂', title: 'Visado', text: 'Mercosur (con tu documento de identidad), la UE y el Reino Unido no necesitan visado para turismo. EE. UU., Canadá y Australia necesitan el e-visa de Brasil, online.', link: { label: 'E-visa (sitio oficial)', href: EVISA_URL } },
      { emoji: '🚗', title: 'Hasta Itamambuca', text: 'Desde São Paulo, unas 3 h 30 a 4 h en auto; desde Río, unas 5 h por la costa pasando por Paraty. Auto alquilado, bus o un chofer que te recomendamos.' },
      { emoji: '📅', title: 'Cuándo', text: 'Todo el año, menos del 23 de diciembre al 17 de febrero, cuando no estamos. Volvemos a recibir desde el 18 de febrero de 2027.' },
    ],
  },
  steps: {
    kicker: 'Reservar',
    title: 'Cómo reservar',
    items: [
      { title: 'Una charla', text: 'Escríbenos por WhatsApp. Te contamos todo y vemos si es para ti (o para tu familia).' },
      { title: 'Fechas y habitación', text: 'Elígelas en el simulador. Una seña del 30% guarda tus fechas; el resto hasta 30 días antes de llegar.' },
      { title: 'Preparación', text: 'Te mandamos qué traer, cómo llegar y, si tu consulado lo pide, una carta de invitación.' },
    ],
    cta: 'Quiero ir',
  },
  faq: {
    kicker: 'Dudas',
    title: 'Bueno saber',
    items: [
      { q: '¿Es una dieta o un tratamiento?', a: 'No. Es comida de verdad y una rutina linda. Si tienes una condición de salud, sigue a tu médico y avísanos antes.' },
      { q: 'Tengo una alergia o restricción. ¿Se puede?', a: 'Cuéntanos en el primer mensaje. Todo es vegano y sin trigo; frutos secos, coco y avena aparecen mucho, y nos adaptamos.' },
      { q: '¿Tengo que cocinar?', a: 'Solo si quieres. Puedes mirar y probar, pero casi todos terminan con delantal.' },
      { q: '¿En qué idioma?', a: 'Inglés o portugués, y también neerlandés o alemán.' },
      { q: '¿Puedo ir solo un día?', a: 'Sí: la clase de dulces en nuestra cocina es una tarde, todos los días a las 14 h.' },
    ],
    more: 'Más dudas',
  },
  ctaBand: {
    title: '¿Listo para venir?',
    text: 'Escríbenos. Sin compromiso: primero conversamos.',
    cta: 'Escribir por WhatsApp',
  },
};

export const STAY_COPY: Record<StayLang, StayCopy> = { pt: PT, en: EN, es: ES };

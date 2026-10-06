/**
 * How to keep and serve the treats: the ONE place this is written.
 *
 * From Dolly's kitchen note (2026-10-05) plus her answers to Claude's questions:
 * - the kitchen holds every box in the FREEZER (never the fridge) until it is collected or delivered;
 * - deliveries go out in a cooler with ice packs;
 * - at home: freezer up to 4 weeks, fridge 3 days at most;
 * - raw & creamy: about 10 minutes at room temperature, then eat within a few hours (sooner in the heat);
 * - cookies & baked tartelettes: thaw, or warm gently in an air fryer / oven on the lowest setting;
 * - cutting one slice and putting the rest straight back in the freezer (or fridge) is fine.
 *
 * Pure strings, no imports: the /cuidados page, the box page, Minha Conta and the e-mails all read
 * from here, so changing "4 semanas" here changes it everywhere. The printed card in the box should
 * say the same thing and carry a QR code to CARE_URL.
 */

export const FREEZER_WEEKS = 4;
export const FRIDGE_DAYS = 3;
export const THAW_MINUTES = 10;

export const CARE_PATH = '/cuidados';
export const CARE_PATH_EN = '/en/care';

export interface CareStep { emoji: string; title: string; text: string }

export interface CareCopy {
  eyebrow: string;
  title: string;
  intro: string;
  storeTitle: string;
  store: CareStep[];
  serveTitle: string;
  serve: CareStep[];
  ingredientsTitle: string;
  closing: string;
}

export const CARE_PT: CareCopy = {
  eyebrow: 'Um bilhetinho da nossa cozinha',
  title: 'Cuidados com os seus doces',
  intro:
    'Nossos doces são feitos em pequenas fornadas, com ingredientes integrais, sem conservantes e sem nada artificial. ' +
    'Por isso ficam no auge do sabor quando comidos frescos.',
  storeTitle: 'Assim que a caixa chegar',
  store: [
    { emoji: '🧊', title: 'Direto para o freezer', text: 'Não vai comer agora? Coloque a caixa inteira direto no freezer, assim que receber.' },
    { emoji: '📅', title: `Até ${FREEZER_WEEKS} semanas no freezer`, text: `Congelados, eles ficam ótimos por até ${FREEZER_WEEKS} semanas. Mas quanto antes, mais gostoso. ♡` },
    { emoji: '❄️', title: `Geladeira: ${FRIDGE_DAYS} dias, no máximo`, text: `Se preferir a geladeira, coma em até ${FRIDGE_DAYS} dias.` },
    { emoji: '🚚', title: 'Ela já vem gelada', text: 'Na retirada, a caixa sai direto do nosso freezer. Na entrega, ela viaja numa caixa térmica com gelo. Nos dois casos: chegou em casa, freezer.' },
  ],
  serveTitle: 'Na hora de comer',
  serve: [
    { emoji: '🍦', title: 'Doces crus e cremosos', text: `Tire do freezer e deixe descansar uns ${THAW_MINUTES} minutos em temperatura ambiente. A textura amolece e fica cremosa, derretendo na boca.` },
    { emoji: '🍪', title: 'Cookies e tortinhas assadas', text: 'Podem descongelar em temperatura ambiente. Para um gostinho de recém-saído do forno, aqueça de leve na airfryer ou no forno, na temperatura mais baixa, só até ficarem mornos e cheirosos.' },
    { emoji: '⏱️', title: 'Descongelou? Coma em poucas horas', text: 'Fora do freezer, aproveite em poucas horas. Em dia quente, quanto antes melhor.' },
    { emoji: '🔪', title: 'Só um pedaço?', text: `Cortou uma fatia de um bolo? Volte o resto para o freezer na hora (ou para a geladeira, por até ${FRIDGE_DAYS} dias).` },
  ],
  ingredientsTitle: 'Sobre os ingredientes',
  closing: 'Sem conservantes. Sem nada artificial. Só doces lindos, feitos para serem aproveitados.',
};

export const CARE_EN: CareCopy = {
  eyebrow: 'A little note from our kitchen',
  title: 'Treat care & storage',
  intro:
    'Our treats are made in small batches with whole-food ingredients, no preservatives and no artificial ingredients, ' +
    'so they are at their most delicious when enjoyed fresh.',
  storeTitle: 'As soon as your box arrives',
  store: [
    { emoji: '🧊', title: 'Straight into the freezer', text: 'Not eating them right away? Place the entire box directly in the freezer as soon as you receive it.' },
    { emoji: '📅', title: `Up to ${FREEZER_WEEKS} weeks frozen`, text: `Stored frozen, the treats keep beautifully for up to ${FREEZER_WEEKS} weeks. Sooner is always tastier. ♡` },
    { emoji: '❄️', title: `Fridge: ${FRIDGE_DAYS} days at most`, text: `If you prefer the fridge, enjoy them within ${FRIDGE_DAYS} days.` },
    { emoji: '🚚', title: 'It arrives cold', text: 'Pickup boxes come straight out of our freezer; deliveries travel in a cooler with ice packs. Either way: home, then freezer.' },
  ],
  serveTitle: 'When you’re ready to indulge',
  serve: [
    { emoji: '🍦', title: 'Raw & creamy treats', text: `Take them out of the freezer and let them rest at room temperature for about ${THAW_MINUTES} minutes, so the texture softens into that creamy, melt-in-your-mouth moment.` },
    { emoji: '🍪', title: 'Cookies & baked tartelettes', text: 'They can simply thaw at room temperature, or for a fresh-from-the-oven feel, warm them gently in an air fryer or oven on the lowest setting until just warm and fragrant.' },
    { emoji: '⏱️', title: 'Thawed? Enjoy within a few hours', text: 'Once out of the freezer, enjoy them within a few hours — sooner on a hot day.' },
    { emoji: '🔪', title: 'Just one slice?', text: `Cut a slice from a cake? Put the rest straight back in the freezer (or the fridge, for up to ${FRIDGE_DAYS} days).` },
  ],
  ingredientsTitle: 'A note on ingredients',
  closing: 'No preservatives. No artificial ingredients. Just beautiful little treats, made to be enjoyed.',
};

/** Two sentences for e-mails, the checkout and Minha Conta, where the full note would be too much. */
export const CARE_SHORT =
  `Não vai comer hoje? Coloque a caixa inteira direto no freezer: fica ótima por até ${FREEZER_WEEKS} semanas (na geladeira, ${FRIDGE_DAYS} dias no máximo). ` +
  `Na hora, os doces crus e cremosos descansam uns ${THAW_MINUTES} minutos fora do freezer, e depois de descongelados é bom comer em poucas horas.`;

/** English kitchen facts for /en/care (the Portuguese ones live in allergens.ts → KITCHEN_FACTS). */
export const KITCHEN_FACTS_EN = [
  { emoji: '🌱', text: '100% plant-based: no milk, eggs, honey or any animal ingredient.' },
  { emoji: '🍯', text: 'SOS-free: no salt, no oil and no refined sugar in our recipes. Sweetness comes from dates and fruit, coconut sugar or rapadura. The one exception is the vegan chocolate some treats use, which contains a little refined sugar; those treats are always marked.' },
  { emoji: '🌾', text: 'We never use wheat or any gluten ingredient in our recipes. But some ingredients we buy ready-made, such as almond and other flours, may be processed where wheat is also handled, so we can’t guarantee the treats are free of gluten traces. If you have coeliac disease, talk to us first.' },
  { emoji: '⚠️', text: 'Tree nuts, peanuts, coconut, sesame, soy and oats are all used in our kitchen, so any treat may contain traces of them, even when the recipe doesn’t.' },
  { emoji: '✨', text: 'No preservatives and no artificial ingredients.' },
];

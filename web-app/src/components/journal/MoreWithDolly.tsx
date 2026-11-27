import Link from 'next/link';
import { COACHING_PATH, COACHING_PRICES } from '@/lib/coachingCopy';
import { EBOOK } from '@/lib/ebook';
import { JOURNAL_PATH, fmtBRL, type JournalLang } from '@/lib/journal/journal';

/**
 * "More with Dolly": the rest of the value ladder under a free recipe (and the featured one), asked for by Dolly 2026-11-27.
 * One dark-green band, one card per rung, cheapest first: premium recipes, the book, a call, a class, the retreat.
 * Prices come from where they live (ebook.ts, coachingCopy.ts), never typed here.
 */
export default function MoreWithDolly({ lang, premiumFrom }: { lang: JournalLang; premiumFrom: number }) {
  const en = lang === 'en';
  const rungs = [
    {
      sign: '🔓', href: `${JOURNAL_PATH[lang]}#biblioteca`,
      title: en ? 'Premium recipes & collections' : 'Receitas premium e coleções',
      line: en ? 'Dolly’s best recipes, yours to keep. Buy one at a time.' : 'As melhores receitas da Dolly, suas para sempre. Compre uma de cada vez.',
      price: `${en ? 'from' : 'a partir de'} ${fmtBRL(premiumFrom)}`,
      cta: en ? 'See the recipes' : 'Ver as receitas',
    },
    {
      sign: '📖', href: en ? '/sweet-escape' : '/sweet-escape/pt',
      title: en ? 'The book: Sweet Escape' : 'O livro: Sweet Escape',
      line: en ? 'Seven rainbow recipes and the why behind every swap. Comes with a free 30-minute call with Dolly.'
        : 'Sete receitas do arco-íris e o porquê de cada troca. Vem com uma conversa grátis de 30 minutos com a Dolly.',
      price: en ? `US$ ${EBOOK.priceUSD}` : fmtBRL(EBOOK.priceBRL),
      cta: en ? 'See the book' : 'Ver o livro',
    },
    {
      sign: '💬', href: `${COACHING_PATH[lang]}#conversa`,
      title: en ? 'Food coaching with Dolly' : 'Coaching de alimentação com a Dolly',
      line: en ? `Start with a free 30-minute call. Then one session (${fmtBRL(COACHING_PRICES.session)}) or The Reset, ${COACHING_PRICES.resetWeeks} weeks.`
        : `Comece com uma conversa grátis de 30 minutos. Depois, uma sessão (${fmtBRL(COACHING_PRICES.session)}) ou o Reset de ${COACHING_PRICES.resetWeeks} semanas.`,
      price: `${en ? 'Reset' : 'Reset'} ${fmtBRL(COACHING_PRICES.reset)}`,
      cta: en ? 'Book the free call' : 'Marcar a conversa grátis',
    },
    {
      sign: '👩‍🍳', href: '/cursos',
      title: en ? 'A class in Dolly’s kitchen' : 'Aula na cozinha da Dolly',
      line: en ? 'Three hands-on hours in Itamambuca, Ubatuba. You pick the day.' : 'Três horas de mão na massa em Itamambuca, Ubatuba. Você escolhe o dia.',
      price: en ? 'Ubatuba, Brazil' : 'Itamambuca',
      cta: en ? 'See the classes' : 'Ver as aulas',
    },
    {
      sign: '🌿', href: en ? '/en/retreats' : '/retreats',
      title: en ? 'A retreat with the family' : 'Retiro com a família',
      line: en ? 'Days in our home by the beach: eat with us and learn to cook this way for good.'
        : 'Dias na nossa casa na praia: comer com a gente e aprender a cozinhar assim de vez.',
      price: en ? 'The full experience' : 'A experiência completa',
      cta: en ? 'See the retreat' : 'Ver o retiro',
    },
  ];
  return (
    <section className="rj-band rj-band--green rj-more rj-noprint" aria-labelledby="mais-dolly">
      <div className="rj-wrap">
        <p className="rj-kicker rj-kicker--light" data-sign="🌴">{en ? 'Enjoyed this one?' : 'Gostou desta?'}</p>
        <h2 id="mais-dolly" className="rj-h2c rj-h2c--light">{en ? 'More with Dolly' : 'Mais com a Dolly'}</h2>
        <p className="rj-intro rj-intro--light">
          {en ? 'From one recipe to cooking like this every day: pick the next step that fits you.'
            : 'De uma receita a cozinhar assim todo dia: escolha o próximo passo que combina com você.'}
        </p>
        <ul className="rj-more__list">
          {rungs.map(r => (
            <li key={r.href}>
              <Link href={r.href} className="rj-more__card">
                <span className="rj-more__sign" aria-hidden>{r.sign}</span>
                <b className="rj-more__title">{r.title}</b>
                <span className="rj-more__line">{r.line}</span>
                <span className="rj-more__foot"><span>{r.price}</span><span className="rj-more__cta">{r.cta} →</span></span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

import PrintButton from './PrintButton';
import { JOURNAL_COPY, type JournalLang, type RecipeBody } from '@/lib/journal/journal';

/** The full recipe: each part with its ingredients and steps, then notes and storage. Same view for free and unlocked. */
export default function RecipeBodyView({ body, lang, yieldText, printable = true }: { body: RecipeBody; lang: JournalLang; yieldText?: string; printable?: boolean }) {
  const c = JOURNAL_COPY[lang];
  const many = body.sections.length > 1;
  return (
    <section className="rj-recipe" id="receita" aria-label={c.ingredients}>
      <div className="rj-recipe__top">
        <h2 className="rj-h2">{lang === 'en' ? 'The recipe' : 'A receita'}{yieldText ? <small style={{ display: 'block', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '0.9rem', color: 'var(--rj-soft)', marginTop: '0.25rem' }}>{yieldText}</small> : null}</h2>
        {printable && <PrintButton label={c.printBtn} />}
      </div>
      {body.sections.map((s, i) => (
        <div className="rj-part" key={i}>
          {many && <h3>{s.name}</h3>}
          <div className="rj-part__grid">
            <div>
              <h4>{c.ingredients}</h4>
              <ul className="rj-ing">{s.ingredients.map((x, j) => <li key={j}>{x}</li>)}</ul>
            </div>
            <div>
              <h4>{c.method}</h4>
              <ol className="rj-steps">{s.steps.map((x, j) => <li key={j}>{x}</li>)}</ol>
            </div>
          </div>
        </div>
      ))}
      {body.notes && <p className="rj-note"><b>{c.notes}</b>{body.notes}</p>}
      {body.storage && <p className="rj-note"><b>{c.storage}</b>{body.storage}</p>}
    </section>
  );
}

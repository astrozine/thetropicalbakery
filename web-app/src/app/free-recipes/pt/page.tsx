import { redirect } from 'next/navigation';

/** The Portuguese page lives at /receitas; anyone guessing /free-recipes/pt ends up there. */
export default function FreeRecipesPT() {
  redirect('/receitas');
}

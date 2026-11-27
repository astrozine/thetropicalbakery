'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { JOURNAL_COPY, libraryHref, type JournalLang } from '@/lib/journal/journal';

/** "Minhas receitas" in the masthead, only for someone signed in (everyone else has nothing there yet). */
export default function MyRecipesLink({ lang, className = 'rj-pill' }: { lang: JournalLang; className?: string }) {
  const { user } = useAuth();
  if (!user) return null;
  return <Link className={className} href={libraryHref(lang)}><span aria-hidden>♥</span>{JOURNAL_COPY[lang].myRecipes}</Link>;
}

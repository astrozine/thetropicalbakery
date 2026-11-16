'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { pageLang, type ShellLang } from '@/lib/shellCopy';

/** The language the current page is written in (see pageLang in lib/shellCopy.ts). */
export function usePageLang(): ShellLang {
  const pathname = usePathname() || '/';
  const [search, setSearch] = useState('');
  useEffect(() => { setSearch(window.location.search); }, [pathname]);
  return pageLang(pathname, search);
}

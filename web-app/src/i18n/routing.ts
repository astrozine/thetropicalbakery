import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';
 
export const routing = defineRouting({
  locales: ['pt', 'en', 'es', 'it', 'fr', 'de', 'nl'],
  defaultLocale: 'pt'
});
 
export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing);

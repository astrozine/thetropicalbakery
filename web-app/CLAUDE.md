@AGENTS.md

# Supabase migrations: explicit grants for new tables

Supabase stopped auto-granting Data API access to **new** tables in the `public` schema on
**2026-10-30** (existing tables are untouched). Any migration that creates a table must grant
access in the same file, or supabase-js / PostgREST returns "permission denied" for it, including
on new projects, preview branches and a local `supabase db reset`.

Add this to the migration next to the `CREATE TABLE`, keeping it as narrow as the table needs
(RLS policies still decide which rows anyone can touch):

```sql
grant select on public.your_table to anon;                                  -- only if the public reads it
grant select, insert, update, delete on public.your_table to authenticated;
grant select, insert, update, delete on public.your_table to service_role;
```

Only grant `anon` what visitors really need (e.g. `select` for public catalogs, `insert` for
sign-up/inquiry forms). Admin-only tables get `authenticated` and `service_role` only. Migrations
that only add columns or policies to existing tables need nothing extra.

-- migration_34_ebook_storage.sql
-- The Sweet Escape e-book: a PRIVATE storage bucket for the PDF.
--
-- Nobody can list or download from this bucket directly: there are deliberately NO policies on it.
-- The site hands a paying buyer a 10-minute signed link from the server (service key, /api/ebook/download)
-- after checking their order is paid. Upload the file by hand afterwards (see SETUP_ebook.md):
--   Storage > ebooks > Upload > sweet-escape.pdf
--
-- e-book orders go into the existing `orders` table (order_kind = 'ebook', reference starting EBK), so no
-- table changes are needed. Safe to run twice.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ebooks', 'ebooks', false, 52428800, array['application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Check: one private bucket, 50 MB limit, PDFs only. After uploading, the second query shows the file.
select id, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'ebooks';
select name, (metadata->>'size')::bigint / 1048576 as mb from storage.objects where bucket_id = 'ebooks';

-- 1. Add batch size and multiplier to treats
ALTER TABLE treats ADD COLUMN IF NOT EXISTS min_batch_size INTEGER DEFAULT 1;
ALTER TABLE treats ADD COLUMN IF NOT EXISTS batch_multiplier INTEGER DEFAULT 1;

-- 2. Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Site Content Table (Dynamic Sections)
CREATE TABLE IF NOT EXISTS site_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255),
    text_content TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- 5. Policies
CREATE POLICY "Public can view active courses"
    ON courses FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Public can view site content"
    ON site_content FOR SELECT
    USING (true);

-- Admin can manage everything (You may need to adjust this depending on how you identify your admin user, 
-- e.g., checking for a specific email or a role in the users table. For simplicity, we can let authenticated users manage things if she's the only one logging in)
CREATE POLICY "Admins can manage courses" ON courses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage site content" ON site_content FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage treats" ON treats FOR ALL USING (auth.role() = 'authenticated');

-- 6. Triggers for updated_at
CREATE TRIGGER update_courses_modtime
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_site_content_modtime
    BEFORE UPDATE ON site_content
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 7. Storage Bucket for Uploads
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'uploads' );

create policy "Authenticated users can upload"
  on storage.objects for insert
  with check ( bucket_id = 'uploads' AND auth.role() = 'authenticated' );

create policy "Authenticated users can update"
  on storage.objects for update
  using ( bucket_id = 'uploads' AND auth.role() = 'authenticated' );

create policy "Authenticated users can delete"
  on storage.objects for delete
  using ( bucket_id = 'uploads' AND auth.role() = 'authenticated' );

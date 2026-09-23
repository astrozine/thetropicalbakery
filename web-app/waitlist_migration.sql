-- Create the waitlist table
CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    email TEXT,
    notified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert into the waitlist (public access)
CREATE POLICY "Allow public insert to waitlist" ON public.waitlist
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Allow only authenticated users (admin) to view/update the waitlist
CREATE POLICY "Allow authenticated full access to waitlist" ON public.waitlist
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

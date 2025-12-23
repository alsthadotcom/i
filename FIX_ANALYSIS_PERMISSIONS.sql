-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.venture_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    venture_id UUID REFERENCES public.ventures(id) ON DELETE CASCADE,
    roadmap_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.venture_analysis ENABLE ROW LEVEL SECURITY;

-- Allow anonymous and authenticated users to read analysis linked to their ventures
-- (Assuming venture_id is enough for now, or we can just open it up for this demo)
CREATE POLICY "Allow public read access" ON public.venture_analysis
    FOR SELECT
    USING (true);

-- Allow insert/update
CREATE POLICY "Allow public insert access" ON public.venture_analysis
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update access" ON public.venture_analysis
    FOR UPDATE
    USING (true);

-- Fix permissions for the anonymous role (if using Supabase Auth with anon key)
GRANT ALL ON public.venture_analysis TO anon;
GRANT ALL ON public.venture_analysis TO authenticated;
GRANT ALL ON public.venture_analysis TO service_role;

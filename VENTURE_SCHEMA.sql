-- MASTER SCHEMA FOR VENTURE IDENTIFICATION AND ANALYSIS
-- Matches the new Sell page inputs

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Info Table (Profiles)
CREATE TABLE IF NOT EXISTS public.user_info (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    name TEXT,
    full_name TEXT,
    profile_picture TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ventures Table (Core Submission)
CREATE TABLE IF NOT EXISTS public.ventures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Identification Section
    stage TEXT NOT NULL CHECK (stage IN ('Idea', 'MVP', 'Prototype', 'Executed')),
    industry TEXT NOT NULL,
    other_industry TEXT,
    business_type TEXT NOT NULL, -- Product, Service, SaaS, Marketplace, Contract-based
    payer TEXT NOT NULL, -- Consumers, Businesses, Government, Mixed
    
    -- Problem Matrix
    -- problem_details is a JSONB map: { "Financial Problem": "I need funding for...", "Scaling Problem": "..." }
    problem_details JSONB DEFAULT '{}'::jsonb NOT NULL,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Venture Analysis (AI Outputs - For future use)
CREATE TABLE IF NOT EXISTS public.venture_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venture_id UUID REFERENCES public.ventures(id) ON DELETE CASCADE NOT NULL,
    roadmap_data JSONB, -- Tailored roadmap/guide based on problems
    risk_assessment JSONB,
    market_potential_score INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Social Interactions
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    venture_id UUID REFERENCES public.ventures(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, venture_id)
);

CREATE TABLE IF NOT EXISTS public.saves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    venture_id UUID REFERENCES public.ventures(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, venture_id)
);

-- 6. Row Level Security (RLS)

-- User Info
ALTER TABLE public.user_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.user_info FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.user_info FOR UPDATE USING (auth.uid() = user_id);

-- Ventures
ALTER TABLE public.ventures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ventures are viewable by everyone" ON public.ventures FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create ventures" ON public.ventures FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ventures" ON public.ventures FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ventures" ON public.ventures FOR DELETE USING (auth.uid() = user_id);

-- Venture Analysis
ALTER TABLE public.venture_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Analysis is viewable by owner" ON public.venture_analysis FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.ventures WHERE id = venture_id AND user_id = auth.uid())
);

-- Likes
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes are viewable by everyone" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- Saves
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Saves are viewable by owner" ON public.saves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can save" ON public.saves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave" ON public.saves FOR DELETE USING (auth.uid() = user_id);

-- 7. Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_info_updated_at BEFORE UPDATE ON public.user_info FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_ventures_updated_at BEFORE UPDATE ON public.ventures FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

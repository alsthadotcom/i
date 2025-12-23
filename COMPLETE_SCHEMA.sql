-- =====================================================
-- COMPLETE IDA DATABASE SCHEMA
-- This creates ALL tables from scratch
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- 1. User Info Table (Profiles)
CREATE TABLE IF NOT EXISTS public.user_info (
    user_id UUID PRIMARY KEY,
    email TEXT UNIQUE,
    username TEXT UNIQUE,
    name TEXT,
    full_name TEXT,
    profile_picture TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ventures Table (From SellIdea form)
CREATE TABLE IF NOT EXISTS public.ventures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- Nullable for anonymous submissions
    
    -- Identification Section
    stage TEXT NOT NULL CHECK (stage IN ('Idea', 'MVP', 'Prototype', 'Executed')),
    industry TEXT NOT NULL,
    other_industry TEXT,
    business_type TEXT NOT NULL,
    payer TEXT NOT NULL,
    
    -- Problem Matrix (JSONB)
    problem_details JSONB DEFAULT '{}'::jsonb NOT NULL,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Idea Listing Table (For Marketplace)
CREATE TABLE IF NOT EXISTS public.idea_listing (
    idea_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- Nullable for anonymous submissions
    title TEXT NOT NULL,
    one_line_description TEXT,
    category TEXT,
    secondary_category TEXT,
    price NUMERIC(10, 2) DEFAULT 0,
    document_url TEXT,
    additional_doc_1 TEXT,
    additional_doc_2 TEXT,
    additional_doc_3 TEXT,
    mvp_type TEXT CHECK (mvp_type IN ('Digital/Saas', 'Physical', NULL)),
    digital_mvp_url TEXT,
    physical_mvp_image TEXT,
    physical_mvp_video TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. AI Scoring Table
CREATE TABLE IF NOT EXISTS public.ai_scoring (
    ai_score_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID REFERENCES public.idea_listing(idea_id) ON DELETE CASCADE NOT NULL,
    uniqueness INTEGER CHECK (uniqueness >= 0 AND uniqueness <= 100),
    customer_pain INTEGER CHECK (customer_pain >= 0 AND customer_pain <= 100),
    scalability INTEGER CHECK (scalability >= 0 AND scalability <= 100),
    product_market_fit INTEGER CHECK (product_market_fit >= 0 AND product_market_fit <= 100),
    technical_complexity INTEGER CHECK (technical_complexity >= 0 AND technical_complexity <= 100),
    capital_intensity INTEGER CHECK (capital_intensity >= 0 AND capital_intensity <= 100),
    market_saturation INTEGER CHECK (market_saturation >= 0 AND market_saturation <= 100),
    business_model_robustness INTEGER CHECK (business_model_robustness >= 0 AND business_model_robustness <= 100),
    market_growth_rate INTEGER CHECK (market_growth_rate >= 0 AND market_growth_rate <= 100),
    social_value INTEGER CHECK (social_value >= 0 AND social_value <= 100),
    overall_score INTEGER GENERATED ALWAYS AS (
        (COALESCE(uniqueness, 0) + 
         COALESCE(customer_pain, 0) + 
         COALESCE(scalability, 0) + 
         COALESCE(product_market_fit, 0) + 
         COALESCE(technical_complexity, 0) + 
         COALESCE(capital_intensity, 0) + 
         COALESCE(market_saturation, 0) + 
         COALESCE(business_model_robustness, 0) + 
         COALESCE(market_growth_rate, 0) + 
         COALESCE(social_value, 0)) / 10
    ) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Venture Analysis Table
CREATE TABLE IF NOT EXISTS public.venture_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venture_id UUID REFERENCES public.ventures(id) ON DELETE CASCADE NOT NULL,
    roadmap_data JSONB,
    risk_assessment JSONB,
    market_potential_score INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Social Interaction Tables
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- Nullable for anonymous likes
    idea_id UUID REFERENCES public.idea_listing(idea_id) ON DELETE CASCADE,
    venture_id UUID REFERENCES public.ventures(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK ((idea_id IS NOT NULL AND venture_id IS NULL) OR (idea_id IS NULL AND venture_id IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS public.saves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- Nullable for anonymous saves
    idea_id UUID REFERENCES public.idea_listing(idea_id) ON DELETE CASCADE,
    venture_id UUID REFERENCES public.ventures(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK ((idea_id IS NOT NULL AND venture_id IS NULL) OR (idea_id IS NULL AND venture_id IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS public.shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID REFERENCES public.idea_listing(idea_id) ON DELETE CASCADE NOT NULL,
    user_id UUID, -- Nullable for anonymous shares
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- VIEWS
-- =====================================================

-- Marketplace View (Main listing page)
CREATE OR REPLACE VIEW public.marketplace AS
SELECT 
    il.idea_id,
    il.user_id,
    il.title,
    il.one_line_description,
    il.category,
    il.secondary_category,
    il.price,
    il.document_url,
    il.mvp_type,
    il.created_at,
    COALESCE(ui.username, 'Anonymous') as username,
    ai.uniqueness,
    ai.customer_pain,
    ai.scalability,
    ai.product_market_fit,
    ai.technical_complexity,
    ai.capital_intensity,
    ai.market_saturation,
    ai.business_model_robustness,
    ai.market_growth_rate,
    ai.social_value,
    ai.overall_score
FROM public.idea_listing il
LEFT JOIN public.user_info ui ON il.user_id = ui.user_id
LEFT JOIN public.ai_scoring ai ON il.idea_id = ai.idea_id
ORDER BY il.created_at DESC;

-- Idea Detail Page View
CREATE OR REPLACE VIEW public.idea_detail_page AS
SELECT 
    il.*,
    COALESCE(ui.username, 'Anonymous') as username,
    COALESCE(ui.name, 'Anonymous User') as name,
    ui.email,
    ai.uniqueness,
    ai.customer_pain,
    ai.scalability,
    ai.product_market_fit,
    ai.technical_complexity,
    ai.capital_intensity,
    ai.market_saturation,
    ai.business_model_robustness,
    ai.market_growth_rate,
    ai.social_value,
    ai.overall_score
FROM public.idea_listing il
LEFT JOIN public.user_info ui ON il.user_id = ui.user_id
LEFT JOIN public.ai_scoring ai ON il.idea_id = ai.idea_id;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- User Info
ALTER TABLE public.user_info ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.user_info;
CREATE POLICY "Profiles are viewable by everyone" ON public.user_info FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create profiles" ON public.user_info;
CREATE POLICY "Anyone can create profiles" ON public.user_info FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_info;
CREATE POLICY "Users can update their own profile" ON public.user_info FOR UPDATE USING (auth.uid() = user_id);

-- Ventures
ALTER TABLE public.ventures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ventures are viewable by everyone" ON public.ventures;
CREATE POLICY "Ventures are viewable by everyone" ON public.ventures FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create ventures" ON public.ventures;
CREATE POLICY "Anyone can create ventures" ON public.ventures FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update their own ventures" ON public.ventures;
DROP POLICY IF EXISTS "Anyone can update ventures" ON public.ventures;
CREATE POLICY "Anyone can update ventures" ON public.ventures FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete their own ventures" ON public.ventures;
DROP POLICY IF EXISTS "Anyone can delete ventures" ON public.ventures;
CREATE POLICY "Anyone can delete ventures" ON public.ventures FOR DELETE USING (true);

-- Idea Listing
ALTER TABLE public.idea_listing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ideas are viewable by everyone" ON public.idea_listing;
CREATE POLICY "Ideas are viewable by everyone" ON public.idea_listing FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create listings" ON public.idea_listing;
CREATE POLICY "Anyone can create listings" ON public.idea_listing FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update their own listings" ON public.idea_listing;
DROP POLICY IF EXISTS "Anyone can update listings" ON public.idea_listing;
CREATE POLICY "Anyone can update listings" ON public.idea_listing FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete their own listings" ON public.idea_listing;
DROP POLICY IF EXISTS "Anyone can delete listings" ON public.idea_listing;
CREATE POLICY "Anyone can delete listings" ON public.idea_listing FOR DELETE USING (true);

-- AI Scoring
ALTER TABLE public.ai_scoring ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "AI scores are viewable by everyone" ON public.ai_scoring;
CREATE POLICY "AI scores are viewable by everyone" ON public.ai_scoring FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create AI scores" ON public.ai_scoring;
CREATE POLICY "Anyone can create AI scores" ON public.ai_scoring FOR INSERT WITH CHECK (true);

-- Venture Analysis
ALTER TABLE public.venture_analysis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Analysis is viewable by owner" ON public.venture_analysis;
CREATE POLICY "Analysis is viewable by owner" ON public.venture_analysis FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.ventures WHERE id = venture_id AND (user_id = auth.uid() OR user_id IS NULL))
);

-- Likes
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.likes;
CREATE POLICY "Likes are viewable by everyone" ON public.likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can like" ON public.likes;
CREATE POLICY "Anyone can like" ON public.likes FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can unlike" ON public.likes;
CREATE POLICY "Users can unlike" ON public.likes FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Saves
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Saves are viewable by owner" ON public.saves;
CREATE POLICY "Saves are viewable by owner" ON public.saves FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
DROP POLICY IF EXISTS "Anyone can save" ON public.saves;
CREATE POLICY "Anyone can save" ON public.saves FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can unsave" ON public.saves;
CREATE POLICY "Users can unsave" ON public.saves FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Shares
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Shares are viewable by everyone" ON public.shares;
CREATE POLICY "Shares are viewable by everyone" ON public.shares FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can share" ON public.shares;
CREATE POLICY "Anyone can share" ON public.shares FOR INSERT WITH CHECK (true);

-- =====================================================
-- TRIGGERS FOR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_info_updated_at ON public.user_info;
CREATE TRIGGER update_user_info_updated_at 
BEFORE UPDATE ON public.user_info 
FOR EACH ROW 
EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_ventures_updated_at ON public.ventures;
CREATE TRIGGER update_ventures_updated_at 
BEFORE UPDATE ON public.ventures 
FOR EACH ROW 
EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_idea_listing_updated_at ON public.idea_listing;
CREATE TRIGGER update_idea_listing_updated_at 
BEFORE UPDATE ON public.idea_listing 
FOR EACH ROW 
EXECUTE PROCEDURE update_updated_at_column();

-- =====================================================
-- DONE!
-- =====================================================
-- Your database is now ready for:
-- ✅ Anonymous submissions
-- ✅ Marketplace listings
-- ✅ Venture tracking
-- ✅ AI scoring
-- ✅ Social interactions (likes, saves, shares)


-- ============================================
-- 1. TABLES SETUP (IF NOT EXISTS)
-- ============================================

-- Ensure uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ventures Table
CREATE TABLE IF NOT EXISTS public.ventures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- Constraint removed here intentionally for anon support
    stage TEXT NOT NULL CHECK (stage IN ('Idea', 'MVP', 'Prototype', 'Executed')),
    industry TEXT NOT NULL,
    other_industry TEXT,
    business_type TEXT NOT NULL,
    payer TEXT NOT NULL,
    problem_details JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Idea Listing Table
CREATE TABLE IF NOT EXISTS public.idea_listing (
    idea_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    one_line_description TEXT,
    category TEXT,
    secondary_category TEXT,
    price INTEGER DEFAULT 0,
    document_url TEXT,
    mvp BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Decision Intelligence Analysis Table
CREATE TABLE IF NOT EXISTS public.decision_intelligence_analysis (
    analysis_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venture_id UUID NOT NULL, -- Removed strict foreign key for now if ventures doesn't stick
    research_summary JSONB,
    internet_data JSONB,
    comparison_analysis JSONB,
    solutions JSONB,
    recommended_solution_id TEXT,
    visual_roadmap_url TEXT,
    comparison_charts JSONB,
    mermaid_code TEXT,
    executive_summary TEXT,
    key_insights TEXT[],
    next_steps TEXT[],
    pipeline_logs JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Research Sources Table
CREATE TABLE IF NOT EXISTS public.research_sources (
    source_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID REFERENCES decision_intelligence_analysis(analysis_id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    publication TEXT,
    published_date DATE,
    source_type VARCHAR(50),
    credibility_score INTEGER,
    relevance_score INTEGER,
    key_insights TEXT[],
    extracted_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Venture Analysis (Old/Alternative)
CREATE TABLE IF NOT EXISTS public.venture_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venture_id UUID NOT NULL,
    roadmap_data JSONB,
    risk_assessment JSONB,
    market_potential_score INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. PERMISSION FIXES (ALLOW ANONYMOUS)
-- ============================================

-- Drop strict Foreign Keys if they exist (to allow random UUIDs for anonymous users)
ALTER TABLE public.ventures DROP CONSTRAINT IF EXISTS ventures_user_id_fkey;
ALTER TABLE public.idea_listing DROP CONSTRAINT IF EXISTS idea_listing_user_id_fkey;

-- Ventures RLS
ALTER TABLE public.ventures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can create ventures" ON public.ventures;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.ventures;
CREATE POLICY "Enable insert for all users" ON public.ventures FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update for all" ON public.ventures;
CREATE POLICY "Enable update for all" ON public.ventures FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Ventures are viewable by everyone" ON public.ventures;
CREATE POLICY "Ventures are viewable by everyone" ON public.ventures FOR SELECT USING (true);

-- Idea Listing RLS
ALTER TABLE public.idea_listing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can insert idea_listing" ON public.idea_listing;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.idea_listing;
CREATE POLICY "Enable insert for all users" ON public.idea_listing FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update for all users" ON public.idea_listing;
CREATE POLICY "Enable update for all users" ON public.idea_listing FOR UPDATE USING (true);
CREATE POLICY "Listings are viewable by everyone" ON public.idea_listing FOR SELECT USING (true);

-- Decision Intelligence RLS
ALTER TABLE public.decision_intelligence_analysis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS di_analysis_insert_policy ON decision_intelligence_analysis;
CREATE POLICY di_analysis_insert_policy ON decision_intelligence_analysis FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS di_analysis_select_policy ON decision_intelligence_analysis;
CREATE POLICY di_analysis_select_policy ON decision_intelligence_analysis FOR SELECT USING (true);
DROP POLICY IF EXISTS di_analysis_update_policy ON decision_intelligence_analysis;
CREATE POLICY di_analysis_update_policy ON decision_intelligence_analysis FOR UPDATE USING (true);

-- Venture Analysis RLS
ALTER TABLE public.venture_analysis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Analysis is viewable by owner" ON public.venture_analysis;
CREATE POLICY "Enable all access for analysis" ON public.venture_analysis FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for all" ON public.venture_analysis;
CREATE POLICY "Enable insert for all" ON public.venture_analysis FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update for all" ON public.venture_analysis;
CREATE POLICY "Enable update for all" ON public.venture_analysis FOR UPDATE USING (true);

-- Research Sources RLS
ALTER TABLE public.research_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for sources" ON public.research_sources FOR SELECT USING (true);
CREATE POLICY "Enable insert for sources" ON public.research_sources FOR INSERT WITH CHECK (true);

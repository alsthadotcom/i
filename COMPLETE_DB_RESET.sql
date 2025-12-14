-- ==============================================================================
-- COMPLETE DATABASE RESET SCRIPT
-- ==============================================================================
-- WARNING: THIS WILL DELETE ALL DATA AND TABLES.
-- Run this in the Supabase SQL Editor to completely reset your database
-- and align it with the "Sell Your Idea" Wizard.
-- ==============================================================================

-- 1. DROP EVERYTHING (Clean Slate)
DROP VIEW IF EXISTS idea_detail_page;
DROP VIEW IF EXISTS marketplace;
DROP TABLE IF EXISTS ai_scoring CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS saves CASCADE;
DROP TABLE IF EXISTS idea_listing CASCADE;
DROP TABLE IF EXISTS user_info CASCADE; -- Be careful if you want to keep profiles, but user asked for 100% reset

-- 2. CREATE USER_INFO (Linked to Auth)
CREATE TABLE user_info (
    user_id UUID REFERENCES auth.users(id) NOT NULL PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    profile_picture TEXT, -- Alias for avatar_url if code uses this
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles" ON user_info FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON user_info FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON user_info FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. CREATE IDEA_LISTING (Matches SellIdea.tsx Wizard)
CREATE TABLE idea_listing (
    idea_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Step 1: Snapshot
    title TEXT NOT NULL,
    one_line_description TEXT NOT NULL,
    category TEXT NOT NULL,
    target_customer_type TEXT,
    stage TEXT,

    -- Step 2: Problem
    problem_description TEXT,
    who_faces_problem TEXT,
    pain_level INTEGER, -- 1-5
    urgency_level TEXT,
    current_alternatives TEXT,

    -- Step 3: Solution
    solution_summary TEXT,
    primary_advantage TEXT,
    differentiation_strength INTEGER, -- 1-5

    -- Step 4: Market
    market_size TEXT,
    market_growth_trend TEXT,
    geographic_scope TEXT,

    -- Step 5: Revenue
    revenue_model_type TEXT,
    expected_price_per_customer TEXT,
    cost_intensity TEXT,

    -- Step 6: Execution
    build_difficulty TEXT,
    time_to_first_version TEXT,
    regulatory_dependency TEXT,

    -- Step 7: Validation
    validation_level TEXT,
    validation_notes TEXT,

    -- Step 8: Sale Terms
    what_is_included TEXT,
    buyer_resale_rights TEXT,
    exclusivity TEXT,
    price NUMERIC NOT NULL,

    -- Step 9: Documents
    document_url TEXT NOT NULL,
    additional_doc_1 TEXT,
    additional_doc_2 TEXT,
    additional_doc_3 TEXT
);
ALTER TABLE idea_listing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public ideas" ON idea_listing FOR SELECT USING (true);
CREATE POLICY "Users insert own ideas" ON idea_listing FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own ideas" ON idea_listing FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own ideas" ON idea_listing FOR DELETE USING (auth.uid() = user_id);

-- 4. CREATE AI_SCORING (With Unique Constraint)
CREATE TABLE ai_scoring (
    ai_score_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idea_id UUID REFERENCES idea_listing(idea_id) ON DELETE CASCADE,
    uniqueness NUMERIC,
    demand TEXT,
    problem_impact NUMERIC,
    profitability TEXT,
    viability NUMERIC,
    scalability NUMERIC,
    overall_score NUMERIC GENERATED ALWAYS AS (
      (COALESCE(uniqueness, 0) + COALESCE(problem_impact, 0) + COALESCE(viability, 0) + COALESCE(scalability, 0)) / 4
    ) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT ai_scoring_idea_id_key UNIQUE (idea_id) -- PREVENTS DUPLICATES
);
ALTER TABLE ai_scoring ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public scores" ON ai_scoring FOR SELECT USING (true);
CREATE POLICY "Users create scores" ON ai_scoring FOR INSERT WITH CHECK (true);
CREATE POLICY "Users update scores" ON ai_scoring FOR UPDATE USING (true);

-- 5. CREATE LIKES & SAVES
CREATE TABLE likes (
    like_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    idea_id UUID REFERENCES idea_listing(idea_id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, idea_id)
);
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Users manage likes" ON likes FOR ALL USING (auth.uid() = user_id);

CREATE TABLE saves (
    save_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    idea_id UUID REFERENCES idea_listing(idea_id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, idea_id)
);
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage saves" ON saves FOR ALL USING (auth.uid() = user_id);

-- 6. CREATE MARKETPLACE VIEW
CREATE OR REPLACE VIEW marketplace AS
SELECT 
    i.idea_id as marketplace_id,
    i.idea_id,
    i.title,
    i.one_line_description as description, 
    i.category,
    i.price,
    i.user_id,
    u.username,
    i.created_at,
    i.document_url, 
    
    -- AI Scores
    s.ai_score_id,
    COALESCE(s.overall_score, 0) as overall_score,
    COALESCE(s.uniqueness, 0) as uniqueness,
    COALESCE(s.viability, 0) as viability,
    COALESCE(s.profitability, 'N/A') as profitability,
    
    -- MVP Flag (Derived)
    CASE WHEN i.stage = 'Revenue generating' OR i.stage = 'MVP built' THEN true ELSE false END as mvp
    
FROM idea_listing i
LEFT JOIN ai_scoring s ON i.idea_id = s.idea_id
LEFT JOIN user_info u ON i.user_id = u.user_id;

-- 7. CREATE IDEA DETAIL VIEW
CREATE OR REPLACE VIEW idea_detail_page AS
SELECT 
    i.*,
    -- Map Description for frontend compatibility
    i.one_line_description as description,
    
    -- MVP Flag
    CASE WHEN i.stage = 'Revenue generating' OR i.stage = 'MVP built' THEN true ELSE false END as mvp,

    u.username,
    u.profile_picture,
    
    s.ai_score_id,
    s.overall_score,
    s.uniqueness,
    s.demand,
    s.problem_impact,
    s.profitability,
    s.viability,
    s.scalability
    
FROM idea_listing i
LEFT JOIN user_info u ON i.user_id = u.user_id
LEFT JOIN ai_scoring s ON i.idea_id = s.idea_id;

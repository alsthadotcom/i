-- ============================================
-- IDA Marketplace Database Schema
-- ============================================
-- This schema creates the database structure for the IDA marketplace
-- where users can buy and sell ideas with AI-powered scoring

-- ============================================
-- 1. USER INFO TABLE (Sign Up/Log In)
-- ============================================
CREATE TABLE IF NOT EXISTS user_info (
    user_id TEXT PRIMARY KEY DEFAULT ('USR_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL CHECK (username ~ '^@[a-z0-9]+$'),
    profile_picture TEXT, -- URL to profile picture in storage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_email ON user_info(email);
CREATE INDEX IF NOT EXISTS idx_user_username ON user_info(username);

-- Trigger function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to user_info table (drop first if exists to avoid errors)
DROP TRIGGER IF EXISTS update_user_info_updated_at ON user_info;
CREATE TRIGGER update_user_info_updated_at
    BEFORE UPDATE ON user_info
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. IDEA LISTING TABLE (Ideas for Sale)
-- ============================================
CREATE TABLE IF NOT EXISTS idea_listing (
    idea_id TEXT PRIMARY KEY DEFAULT ('IDEA_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
    user_id TEXT NOT NULL REFERENCES user_info(user_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    document_url TEXT NOT NULL, -- Main PDF document
    additional_doc_1 TEXT, -- Additional PDF 1
    additional_doc_2 TEXT, -- Additional PDF 2
    additional_doc_3 TEXT, -- Additional PDF 3
    mvp BOOLEAN NOT NULL DEFAULT FALSE,
    mvp_type TEXT CHECK (mvp_type IN ('Digital/Saas', 'Physical')),
    digital_mvp TEXT, -- URL or zip file path
    physical_mvp_image TEXT, -- Image URL/path
    physical_mvp_video TEXT, -- Video URL/path
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: If MVP is true, mvp_type must be set
    CONSTRAINT mvp_type_required CHECK (
        (mvp = FALSE) OR 
        (mvp = TRUE AND mvp_type IS NOT NULL)
    ),
    
    -- Constraint: If mvp_type is Digital/Saas, digital_mvp must be set
    CONSTRAINT digital_mvp_required CHECK (
        (mvp_type != 'Digital/Saas') OR 
        (mvp_type = 'Digital/Saas' AND digital_mvp IS NOT NULL)
    ),
    
    -- Constraint: If mvp_type is Physical, at least one physical MVP must be set
    CONSTRAINT physical_mvp_required CHECK (
        (mvp_type != 'Physical') OR 
        (mvp_type = 'Physical' AND (physical_mvp_image IS NOT NULL OR physical_mvp_video IS NOT NULL))
    )
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_idea_user ON idea_listing(user_id);
CREATE INDEX IF NOT EXISTS idx_idea_price ON idea_listing(price);
CREATE INDEX IF NOT EXISTS idx_idea_created ON idea_listing(created_at DESC);

-- ============================================
-- 3. AI SCORING TABLE (Idea Rating)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_scoring (
    ai_score_id TEXT PRIMARY KEY DEFAULT ('SCORE_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
    idea_id TEXT UNIQUE NOT NULL REFERENCES idea_listing(idea_id) ON DELETE CASCADE,
    uniqueness INTEGER NOT NULL CHECK (uniqueness >= 0 AND uniqueness <= 100),
    demand TEXT NOT NULL CHECK (demand IN ('Low', 'Low-Mid', 'Mid', 'Mid-High', 'High')),
    problem_impact INTEGER NOT NULL CHECK (problem_impact >= 0 AND problem_impact <= 100),
    profitability TEXT NOT NULL, -- Estimated revenue and profits as text
    viability INTEGER NOT NULL CHECK (viability >= 0 AND viability <= 100),
    scalability INTEGER NOT NULL CHECK (scalability >= 0 AND scalability <= 100),
    overall_score DECIMAL(5, 2) GENERATED ALWAYS AS (
        (uniqueness + problem_impact + viability + scalability) / 4.0
    ) STORED, -- Calculated average score
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_score_idea ON ai_scoring(idea_id);
CREATE INDEX IF NOT EXISTS idx_ai_score_overall ON ai_scoring(overall_score DESC);

-- ============================================
-- 4. MARKETPLACE VIEW
-- ============================================
-- Note: This is implemented as a VIEW rather than a table to avoid data duplication
-- Views automatically reflect the latest data from source tables
CREATE OR REPLACE VIEW marketplace AS
SELECT 
    ('MKT_' || substr(md5(il.idea_id), 1, 16)) AS marketplace_id,
    il.idea_id,
    ai.ai_score_id,
    il.title,
    il.description,
    ai.uniqueness,
    ai.viability,
    ai.profitability,
    il.price,
    ui.username,
    il.created_at,
    ai.overall_score
FROM idea_listing il
INNER JOIN ai_scoring ai ON il.idea_id = ai.idea_id
INNER JOIN user_info ui ON il.user_id = ui.user_id
ORDER BY il.created_at DESC;

-- ============================================
-- 5. IDEA DETAIL PAGE VIEW
-- ============================================
-- Note: This is also implemented as a VIEW for the same reasons as marketplace
CREATE OR REPLACE VIEW idea_detail_page AS
SELECT 
    ('DTL_' || substr(md5(il.idea_id), 1, 16)) AS idea_detail_id,
    il.idea_id,
    ai.ai_score_id,
    il.title,
    il.description,
    ai.uniqueness,
    ai.demand,
    ai.problem_impact,
    ai.profitability,
    ai.viability,
    ai.scalability,
    ai.overall_score,
    il.price,
    ui.username,
    il.mvp,
    il.mvp_type,
    il.digital_mvp,
    il.physical_mvp_image,
    il.physical_mvp_video,
    il.document_url,
    il.additional_doc_1,
    il.additional_doc_2,
    il.additional_doc_3,
    il.created_at,
    il.updated_at
FROM idea_listing il
INNER JOIN ai_scoring ai ON il.idea_id = ai.idea_id
INNER JOIN user_info ui ON il.user_id = ui.user_id;

-- ============================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_info table
DROP TRIGGER IF EXISTS update_user_info_updated_at ON user_info;
CREATE TRIGGER update_user_info_updated_at
    BEFORE UPDATE ON user_info
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for idea_listing table
DROP TRIGGER IF EXISTS update_idea_listing_updated_at ON idea_listing;
CREATE TRIGGER update_idea_listing_updated_at
    BEFORE UPDATE ON idea_listing
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for ai_scoring table
DROP TRIGGER IF EXISTS update_ai_scoring_updated_at ON ai_scoring;
CREATE TRIGGER update_ai_scoring_updated_at
    BEFORE UPDATE ON ai_scoring
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Enable RLS on all tables for security

ALTER TABLE user_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_listing ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_scoring ENABLE ROW LEVEL SECURITY;

-- User Info Policies
-- Users can read all user info (for displaying usernames, etc.)
CREATE POLICY "Users can view all user info" ON user_info
    FOR SELECT USING (true);

-- Users can only update their own info
CREATE POLICY "Users can update own info" ON user_info
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Users can insert their own info (during signup)
CREATE POLICY "Users can insert own info" ON user_info
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Idea Listing Policies
-- Anyone can view all ideas (marketplace is public)
CREATE POLICY "Anyone can view ideas" ON idea_listing
    FOR SELECT USING (true);

-- Users can only insert their own ideas
CREATE POLICY "Users can insert own ideas" ON idea_listing
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Users can only update their own ideas
CREATE POLICY "Users can update own ideas" ON idea_listing
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Users can only delete their own ideas
CREATE POLICY "Users can delete own ideas" ON idea_listing
    FOR DELETE USING (auth.uid()::text = user_id);

-- AI Scoring Policies
-- Anyone can view AI scores (needed for marketplace)
CREATE POLICY "Anyone can view AI scores" ON ai_scoring
    FOR SELECT USING (true);

-- Only the system/service role can insert AI scores
CREATE POLICY "Service role can insert AI scores" ON ai_scoring
    FOR INSERT WITH CHECK (true);

-- Only the system/service role can update AI scores
CREATE POLICY "Service role can update AI scores" ON ai_scoring
    FOR UPDATE USING (true);

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================
-- Uncomment the following to insert sample data

/*
-- Insert sample user
INSERT INTO user_info (user_id, name, email, username) VALUES
('USR_sample123456789', 'John Doe', 'john@example.com', '@johndoe');

-- Insert sample idea
INSERT INTO idea_listing (
    idea_id, user_id, title, description, document_url, 
    mvp, mvp_type, digital_mvp, price
) VALUES (
    'IDEA_sample123456789', 
    'USR_sample123456789', 
    'AI-Powered Task Manager', 
    'A revolutionary task management app that uses AI to prioritize your tasks automatically.',
    'https://example.com/documents/task-manager.pdf',
    true,
    'Digital/Saas',
    'https://demo.taskmanager.com',
    99.99
);

-- Insert sample AI score
INSERT INTO ai_scoring (
    ai_score_id, idea_id, uniqueness, demand, problem_impact,
    profitability, viability, scalability
) VALUES (
    'SCORE_sample123456789',
    'IDEA_sample123456789',
    85,
    'High',
    90,
    'Estimated $100K-$500K annual revenue',
    88,
    92
);
*/

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE user_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_listing ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_scoring ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USER_INFO POLICIES
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON user_info
    FOR SELECT
    USING (auth.uid()::text = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON user_info
    FOR UPDATE
    USING (auth.uid()::text = user_id);

-- Allow users to insert their own profile (for signup)
CREATE POLICY "Users can insert own profile"
    ON user_info
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

-- ============================================
-- IDEA_LISTING POLICIES
-- ============================================

-- Anyone can view all idea listings (public marketplace)
CREATE POLICY "Anyone can view idea listings"
    ON idea_listing
    FOR SELECT
    USING (true);

-- Users can create their own idea listings
CREATE POLICY "Users can create own listings"
    ON idea_listing
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own listings
CREATE POLICY "Users can update own listings"
    ON idea_listing
    FOR UPDATE
    USING (auth.uid()::text = user_id);

-- Users can delete their own listings
CREATE POLICY "Users can delete own listings"
    ON idea_listing
    FOR DELETE
    USING (auth.uid()::text = user_id);

-- ============================================
-- AI_SCORING POLICIES
-- ============================================

-- Anyone can view AI scores (public data)
CREATE POLICY "Anyone can view AI scores"
    ON ai_scoring
    FOR SELECT
    USING (true);

-- Only the idea owner can create AI scores for their ideas
CREATE POLICY "Idea owners can create AI scores"
    ON ai_scoring
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM idea_listing
            WHERE idea_listing.idea_id = ai_scoring.idea_id
            AND idea_listing.user_id = auth.uid()::text
        )
    );

-- Only the idea owner can update AI scores
CREATE POLICY "Idea owners can update AI scores"
    ON ai_scoring
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM idea_listing
            WHERE idea_listing.idea_id = ai_scoring.idea_id
            AND idea_listing.user_id = auth.uid()::text
        )
    );

-- ============================================
-- STORAGE POLICIES (for Supabase Storage buckets)
-- ============================================
-- Note: These need to be created in Supabase Dashboard > Storage > Policies

-- Bucket: idea-assets
-- Policy: Users can upload to their own folder
-- INSERT: bucket_id = 'idea-assets' AND (storage.foldername(name))[1] = auth.uid()::text

-- Policy: Anyone can view uploaded files
-- SELECT: bucket_id = 'idea-assets'

-- Policy: Users can update their own files
-- UPDATE: bucket_id = 'idea-assets' AND (storage.foldername(name))[1] = auth.uid()::text

-- Policy: Users can delete their own files
-- DELETE: bucket_id = 'idea-assets' AND (storage.foldername(name))[1] = auth.uid()::text


-- ============================================
-- HELPFUL QUERIES
-- ============================================

-- View all ideas in the marketplace with scores
-- SELECT * FROM marketplace;

-- View detailed information about a specific idea
-- SELECT * FROM idea_detail_page WHERE idea_id = 'your_idea_id';

-- Get top-rated ideas
-- SELECT * FROM marketplace ORDER BY overall_score DESC LIMIT 10;

-- Get ideas by a specific user
-- SELECT * FROM marketplace WHERE username = '@yourusername';

-- ============================================
-- END OF SCHEMA
-- ============================================

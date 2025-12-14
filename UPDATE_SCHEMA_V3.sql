-- ==============================================================================
-- UPDATE SCHEMA V3
-- Reshaping idea_listing for new 7-section narrative format + Idea Info
-- ==============================================================================

-- 1. Drop views dependent on idea_listing columns
DROP VIEW IF EXISTS idea_detail_page;
DROP VIEW IF EXISTS marketplace;

-- 2. Alter idea_listing table
-- Add new columns
ALTER TABLE idea_listing 
ADD COLUMN IF NOT EXISTS secondary_category TEXT,
ADD COLUMN IF NOT EXISTS customer_pain TEXT[],
ADD COLUMN IF NOT EXISTS current_solutions TEXT[],
ADD COLUMN IF NOT EXISTS execution_steps TEXT[],
ADD COLUMN IF NOT EXISTS growth_plan TEXT[],
ADD COLUMN IF NOT EXISTS solution_details TEXT,
ADD COLUMN IF NOT EXISTS revenue_plan TEXT,
ADD COLUMN IF NOT EXISTS impact TEXT;

-- Drop old columns (Optional: can keep them nullable for legacy data, but user said "Remove all old input types completely")
-- For safety in a migration script, we usually don't drop data unless certain. 
-- However, "Remove all old input types completely" implies a clean break.
-- I will DROP them to force the code updates and ensure no legacy junk remains.

ALTER TABLE idea_listing
DROP COLUMN IF EXISTS target_customer_type,
DROP COLUMN IF EXISTS stage,
DROP COLUMN IF EXISTS problem_description, -- Replaced by customer_pain (array)
DROP COLUMN IF EXISTS who_faces_problem,
DROP COLUMN IF EXISTS pain_level,
DROP COLUMN IF EXISTS urgency_level,
DROP COLUMN IF EXISTS current_alternatives, -- Replaced by current_solutions (array)
DROP COLUMN IF EXISTS solution_summary, -- Replaced by solution_details
DROP COLUMN IF EXISTS primary_advantage,
DROP COLUMN IF EXISTS differentiation_strength,
DROP COLUMN IF EXISTS market_size,
DROP COLUMN IF EXISTS market_growth_trend,
DROP COLUMN IF EXISTS geographic_scope,
DROP COLUMN IF EXISTS revenue_model_type, -- Replaced by revenue_plan
DROP COLUMN IF EXISTS expected_price_per_customer,
DROP COLUMN IF EXISTS cost_intensity,
DROP COLUMN IF EXISTS build_difficulty,
DROP COLUMN IF EXISTS time_to_first_version,
DROP COLUMN IF EXISTS regulatory_dependency,
DROP COLUMN IF EXISTS validation_level,
DROP COLUMN IF EXISTS validation_notes,
DROP COLUMN IF EXISTS what_is_included,
DROP COLUMN IF EXISTS buyer_resale_rights,
DROP COLUMN IF EXISTS exclusivity;

-- 3. Recreate Views

-- Marketplace View
-- Needs to map new columns to 'description' or keep it simple.
-- 'one_line_description' is preserved.
CREATE OR REPLACE VIEW marketplace AS
SELECT 
    i.idea_id as marketplace_id,
    i.idea_id,
    i.title,
    i.one_line_description as description, 
    i.category,
    i.secondary_category, -- Added
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
    
    -- MVP flag: Since we removed 'stage', we default to false or need a new logic.
    -- For now, hardcode false or infer from somewhere else. 
    -- User didn't specify MVP replacement. We'll set to false.
    false as mvp
    
FROM idea_listing i
LEFT JOIN ai_scoring s ON i.idea_id = s.idea_id
LEFT JOIN user_info u ON i.user_id::text = u.user_id::text;


-- Idea Detail View
CREATE OR REPLACE VIEW idea_detail_page AS
SELECT 
    i.idea_id,
    i.user_id,
    i.created_at,
    i.updated_at,
    i.title,
    i.one_line_description,
    i.category,
    i.secondary_category,
    i.price,
    i.document_url,
    i.additional_doc_1,
    i.additional_doc_2,
    i.additional_doc_3,
    
    -- New Narrative Fields
    i.customer_pain,
    i.current_solutions,
    i.execution_steps,
    i.growth_plan,
    i.solution_details,
    i.revenue_plan,
    i.impact,

    -- User Info
    u.username,
    u.profile_picture,
    
    -- AI Scores
    s.ai_score_id,
    s.overall_score,
    s.uniqueness,
    s.demand,
    s.problem_impact,
    s.profitability,
    s.viability,
    s.scalability,
    
    -- Compat
    i.one_line_description as description,
    false as mvp
    
FROM idea_listing i
LEFT JOIN user_info u ON i.user_id::text = u.user_id::text
LEFT JOIN ai_scoring s ON i.idea_id = s.idea_id;

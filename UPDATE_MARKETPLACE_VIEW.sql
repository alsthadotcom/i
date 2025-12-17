-- ==============================================================================
-- Fix Marketplace Visibility and Detail View
-- ==============================================================================
-- 1. Updates 'marketplace' view to use LEFT JOINs (shows listings even if scoring pending)
-- 2. Updates 'idea_detail_page' view to use LEFT JOINs and include ALL granular columns
--    so that the Edit form and Details page work correctly.
-- ==============================================================================

-- Drop existing views
DROP VIEW IF EXISTS idea_detail_page;
DROP VIEW IF EXISTS marketplace;

-- ==============================================================================
-- 1. MARKETPLACE VIEW
-- ==============================================================================
CREATE OR REPLACE VIEW marketplace AS
SELECT 
    gen_random_uuid() AS marketplace_id,
    il.idea_id,
    COALESCE(ai.ai_score_id, 'pending') AS ai_score_id,
    il.title,
    COALESCE(il.one_line_description, '') AS description,
    
    -- AI Metrics (Coalesce to 0)
    COALESCE(ai.uniqueness, 0) AS uniqueness,
    COALESCE(ai.product_market_fit, 0) AS viability,
    'TBD' AS profitability,
    COALESCE(ai.market_saturation, 0) AS market_saturation,
    COALESCE(ai.capital_intensity, 0) AS capital_intensity,
    
    il.category,
    il.secondary_category,
    CASE 
        WHEN il.mvp_type IS NOT NULL THEN true 
        ELSE false 
    END AS mvp,
    il.document_url,
    il.price,
    COALESCE(ui.username, 'Anonymous') AS username,
    il.created_at,
    
    -- Overall Score Calculation
    ROUND(
        (
            COALESCE(ai.uniqueness, 0) + COALESCE(ai.customer_pain, 0) + COALESCE(ai.scalability, 0) + 
            COALESCE(ai.product_market_fit, 0) + COALESCE(ai.technical_complexity, 0) + 
            COALESCE(ai.capital_intensity, 0) + COALESCE(ai.market_saturation, 0) + 
            COALESCE(ai.business_model_robustness, 0) + COALESCE(ai.market_growth_rate, 0) + 
            COALESCE(ai.social_value, 0)
        ) / 10.0, 
        2
    ) AS overall_score
    
FROM idea_listing il
LEFT JOIN ai_scoring ai ON il.idea_id = ai.idea_id
LEFT JOIN user_info ui ON il.user_id = ui.user_id
ORDER BY il.created_at DESC;

-- ==============================================================================
-- 2. IDEA DETAIL PAGE VIEW
-- ==============================================================================
CREATE OR REPLACE VIEW idea_detail_page AS
SELECT 
    gen_random_uuid() AS idea_detail_id, -- Matches Type definition (optional unique id)
    il.idea_id,
    il.user_id,                          -- Needed for RLS checks/Edit permission
    COALESCE(ai.ai_score_id, 'pending') AS ai_score_id,
    il.title,
    COALESCE(il.one_line_description, '') AS description, -- Mapped to 'description'
    il.one_line_description,             -- Full field
    il.category,
    il.secondary_category,

    -- Granular Fields (V4)
    il.pain_who,
    il.pain_problem,
    il.pain_frequency,
    
    il.solution_current,
    il.solution_insufficient,
    il.solution_risks,
    
    il.exec_steps,
    il.exec_skills,
    il.exec_risks,
    
    il.growth_acquisition,
    il.growth_drivers,
    il.growth_expansion,
    
    il.sol_what,
    il.sol_how,
    il.sol_why_better,
    
    il.rev_who_pays,
    il.rev_flow,
    il.rev_retention,
    
    il.impact_who,
    il.impact_improvement,
    il.impact_scale,

    -- AI Scoring (10 Metrics)
    COALESCE(ai.uniqueness, 0) AS uniqueness,
    COALESCE(ai.customer_pain, 0) AS customer_pain,
    COALESCE(ai.scalability, 0) AS scalability,
    COALESCE(ai.product_market_fit, 0) AS product_market_fit,
    COALESCE(ai.technical_complexity, 0) AS technical_complexity,
    COALESCE(ai.capital_intensity, 0) AS capital_intensity,
    COALESCE(ai.market_saturation, 0) AS market_saturation,
    COALESCE(ai.business_model_robustness, 0) AS business_model_robustness,
    COALESCE(ai.market_growth_rate, 0) AS market_growth_rate,
    COALESCE(ai.social_value, 0) AS social_value,

    -- Overall Score
    ROUND((COALESCE(ai.uniqueness, 0) + COALESCE(ai.customer_pain, 0) + COALESCE(ai.scalability, 0) + COALESCE(ai.product_market_fit, 0) + COALESCE(ai.technical_complexity, 0) + COALESCE(ai.capital_intensity, 0) + COALESCE(ai.market_saturation, 0) + COALESCE(ai.business_model_robustness, 0) + COALESCE(ai.market_growth_rate, 0) + COALESCE(ai.social_value, 0)) / 10.0, 2) AS overall_score,

    -- Listing Metadata
    il.price,
    COALESCE(ui.username, 'Anonymous') AS username,
    ui.profile_picture,

    CASE WHEN il.mvp_type IS NOT NULL THEN true ELSE false END AS mvp,
    il.mvp_type,
    il.mvp_url,
    il.mvp_image_url,
    il.mvp_video_url,

    il.document_url,
    il.additional_doc_1,
    il.additional_doc_2,
    il.additional_doc_3,

    il.created_at,
    il.updated_at

FROM idea_listing il
LEFT JOIN ai_scoring ai ON il.idea_id = ai.idea_id
LEFT JOIN user_info ui ON il.user_id = ui.user_id;

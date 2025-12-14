-- Fix Marketplace View to include Username
-- This requires user_info and idea_listing tables to be populated and linked.

DROP VIEW IF EXISTS marketplace;

CREATE OR REPLACE VIEW marketplace AS
SELECT 
    i.idea_id as marketplace_id,
    i.idea_id,
    i.title,
    i.one_line_description as description, -- Using brief description for cards
    i.category,
    i.price,
    i.user_id,
    u.username, -- Added username
    i.created_at,
    i.document_url,
    -- AI Scores
    s.ai_score_id,
    COALESCE(s.overall_score, 0) as overall_score,
    COALESCE(s.uniqueness, 0) as uniqueness,
    COALESCE(s.viability, 0) as viability,
    COALESCE(s.profitability, 'N/A') as profitability,
    
    -- MVP flag
    CASE WHEN i.stage = 'MVP built' OR i.stage = 'Revenue generating' THEN true ELSE false END as mvp
    
FROM idea_listing i
LEFT JOIN ai_scoring s ON i.idea_id = s.idea_id
LEFT JOIN user_info u ON i.user_id::text = u.user_id::text; -- Cast to text to ensure match if one is uuid and other is text

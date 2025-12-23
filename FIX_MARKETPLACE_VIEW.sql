-- Recreate Marketplace View without AI Scoring
DROP VIEW IF EXISTS marketplace;

CREATE OR REPLACE VIEW marketplace AS
SELECT 
    il.idea_id,
    il.title,
    il.one_line_description AS description,
    il.category,
    il.price,
    il.created_at,
    il.document_url,
    v.stage,
    v.business_type,
    v.industry,
    ui.username,
    ui.profile_picture,
    (CASE WHEN il.document_url IS NOT NULL THEN true ELSE false END) AS has_docs,
    (CASE WHEN v.stage = 'MVP' OR v.stage = 'Executed' THEN true ELSE false END) AS mvp,
    0 AS overall_score, -- Placeholder or removed entirely
    0 AS uniqueness,
    0 AS market_saturation,
    0 AS capital_intensity,
    il.user_id 
FROM idea_listing il
LEFT JOIN ventures v ON il.idea_id = v.id -- Assuming idea_id maps to venture.id, or fixing syntax first
LEFT JOIN user_info ui ON il.user_id = ui.user_id;

-- Grant access
GRANT SELECT ON marketplace TO anon, authenticated, service_role;

-- Update all existing AI scoring records with random scores between 10-90
-- This will give each metric a different random value for each idea

UPDATE ai_scoring
SET 
    uniqueness = FLOOR(10 + RANDOM() * 81)::INTEGER,
    customer_pain = FLOOR(10 + RANDOM() * 81)::INTEGER,
    scalability = FLOOR(10 + RANDOM() * 81)::INTEGER,
    product_market_fit = FLOOR(10 + RANDOM() * 81)::INTEGER,
    technical_complexity = FLOOR(10 + RANDOM() * 81)::INTEGER,
    capital_intensity = FLOOR(10 + RANDOM() * 81)::INTEGER,
    market_saturation = FLOOR(10 + RANDOM() * 81)::INTEGER,
    business_model_robustness = FLOOR(10 + RANDOM() * 81)::INTEGER,
    market_growth_rate = FLOOR(10 + RANDOM() * 81)::INTEGER,
    social_value = FLOOR(10 + RANDOM() * 81)::INTEGER,
    updated_at = NOW()
WHERE 
    -- Only update records where all scores are the same (likely the old default of 50)
    uniqueness = customer_pain 
    AND customer_pain = scalability 
    AND scalability = product_market_fit;

-- Verify the update
SELECT 
    ai_score_id,
    idea_id,
    uniqueness,
    customer_pain,
    scalability,
    product_market_fit,
    technical_complexity,
    capital_intensity,
    market_saturation,
    business_model_robustness,
    market_growth_rate,
    social_value
FROM ai_scoring
ORDER BY updated_at DESC
LIMIT 10;

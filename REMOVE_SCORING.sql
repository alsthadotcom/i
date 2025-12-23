-- Remove AI Scoring Table and related logic
DROP TABLE IF EXISTS ai_scoring CASCADE;

-- If you have any functions or policies related to ai_scoring that weren't cascaded, drop them here.
-- Example (if they existed):
-- DROP FUNCTION IF EXISTS check_ai_scoring_access;
-- DROP POLICY IF EXISTS "Enable read access for all users" ON ai_scoring;

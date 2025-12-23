
-- 1. Drop Foreign Key Constraint on ventures.user_id to allow anonymous mechanics
ALTER TABLE public.ventures DROP CONSTRAINT IF EXISTS ventures_user_id_fkey;

-- 2. Update RLS for Ventures to allow anonymous creation
DROP POLICY IF EXISTS "Authenticated users can create ventures" ON public.ventures;
CREATE POLICY "Enable insert for all users" ON public.ventures FOR INSERT WITH CHECK (true);

-- 3. Update RLS for Idea Listing
ALTER TABLE public.idea_listing DROP CONSTRAINT IF EXISTS idea_listing_user_id_fkey;
DROP POLICY IF EXISTS "Authenticated users can insert idea_listing" ON public.idea_listing;
CREATE POLICY "Enable insert for all users" ON public.idea_listing FOR INSERT WITH CHECK (true);

-- 4. Update Decision Intelligence Analysis RLS
DROP POLICY IF EXISTS di_analysis_insert_policy ON decision_intelligence_analysis;
CREATE POLICY di_analysis_insert_policy ON decision_intelligence_analysis FOR INSERT WITH CHECK (true);

-- 5. Update Venture Analysis RLS (if strict)
DROP POLICY IF EXISTS "Analysis is viewable by owner" ON public.venture_analysis;
CREATE POLICY "Enable all access for analysis" ON public.venture_analysis FOR SELECT USING (true);
CREATE POLICY "Enable insert for all" ON public.venture_analysis FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all" ON public.venture_analysis FOR UPDATE USING (true);

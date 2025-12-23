-- =====================================================
-- COMPLETE MARKETPLACE SCHEMA (INCLUDING USER_INFO)
-- Run this in Supabase SQL Editor
-- =====================================================

-- 0. Recreate user_info table
CREATE TABLE IF NOT EXISTS public.user_info (
    user_id UUID PRIMARY KEY,
    email TEXT UNIQUE,
    username TEXT UNIQUE,
    name TEXT,
    full_name TEXT,
    profile_picture TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1. Create idea_listing table
CREATE TABLE IF NOT EXISTS public.idea_listing (
    idea_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- Nullable to allow anonymous submissions
    title TEXT NOT NULL,
    one_line_description TEXT,
    category TEXT,
    secondary_category TEXT,
    price NUMERIC(10, 2) DEFAULT 0,
    document_url TEXT,
    additional_doc_1 TEXT,
    additional_doc_2 TEXT,
    additional_doc_3 TEXT,
    mvp_type TEXT CHECK (mvp_type IN ('Digital/Saas', 'Physical', NULL)),
    digital_mvp_url TEXT,
    physical_mvp_image TEXT,
    physical_mvp_video TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create ai_scoring table
CREATE TABLE IF NOT EXISTS public.ai_scoring (
    ai_score_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID REFERENCES public.idea_listing(idea_id) ON DELETE CASCADE NOT NULL,
    uniqueness INTEGER CHECK (uniqueness >= 0 AND uniqueness <= 100),
    customer_pain INTEGER CHECK (customer_pain >= 0 AND customer_pain <= 100),
    scalability INTEGER CHECK (scalability >= 0 AND scalability <= 100),
    product_market_fit INTEGER CHECK (product_market_fit >= 0 AND product_market_fit <= 100),
    technical_complexity INTEGER CHECK (technical_complexity >= 0 AND technical_complexity <= 100),
    capital_intensity INTEGER CHECK (capital_intensity >= 0 AND capital_intensity <= 100),
    market_saturation INTEGER CHECK (market_saturation >= 0 AND market_saturation <= 100),
    business_model_robustness INTEGER CHECK (business_model_robustness >= 0 AND business_model_robustness <= 100),
    market_growth_rate INTEGER CHECK (market_growth_rate >= 0 AND market_growth_rate <= 100),
    social_value INTEGER CHECK (social_value >= 0 AND social_value <= 100),
    overall_score INTEGER GENERATED ALWAYS AS (
        (COALESCE(uniqueness, 0) + 
         COALESCE(customer_pain, 0) + 
         COALESCE(scalability, 0) + 
         COALESCE(product_market_fit, 0) + 
         COALESCE(technical_complexity, 0) + 
         COALESCE(capital_intensity, 0) + 
         COALESCE(market_saturation, 0) + 
         COALESCE(business_model_robustness, 0) + 
         COALESCE(market_growth_rate, 0) + 
         COALESCE(social_value, 0)) / 10
    ) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create marketplace view
CREATE OR REPLACE VIEW public.marketplace AS
SELECT 
    il.idea_id,
    il.user_id,
    il.title,
    il.one_line_description,
    il.category,
    il.secondary_category,
    il.price,
    il.document_url,
    il.mvp_type,
    il.created_at,
    COALESCE(ui.username, 'Anonymous') as username,
    ai.uniqueness,
    ai.customer_pain,
    ai.scalability,
    ai.product_market_fit,
    ai.technical_complexity,
    ai.capital_intensity,
    ai.market_saturation,
    ai.business_model_robustness,
    ai.market_growth_rate,
    ai.social_value,
    ai.overall_score
FROM public.idea_listing il
LEFT JOIN public.user_info ui ON il.user_id = ui.user_id
LEFT JOIN public.ai_scoring ai ON il.idea_id = ai.idea_id
ORDER BY il.created_at DESC;

-- 4. Create idea_detail_page view
CREATE OR REPLACE VIEW public.idea_detail_page AS
SELECT 
    il.*,
    COALESCE(ui.username, 'Anonymous') as username,
    COALESCE(ui.name, 'Anonymous User') as name,
    ui.email,
    ai.uniqueness,
    ai.customer_pain,
    ai.scalability,
    ai.product_market_fit,
    ai.technical_complexity,
    ai.capital_intensity,
    ai.market_saturation,
    ai.business_model_robustness,
    ai.market_growth_rate,
    ai.social_value,
    ai.overall_score
FROM public.idea_listing il
LEFT JOIN public.user_info ui ON il.user_id = ui.user_id
LEFT JOIN public.ai_scoring ai ON il.idea_id = ai.idea_id;

-- 5. Add RLS policies for user_info
ALTER TABLE public.user_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.user_info FOR SELECT USING (true);
CREATE POLICY "Anyone can create profiles" ON public.user_info FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own profile" ON public.user_info FOR UPDATE USING (auth.uid() = user_id);

-- Add trigger for user_info updated_at
CREATE TRIGGER update_user_info_updated_at 
BEFORE UPDATE ON public.user_info 
FOR EACH ROW 
EXECUTE PROCEDURE update_updated_at_column();

-- 6. Add RLS policies for idea_listing
ALTER TABLE public.idea_listing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ideas are viewable by everyone" ON public.idea_listing FOR SELECT USING (true);
CREATE POLICY "Anyone can create listings" ON public.idea_listing FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own listings" ON public.idea_listing FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own listings" ON public.idea_listing FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.ai_scoring ENABLE ROW LEVEL SECURITY;
CREATE POLICY "AI scores are viewable by everyone" ON public.ai_scoring FOR SELECT USING (true);
CREATE POLICY "Anyone can create AI scores" ON public.ai_scoring FOR INSERT WITH CHECK (true);

-- 6. Add trigger for updated_at
CREATE TRIGGER update_idea_listing_updated_at 
BEFORE UPDATE ON public.idea_listing 
FOR EACH ROW 
EXECUTE PROCEDURE update_updated_at_column();

-- 7. Update ventures table for anonymous submissions
ALTER TABLE public.ventures ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.ventures DROP CONSTRAINT IF EXISTS ventures_user_id_fkey;
DROP POLICY IF EXISTS "Authenticated users can create ventures" ON public.ventures;
CREATE POLICY "Anyone can create ventures" ON public.ventures FOR INSERT WITH CHECK (true);

-- Done! Your database is now ready for anonymous submissions and marketplace listings.

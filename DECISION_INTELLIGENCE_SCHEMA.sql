-- ============================================
-- DECISION INTELLIGENCE PLATFORM
-- Database Schema
-- ============================================

-- Main analysis table
CREATE TABLE IF NOT EXISTS decision_intelligence_analysis (
    analysis_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venture_id UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
    
    -- Stage outputs (stored as JSONB)
    research_summary JSONB, -- ContextAnalysis
    internet_data JSONB, -- ResearchDossier
    comparison_analysis JSONB, -- ValidationAnalysis
    
    -- Solution approaches (array of SolutionApproach objects)
    solutions JSONB,
    recommended_solution_id TEXT,
    
    -- Visual assets
    visual_roadmap_url TEXT,
    comparison_charts JSONB,
    mermaid_code TEXT,
    
    -- Summary fields
    executive_summary TEXT,
    key_insights TEXT[],
    next_steps TEXT[],
    
    -- Metadata
    pipeline_logs JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Research sources table (normalized for querying)
CREATE TABLE IF NOT EXISTS research_sources (
    source_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID REFERENCES decision_intelligence_analysis(analysis_id) ON DELETE CASCADE,
    
    -- Source details
    url TEXT NOT NULL,
    title TEXT,
    publication TEXT,
    published_date DATE,
    
    -- Classification
    source_type VARCHAR(50) CHECK (source_type IN ('case_study', 'research_paper', 'news_article', 'industry_report')),
    credibility_score INTEGER CHECK (credibility_score BETWEEN 1 AND 10),
    relevance_score INTEGER CHECK (relevance_score BETWEEN 1 AND 10),
    
    -- Content
    key_insights TEXT[],
    extracted_data JSONB,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_di_analysis_venture ON decision_intelligence_analysis(venture_id);
CREATE INDEX IF NOT EXISTS idx_research_sources_analysis ON research_sources(analysis_id);
CREATE INDEX IF NOT EXISTS idx_research_sources_type ON research_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_research_sources_credibility ON research_sources(credibility_score);

-- Row Level Security (RLS)
ALTER TABLE decision_intelligence_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_sources ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own analyses
CREATE POLICY di_analysis_select_policy ON decision_intelligence_analysis
    FOR SELECT
    USING (
        venture_id IN (
            SELECT id FROM ventures WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can insert their own analyses
CREATE POLICY di_analysis_insert_policy ON decision_intelligence_analysis
    FOR INSERT
    WITH CHECK (
        venture_id IN (
            SELECT id FROM ventures WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can update their own analyses
CREATE POLICY di_analysis_update_policy ON decision_intelligence_analysis
    FOR UPDATE
    USING (
        venture_id IN (
            SELECT id FROM ventures WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can view sources for their analyses
CREATE POLICY research_sources_select_policy ON research_sources
    FOR SELECT
    USING (
        analysis_id IN (
            SELECT analysis_id FROM decision_intelligence_analysis dia
            JOIN ventures v ON dia.venture_id = v.id
            WHERE v.user_id = auth.uid()
        )
    );

-- Policy: Users can insert sources for their analyses
CREATE POLICY research_sources_insert_policy ON research_sources
    FOR INSERT
    WITH CHECK (
        analysis_id IN (
            SELECT analysis_id FROM decision_intelligence_analysis dia
            JOIN ventures v ON dia.venture_id = v.id
            WHERE v.user_id = auth.uid()
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_di_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS di_analysis_updated_at_trigger ON decision_intelligence_analysis;
CREATE TRIGGER di_analysis_updated_at_trigger
    BEFORE UPDATE ON decision_intelligence_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_di_analysis_updated_at();

-- View for easy querying
CREATE OR REPLACE VIEW decision_intelligence_summary AS
SELECT 
    dia.analysis_id,
    dia.venture_id,
    v.user_id,
    dia.executive_summary,
    dia.key_insights,
    dia.next_steps,
    dia.recommended_solution_id,
    jsonb_array_length(COALESCE(dia.solutions, '[]'::jsonb)) as solution_count,
    (SELECT COUNT(*) FROM research_sources WHERE analysis_id = dia.analysis_id) as source_count,
    dia.created_at,
    dia.updated_at
FROM decision_intelligence_analysis dia
JOIN ventures v ON dia.venture_id = v.id;

-- Grant permissions
GRANT SELECT ON decision_intelligence_summary TO authenticated;
GRANT SELECT, INSERT, UPDATE ON decision_intelligence_analysis TO authenticated;
GRANT SELECT, INSERT ON research_sources TO authenticated;

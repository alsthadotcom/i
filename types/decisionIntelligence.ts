/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Type definitions for Decision Intelligence Platform
 */

// ============================================
// SOLUTION APPROACH TYPES
// ============================================

export type SolutionCategory = 'capital_driven' | 'human_expertise_driven' | 'technology_driven';
export type RiskLevel = 'low' | 'medium' | 'high';
export type SourceCredibility = 'high' | 'medium' | 'low';
export type SourceType = 'case_study' | 'research_paper' | 'news_article' | 'industry_report';

export interface CapitalRequirement {
    min: number;
    max: number;
    currency: string;
}

export interface TimeToMarket {
    min_months: number;
    max_months: number;
}

export interface ResourceRequirement {
    team_size: number;
    skills_needed: string[];
    infrastructure: string[];
}

export interface RoadmapPhase {
    name: string;
    duration: string;
    milestones: string[];
    deliverables: string[];
    estimated_cost: number;
    sources?: string[]; // Citation references
}

export interface ProvenExample {
    company_name: string;
    case_study_url: string;
    success_metrics: string[];
    source_credibility: SourceCredibility;
    publication?: string;
    year?: number;
}

export interface ResearchSource {
    title: string;
    url: string;
    publication: string;
    date: string;
    key_insights: string[];
    credibility: SourceCredibility;
    source_type: SourceType;
}

export interface SolutionApproach {
    id: string;
    name: string;
    category: SolutionCategory;

    // Resource Requirements
    capital_required: CapitalRequirement;
    time_to_market: TimeToMarket;
    resource_requirements: ResourceRequirement;

    // Risk Assessment
    risk_level: RiskLevel;
    risk_factors: string[];
    mitigation_strategies: string[];

    // Roadmap
    phases: RoadmapPhase[];

    // Proof & Sources
    proven_examples: ProvenExample[];
    sources: ResearchSource[];

    // Summary
    executive_summary: string;
    why_this_approach: string;
}

// ============================================
// RESEARCH TYPES
// ============================================

export interface ResearchQuery {
    query: string;
    category: 'market_data' | 'competitors' | 'case_studies' | 'frameworks' | 'best_practices';
    priority: number;
}

export interface ResearchResult {
    query: string;
    results: Array<{
        title: string;
        url: string;
        snippet: string;
        source_quality: number;
    }>;
    synthesized_insights: string;
    key_data_points: string[];
    citations: string[];
}

export interface ResearchDossier {
    market_analysis: {
        market_size: string;
        growth_rate: string;
        trends: string[];
        sources: ResearchSource[];
    };
    competitor_analysis: {
        competitors: Array<{
            name: string;
            approach: string;
            strengths: string[];
            weaknesses: string[];
        }>;
        sources: ResearchSource[];
    };
    proven_methods: Array<{
        method_name: string;
        description: string;
        success_rate: string;
        examples: ProvenExample[];
        sources: ResearchSource[];
    }>;
    all_sources: ResearchSource[];
}

// ============================================
// PIPELINE TYPES
// ============================================

export type PipelineStage = 1 | 2 | 3 | 4;
export type StageStatus = 'pending' | 'processing' | 'completed' | 'error';

export interface PipelineLog {
    stage: PipelineStage;
    stage_name: string;
    model: string;
    status: StageStatus;
    message: string;
    started_at?: Date;
    completed_at?: Date;
    output?: string;
    error?: string;
}

export interface ContextAnalysis {
    user_situation: {
        stage: string;
        resources: string[];
        constraints: string[];
        goals: string[];
    };
    key_claims: string[];
    research_queries: ResearchQuery[];
    decision_points: string[];
    generated_prompts: {
        research_prompt: string;
        competitor_prompt: string;
    };
}

export interface ValidationAnalysis {
    contradictions: Array<{
        claim: string;
        finding: string;
        severity: 'high' | 'medium' | 'low';
    }>;
    gaps: string[];
    credibility_assessment: {
        overall_score: number;
        factors: string[];
    };
    recommendations: string[];
}

// ============================================
// FINAL OUTPUT
// ============================================

export interface DecisionIntelligenceOutput {
    // Pipeline metadata
    pipeline_logs: PipelineLog[];
    timestamp: Date;

    // Stage outputs
    context_analysis: ContextAnalysis;
    research_dossier: ResearchDossier;
    validation_analysis: ValidationAnalysis;

    // Solutions
    solution_approaches: SolutionApproach[];
    recommended_approach_id?: string;

    // Visual assets
    visual_assets: {
        roadmap_diagram_url?: string;
        comparison_chart_data?: any;
        mermaid_code?: string;
    };

    // Overall summary
    executive_summary: string;
    key_insights: string[];
    next_steps: string[];
}

// ============================================
// DATABASE TYPES
// ============================================

export interface DecisionIntelligenceAnalysis {
    analysis_id: string;
    venture_id: string;

    // Research Data (JSONB)
    research_summary: ContextAnalysis;
    internet_data: ResearchDossier;
    comparison_analysis: ValidationAnalysis;

    // Visual Assets
    visual_roadmap_url?: string;
    comparison_charts?: any;

    // Solution Approaches (JSONB array)
    solutions: SolutionApproach[];

    created_at: Date;
    updated_at: Date;
}

export interface ResearchSourceRecord {
    source_id: string;
    analysis_id: string;

    url: string;
    title: string;
    publication: string;
    published_date?: Date;

    source_type: SourceType;
    credibility_score: number; // 1-10
    relevance_score: number; // 1-10

    key_insights: string[];
    extracted_data?: any; // JSONB

    created_at: Date;
}

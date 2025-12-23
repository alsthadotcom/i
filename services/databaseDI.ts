/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Database Service Extension for Decision Intelligence
 */

import { supabase } from './supabase';
import {
    DecisionIntelligenceAnalysis,
    ResearchSourceRecord
} from '../types/decisionIntelligence';

// ============================================
// DECISION INTELLIGENCE ANALYSIS OPERATIONS
// ============================================

export async function saveDecisionIntelligenceAnalysis(
    ventureId: string,
    analysisData: any
): Promise<{ data: any | null; error: any }> {

    try {
        // Check if analysis already exists for this venture
        const { data: existing } = await supabase
            .from('decision_intelligence_analysis')
            .select('analysis_id')
            .eq('venture_id', ventureId)
            .maybeSingle();

        let result;
        if (existing) {
            // Update existing
            result = await supabase
                .from('decision_intelligence_analysis')
                .update({
                    research_summary: analysisData.context_analysis,
                    internet_data: analysisData.research_dossier,
                    comparison_analysis: analysisData.validation_analysis,
                    solutions: analysisData.solution_approaches,
                    recommended_solution_id: analysisData.recommended_approach_id,
                    comparison_charts: analysisData.visual_assets.comparison_chart_data,
                    mermaid_code: analysisData.visual_assets.mermaid_code,
                    executive_summary: analysisData.executive_summary,
                    key_insights: analysisData.key_insights,
                    next_steps: analysisData.next_steps,
                    pipeline_logs: analysisData.pipeline_logs,
                    updated_at: new Date().toISOString()
                })
                .eq('venture_id', ventureId)
                .select()
                .single();
        } else {
            // Insert new
            result = await supabase
                .from('decision_intelligence_analysis')
                .insert([{
                    venture_id: ventureId,
                    research_summary: analysisData.context_analysis,
                    internet_data: analysisData.research_dossier,
                    comparison_analysis: analysisData.validation_analysis,
                    solutions: analysisData.solution_approaches,
                    recommended_solution_id: analysisData.recommended_approach_id,
                    comparison_charts: analysisData.visual_assets.comparison_chart_data,
                    mermaid_code: analysisData.visual_assets.mermaid_code,
                    executive_summary: analysisData.executive_summary,
                    key_insights: analysisData.key_insights,
                    next_steps: analysisData.next_steps,
                    pipeline_logs: analysisData.pipeline_logs
                }])
                .select()
                .single();
        }

        return { data: result.data, error: result.error };
    } catch (error) {
        console.error('Save DI Analysis Error:', error);
        return { data: null, error };
    }
}

export async function getDecisionIntelligenceAnalysis(
    ventureId: string
): Promise<{ data: any | null; error: any }> {
    const { data, error } = await supabase
        .from('decision_intelligence_analysis')
        .select('*')
        .eq('venture_id', ventureId)
        .maybeSingle();

    return { data, error };
}

export async function saveResearchSources(
    analysisId: string,
    sources: any[]
): Promise<{ data: any[] | null; error: any }> {

    if (!sources || sources.length === 0) {
        return { data: [], error: null };
    }

    try {
        // Delete existing sources for this analysis
        await supabase
            .from('research_sources')
            .delete()
            .eq('analysis_id', analysisId);

        // Insert new sources
        const sourcesData = sources.map(source => ({
            analysis_id: analysisId,
            url: source.url,
            title: source.title,
            publication: source.publication,
            published_date: source.date ? new Date(source.date) : null,
            source_type: source.source_type,
            credibility_score: source.credibility === 'high' ? 9 : source.credibility === 'medium' ? 6 : 3,
            relevance_score: 8, // Default
            key_insights: source.key_insights,
            extracted_data: null
        }));

        const { data, error } = await supabase
            .from('research_sources')
            .insert(sourcesData)
            .select();

        return { data, error };
    } catch (error) {
        console.error('Save Research Sources Error:', error);
        return { data: null, error };
    }
}

export async function getResearchSources(
    analysisId: string
): Promise<{ data: any[] | null; error: any }> {
    const { data, error } = await supabase
        .from('research_sources')
        .select('*')
        .eq('analysis_id', analysisId)
        .order('credibility_score', { ascending: false });

    return { data, error };
}

export async function getDecisionIntelligenceSummary(
    ventureId: string
): Promise<{ data: any | null; error: any }> {
    const { data, error } = await supabase
        .from('decision_intelligence_summary')
        .select('*')
        .eq('venture_id', ventureId)
        .maybeSingle();

    return { data, error };
}

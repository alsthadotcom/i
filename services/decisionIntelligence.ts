/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Decision Intelligence Service
 * ==============================
 * 
 * Main orchestrator for the 4-LLM pipeline that transforms user input
 * into actionable, research-backed decision support.
 * 
 * Pipeline Stages:
 * 1. Constraint Mapper (GPT-4o-mini) - Maps user resources, stage, and goals
 * 2. Solution Researcher (Perplexity) - Finds proven methods, historical case studies, and proofs
 * 3. Decision Auditor (Gemini) - Audits solutions against user constraints and potential biases
 * 4. Strategic Architect (GPT-4o) - Builds 3 actionable roadmaps (Lean, Balanced, Scale)
 */

import { callAI, ChatMessage, getSystemPrompt, toonEncodeForStorage, toonDecodeFromStorage } from './puter';
import { conductResearch, extractSources, findCaseStudies } from './webResearch';
import { generateRoadmapMermaid, generateComparisonChartData } from './visualGenerator';
import {
    DecisionIntelligenceOutput,
    PipelineLog,
    ContextAnalysis,
    ResearchDossier,
    ValidationAnalysis,
    SolutionApproach,
    ResearchQuery,
    ProvenExample,
    ResearchSource
} from '../types/decisionIntelligence';

// ============================================
// MAIN PIPELINE ORCHESTRATOR
// ============================================

// ============================================
// MAIN PIPELINE ORCHESTRATOR
// ============================================

export async function runDecisionPipeline(
    ventureData: any,
    onProgress: (log: PipelineLog) => void
): Promise<DecisionIntelligenceOutput> {

    const logs: PipelineLog[] = [];
    const timestamp = new Date();

    // Helper to log progress
    const log = (stage: 1 | 2 | 3 | 4, stageName: string, model: string, status: any, message: string, output?: string) => {
        const entry: PipelineLog = {
            stage,
            stage_name: stageName,
            model,
            status,
            message,
            output,
            started_at: status === 'processing' ? new Date() : undefined,
            completed_at: status === 'completed' ? new Date() : undefined
        };
        logs.push(entry);
        onProgress(entry);
    };

    try {
        // ==========================================
        // STAGE 1: PROBLEM ANALYZER (GPT-4.1)
        // ==========================================
        log(1, 'Problem Analyzer', 'GPT-4.1', 'processing', 'Analyzing problem and generating research strategy...');

        const contextAnalysis = await runContextAnalyzer(ventureData);
        log(1, 'Problem Analyzer', 'GPT-4.1', 'completed', `Identified context and generated ${Object.keys(contextAnalysis.generated_prompts || {}).length} prompts.`);

        // ==========================================
        // STAGE 2 & 3: RESEARCH & COMPETITOR (PARALLEL)
        // ==========================================
        log(2, 'Research & Competitor', 'Perplexity + Gemini', 'processing', 'Conducting parallel research and competitor analysis...');

        const prompts = contextAnalysis.generated_prompts || { research_prompt: "Research this.", competitor_prompt: "Find competitors." };

        const [researchResult, competitorResult] = await Promise.all([
            runResearchEngine(prompts.research_prompt),
            runCompetitorAnalysis(prompts.competitor_prompt)
        ]);

        const researchDossier = researchResult.dossier;
        const competitorAnalysis = competitorResult.analysis;

        log(2, 'Research Engine', 'Perplexity', 'completed', `Found ${researchDossier.proven_methods.length} proven methods.`, researchResult.toon);
        log(3, 'Competitor Analyst', 'Gemini 2.5 Pro', 'completed', 'Competitor analysis complete.', competitorResult.toon);

        // ==========================================
        // STAGE 4: STRATEGIC ARCHITECT (GPT-5.1)
        // ==========================================
        log(4, 'Strategic Architect', 'GPT-5.1', 'processing', 'Architecting 3 capital/human/tech driven solutions...');

        const { solutions: solutionApproaches, toon: toonRes4 } = await runSolutionArchitect(
            researchDossier,
            competitorAnalysis
        );

        log(4, 'Strategic Architect', 'GPT-5.1', 'completed', `Finalized 3 distinct strategic paths.`, toonRes4);

        // ==========================================
        // GENERATE ARTIFACTS
        // ==========================================
        // Cast competitor analysis to ValidationAnalysis structure for compatibility or use defaults
        const validationAnalysis: ValidationAnalysis = ensureStructure(competitorAnalysis, 'validation');

        const visualAssets = {
            mermaid_code: solutionApproaches[0] ? generateRoadmapMermaid(solutionApproaches[0]) : undefined,
            comparison_chart_data: generateComparisonChartData(solutionApproaches)
        };

        const executiveSummary = generateExecutiveSummary(
            contextAnalysis,
            researchDossier,
            validationAnalysis,
            solutionApproaches
        );

        const keyInsights = extractKeyInsights(researchDossier, validationAnalysis);
        const nextSteps = generateNextSteps(solutionApproaches[0]);

        return {
            pipeline_logs: logs,
            timestamp,
            context_analysis: contextAnalysis,
            research_dossier: researchDossier,
            validation_analysis: validationAnalysis,
            solution_approaches: solutionApproaches,
            recommended_approach_id: solutionApproaches[0]?.id,
            visual_assets: visualAssets,
            executive_summary: executiveSummary,
            key_insights: keyInsights,
            next_steps: nextSteps
        };

    } catch (error: any) {
        log(1, 'Pipeline Error', 'System', 'error', `Pipeline failed: ${error.message}`);
        throw error;
    }
}

async function runContextAnalyzer(ventureData: any): Promise<ContextAnalysis> {
    const prompt = `Act as a Problem Analyzer.
Analyze this venture input: ${JSON.stringify(ventureData)}

You must identify the core problem, industry, target users, and constraints.
You must also GENERATE TWO PROMPTS:
1. "research_prompt": A TOON-formatted prompt for Perplexity Sonar Pro to find proven solutions/case studies.
2. "competitor_prompt": A TOON-formatted prompt for Gemini 2.5 Pro to find specific competitors.

Output JSON:
{
    "user_situation": {
        "stage": "idea|prototype|early_revenue|scaling",
        "resources": ["money", "skills", "time"],
        "constraints": ["budget", "regulation"],
        "goals": ["short-term", "long-term"]
    },
    "key_claims": ["claim 1"],
    "research_queries": [],
    "decision_points": [],
    "generated_prompts": {
        "research_prompt": "Prompt for Perplexity...",
        "competitor_prompt": "Prompt for Gemini..."
    }
}`;

    const messages: ChatMessage[] = [
        { role: 'system', content: getSystemPrompt('INPUT_OPTIMIZER') },
        { role: 'user', content: prompt }
    ];

    const toonInput = toonEncodeForStorage(JSON.stringify(messages));
    const toonResponse = await callAI('INPUT_OPTIMIZER', toonInput);
    const rawResponse = toonDecodeFromStorage(toonResponse);

    return ensureStructure(extractJson(rawResponse), 'context');
}


// ============================================
// STAGE 2: RESEARCH ENGINE (Perplexity)
// ============================================

async function runResearchEngine(
    prompt: string
): Promise<{ dossier: ResearchDossier, toon: string }> {

    const messages: ChatMessage[] = [
        { role: 'system', content: getSystemPrompt('RESEARCH_ENGINE') },
        { role: 'user', content: prompt }
    ];

    const toonInput = toonEncodeForStorage(JSON.stringify(messages));
    const toonResponse = await callAI('RESEARCH_ENGINE', toonInput);
    const rawResponse = toonDecodeFromStorage(toonResponse);

    // We assume the prompt asks for JSON that matches ResearchDossier or close to it
    // The system prompt says "Return results strictly in TOON format". 
    // And GPT-4.1 generates the prompt.
    // We trust GPT-4.1 to ask for the structure we need, or we extract what we can.
    return { dossier: ensureStructure(extractJson(rawResponse), 'research'), toon: toonResponse };
}

// ============================================
// STAGE 3: COMPETITOR ANALYSIS (Gemini)
// ============================================

async function runCompetitorAnalysis(
    prompt: string
): Promise<{ analysis: any, toon: string }> {

    const messages: ChatMessage[] = [
        { role: 'system', content: getSystemPrompt('COMPARATOR') },
        { role: 'user', content: prompt }
    ];

    const toonInput = toonEncodeForStorage(JSON.stringify(messages));
    const toonResponse = await callAI('COMPARATOR', toonInput);
    const rawResponse = toonDecodeFromStorage(toonResponse);

    return { analysis: extractJson(rawResponse), toon: toonResponse };
}

// ============================================
// STAGE 4: SOLUTION ARCHITECT
// ============================================

async function runSolutionArchitect(
    researchDossier: ResearchDossier,
    competitorData: any
): Promise<{ solutions: SolutionApproach[], toon: string }> {

    const prompt = `Act as a Strategic Architect.
Analyze the following research and competitor data to generate the 3 MANDATORY solution approaches (Capital-Driven, Human Expertise-Driven, Technology-Driven).

Research Findings (Perplexity):
${JSON.stringify(researchDossier, null, 2)}

Competitor Intelligence (Gemini):
${JSON.stringify(competitorData, null, 2)}

Output strictly in the requested JSON structure.`;

    const messages: ChatMessage[] = [
        { role: 'system', content: getSystemPrompt('SOLUTION_ARCHITECT') },
        { role: 'user', content: prompt }
    ];

    const toonInput = toonEncodeForStorage(JSON.stringify(messages));
    const toonResponse = await callAI('SOLUTION_ARCHITECT', toonInput);
    const rawResponse = toonDecodeFromStorage(toonResponse);

    let approaches = extractJson(rawResponse);

    // Ensure it's an array
    if (!Array.isArray(approaches)) {
        approaches = approaches.solutions || [approaches];
    }

    // Safety check if approaches is still not an array
    if (!Array.isArray(approaches)) {
        approaches = [];
    }

    return { solutions: ensureStructure({ solutions: approaches }, 'solutions'), toon: toonResponse };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function extractJson(text: string): any {
    try {
        if (!text) return {};

        // Clean up conversational noise that often precedes JSON
        // If "I cannot" or "As an AI" is at the start, try to find the first '{'
        const firstCurly = text.indexOf('{');
        const firstBracket = text.indexOf('[');
        let startIndex = -1;

        if (firstCurly !== -1 && (firstBracket === -1 || firstCurly < firstBracket)) {
            startIndex = firstCurly;
        } else if (firstBracket !== -1) {
            startIndex = firstBracket;
        }

        let processableText = text;
        if (startIndex !== -1) {
            processableText = text.substring(startIndex);
        }

        // 1. Try finding JSON code block first
        const codeBlockMatch = processableText.match(/```json\s*([\s\S]*?)\s*```/i);
        if (codeBlockMatch) {
            try {
                return JSON.parse(codeBlockMatch[1].trim());
            } catch (e) {
                console.warn("Code block JSON parse failed, trying raw extraction");
            }
        }

        // 2. Try finding raw JSON object/array
        const jsonMatch = processableText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0].trim());
            } catch (e) {
                console.warn("Raw JSON match parse failed, trying cleanup");
            }
        }

        // 3. Fallback - try cleaning up
        const clean = processableText.replace(/```json/gi, '').replace(/```/g, '').trim();
        try {
            return JSON.parse(clean);
        } catch (e) {
            // Last ditch effort: Try to find something that looks like an object
            const lastDitch = processableText.substring(processableText.indexOf('{'), processableText.lastIndexOf('}') + 1);
            if (lastDitch.length > 2) return JSON.parse(lastDitch);
            throw e;
        }
    } catch (e: any) {
        console.error("CRITICAL: JSON Extraction failed entirely. Returning empty defaults.", e.message);
        return {};
    }
}

/**
 * Ensures an object has the required structure with safe defaults.
 * Decouples the UI from AI output quality.
 */
function ensureStructure(data: any, type: 'context' | 'research' | 'validation' | 'solutions'): any {
    const defaults: any = {
        context: {
            user_situation: { stage: 'idea', resources: [], constraints: [], goals: [] },
            key_claims: [],
            research_queries: [],
            decision_points: []
        },
        research: {
            market_analysis: { market_size: 'Unknown', growth_rate: 'N/A', trends: [], sources: [] },
            competitor_analysis: { competitors: [], sources: [] },
            proven_methods: [],
            all_sources: []
        },
        validation: {
            credibility_assessment: { overall_score: 50, factors: [] },
            contradictions: [],
            gaps: [],
            recommendations: []
        },
        solutions: [] // solutions is an array
    };

    const base = defaults[type];
    if (!data || typeof data !== 'object') return base;

    // Merge logic for objects
    if (type === 'solutions') {
        const solArray = Array.isArray(data) ? data : (data.solutions || []);
        return solArray.map((s: any) => ({
            id: s.id || Math.random().toString(36).substr(2, 9),
            name: s.name || 'Unnamed Solution',
            category: s.category || 'lean',
            description: s.description || '',
            why_this_approach: s.why_this_approach || '',
            capital_required: { min: s.capital_required?.min || 0, max: s.capital_required?.max || 0 },
            time_to_market: { min_months: s.time_to_market?.min_months || 0, max_months: s.time_to_market?.max_months || 0 },
            risk_level: s.risk_level || 'medium',
            resource_requirements: { team_size: s.resource_requirements?.team_size || '1', skills: s.resource_requirements?.skills || [] },
            phases: (s.phases || []).map((p: any) => ({
                name: p.name || 'Initial Phase',
                duration: p.duration || '1 month',
                estimated_cost: p.estimated_cost || 0,
                deliverables: p.deliverables || [],
                milestones: p.milestones || []
            })),
            proven_examples: s.proven_examples || []
        }));
    }

    // Merge nested structures for others
    return { ...base, ...data };
}

function generateExecutiveSummary(
    context: ContextAnalysis,
    research: ResearchDossier,
    validation: ValidationAnalysis,
    solutions: SolutionApproach[]
): string {
    const minCap = solutions[0]?.capital_required?.min || 0;
    const maxCap = solutions[solutions.length - 1]?.capital_required?.max || 0;

    return `Based on comprehensive research of ${research.all_sources.length} sources, we've analyzed your ${context.user_situation.stage}-stage venture. 
    
    Market Analysis: ${research.market_analysis.market_size} market with ${research.market_analysis.growth_rate} growth. 
    
    Validation: Your venture has a credibility score of ${validation.credibility_assessment.overall_score}/100. ${validation.contradictions.length > 0 ? `Key contradictions identified that need addressing.` : `Claims are well-supported by research.`}
    
    We've designed ${solutions.length} distinct approaches tailored to your resources and goals, ranging from lean bootstrap ($${minCap.toLocaleString()}) to full-scale execution ($${maxCap.toLocaleString()}).`;
}

function extractKeyInsights(research: ResearchDossier, validation: ValidationAnalysis): string[] {
    const insights: string[] = [];

    // Market insights
    insights.push(...research.market_analysis.trends.slice(0, 2));

    // Proven methods
    research.proven_methods.forEach(method => {
        insights.push(`${method.method_name}: ${method.description.substring(0, 100)}...`);
    });

    // Validation recommendations
    insights.push(...validation.recommendations.slice(0, 2));

    return insights.slice(0, 5); // Top 5
}

function generateNextSteps(recommendedApproach: SolutionApproach): string[] {
    if (!recommendedApproach || !recommendedApproach.phases || recommendedApproach.phases.length === 0) {
        return ['Review solution approaches', 'Select preferred strategy', 'Begin execution planning'];
    }

    const firstPhase = recommendedApproach.phases[0];

    return [
        `Start with ${firstPhase.name}: ${firstPhase.deliverables[0]}`,
        `Allocate budget: $${firstPhase.estimated_cost.toLocaleString()}`,
        `Key milestone: ${firstPhase.milestones[0]}`,
        'Review proven examples and adapt to your context',
        'Track metrics and adjust based on early results'
    ];
}

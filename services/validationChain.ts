
import { callAI, getSystemPrompt, TargetedModel, toonEncodeForStorage, toonDecodeFromStorage } from './puter';

export interface ValidationLog {
    step: number;
    model: TargetedModel;
    status: 'pending' | 'processing' | 'completed' | 'error';
    message: string;
    output?: string;
}

export interface ValidationResult {
    logs: ValidationLog[];
    finalAnalysis?: any;
}

// Type definitions for the input data
interface IdeaInput {
    stage: string;
    industry: string;
    business_type: string;
    problem_details: any;
    // ... other fields
}

/**
 * The 4-Stage "Diamond" Pipeline Orchestrator
 */
export async function runFullPipeline(
    input: IdeaInput,
    onProgress: (log: ValidationLog) => void
): Promise<ValidationResult> {

    const logs: ValidationLog[] = [];

    // Helper to emit logs
    const log = (step: number, model: TargetedModel, status: ValidationLog['status'], message: string, output?: string) => {
        const entry: ValidationLog = { step, model, status, message, output };
        logs.push(entry);
        onProgress(entry);
        return entry;
    };

    const inputString = JSON.stringify(input, null, 2);

    try {
        // ==========================================
        // STAGE 1: GPT 4.1 (Optimization)
        // ==========================================
        log(1, 'INPUT_OPTIMIZER', 'processing', 'Reading input and optimizing prompt...');

        const prompt1 = `
        Analyze this business idea data:
        ${inputString}

        Output a JSON object with:
        1. "summary": A clean summary of the business.
        2. "claims": A list of 5 key claims that need verification.
        3. "search_queries": A list of 5 optimized search queries to find real business data about this industry.
        `;

        const messages1 = [
            { role: 'system', content: getSystemPrompt('INPUT_OPTIMIZER') },
            { role: 'user', content: prompt1 }
        ];
        const toonInput1 = toonEncodeForStorage(JSON.stringify(messages1));
        const toonResponse1 = await callAI('INPUT_OPTIMIZER', toonInput1);
        const response1 = toonDecodeFromStorage(toonResponse1);

        log(1, 'INPUT_OPTIMIZER', 'completed', 'Input optimized.', response1);

        // ==========================================
        // STAGE 2: Perplexity Sonar Pro (Research)
        // ==========================================
        log(2, 'RESEARCH_ENGINE', 'processing', 'Fetching "Internet-Based Data" and market trends...');

        let searchStrategy;
        try {
            searchStrategy = JSON.parse(response1.replace(/```json/g, '').replace(/```/g, ''));
        } catch (e) {
            searchStrategy = { summary: response1, search_queries: ["General market analysis for " + input.industry] };
        }

        const prompt2 = `
        Perform deep research based on this optimized strategy:
        ${JSON.stringify(searchStrategy)}

        You are "Research Engine". 
        Provide a "Research Dossier" that includes:
        - Real market size and growth trends.
        - Detailed competitor analysis (name specific companies).
        - "Proven Methods" that have worked in this space.
        - CITE sources/facts (simulate searching the web).
        `;

        const messages2 = [
            { role: 'system', content: getSystemPrompt('RESEARCH_ENGINE') },
            { role: 'user', content: prompt2 }
        ];
        const toonInput2 = toonEncodeForStorage(JSON.stringify(messages2));
        const toonResponse2 = await callAI('RESEARCH_ENGINE', toonInput2);
        const response2 = toonDecodeFromStorage(toonResponse2);

        log(2, 'RESEARCH_ENGINE', 'completed', 'Research gathered.', response2);

        // ==========================================
        // STAGE 3: Gemini 2.5 Pro (Comparison)
        // ==========================================
        log(3, 'COMPARATOR', 'processing', 'Cross-referencing with internet data...');

        const prompt3 = `
        Compare the User's Idea with the Research Report.
        
        User Idea: ${inputString}
        
        Research Report:
        ${response2}

        Task:
        - Identify any contradictions.
        - Confirm if the "Proven Methods" apply here.
        - Add any missing "Internet Data" that might have been missed.
        `;

        const messages3 = [
            { role: 'system', content: getSystemPrompt('COMPARATOR') },
            { role: 'user', content: prompt3 }
        ];
        const toonInput3 = toonEncodeForStorage(JSON.stringify(messages3));
        const toonResponse3 = await callAI('COMPARATOR', toonInput3);
        const response3 = toonDecodeFromStorage(toonResponse3);

        log(3, 'COMPARATOR', 'completed', 'Analysis verified.', response3);

        // ==========================================
        // STAGE 4: GPT 5.1 (The Judge)
        // ==========================================
        log(4, 'SOLUTION_ARCHITECT', 'processing', 'Finalizing scores and building Practical Roadmap...');

        const prompt4 = `
        You are the Solution Architect.
        
        Synthesize EVERYTHING:
        1. User Idea: ${inputString}
        2. Research: ${response2}
        3. Analysis: ${response3}

        OUTPUT A VALID JSON OBJECT (no markdown blocks, just raw JSON) with this exact structure:
        {
            "overall_score": (number 0-100),
            "executive_summary": "string",
            "metrics": {
                "uniqueness": (number 0-100),
                "customer_pain": (number 0-100),
                "scalability": (number 0-100),
                "product_market_fit": (number 0-100),
                "technical_complexity": (number 0-100),
                "capital_intensity": (number 0-100),
                "market_saturation": (number 0-100),
                "business_model_robustness": (number 0-100),
                "market_growth_rate": (number 0-100),
                "social_value": (number 0-100)
            },
            "pros": ["string", "string"],
            "cons": ["string", "string"],
            "practical_roadmap": [
                { "step": "Phase 1", "action": "string", "details": "string" },
                { "step": "Phase 2", "action": "string", "details": "string" },
                { "step": "Phase 3", "action": "string", "details": "string" }
            ]
        }
        `;

        const messages4 = [
            { role: 'system', content: getSystemPrompt('SOLUTION_ARCHITECT') },
            { role: 'user', content: prompt4 }
        ];
        const toonInput4 = toonEncodeForStorage(JSON.stringify(messages4));
        const toonResponse4 = await callAI('SOLUTION_ARCHITECT', toonInput4);
        const response4 = toonDecodeFromStorage(toonResponse4);

        let finalJson;
        const clean = response4.replace(/```json/g, '').replace(/```/g, '').trim();
        try {
            const parsed = JSON.parse(clean);
            const summary = typeof parsed.executive_summary === 'string' ? parsed.executive_summary : clean;
            const roadmap = Array.isArray(parsed.practical_roadmap) ? parsed.practical_roadmap : [];
            finalJson = {
                executive_summary: toonEncodeForStorage(summary),
                practical_roadmap: roadmap.map((s: any) => ({
                    step: s.step,
                    action: toonEncodeForStorage(s.action || ''),
                    details: toonEncodeForStorage(s.details || '')
                })),
                raw: clean
            };
        } catch (e) {
            finalJson = {
                executive_summary: toonEncodeForStorage(clean),
                practical_roadmap: [
                    { step: 'Phase 1', action: toonEncodeForStorage('Customer discovery'), details: toonEncodeForStorage('Interviews and landing page tests') },
                    { step: 'Phase 2', action: toonEncodeForStorage('MVP build'), details: toonEncodeForStorage('Minimal implementation with instrumentation') },
                    { step: 'Phase 3', action: toonEncodeForStorage('Market testing'), details: toonEncodeForStorage('Targeted channels and pricing experiments') }
                ],
                raw: clean
            };
            log(4, 'SOLUTION_ARCHITECT', 'error', 'JSON Parsing Failed');
        }

        log(4, 'SOLUTION_ARCHITECT', 'completed', 'Validation Complete.', response4);

        return {
            logs,
            finalAnalysis: finalJson
        };

    } catch (error: any) {
        log(0, 'INPUT_OPTIMIZER', 'error', 'Pipeline Failed: ' + error.message);
        throw error;
    }
}

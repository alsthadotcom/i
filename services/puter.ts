/**
 * Puter.js Service Wrapper (FREE, no external APIs)
 * --------------------------------------------------
 * Key design goals:
 * 1. Use ONLY Puter.js free models (no vendor APIs)
 * 2. Be honest about model capabilities (no fake Gemini/GPT-5 claims)
 * 3. Support toon-toon for TOKEN + STORAGE efficiency
 * 4. NEVER send encoded text into the LLM
 * 5. Stateless-safe: caller passes compact state every time
 */

import { ensurePuterLoaded } from './puterLoader';

/*
 ─────────────────────────────────────────────────────────
  MODEL LAYER (HONEST)
 ─────────────────────────────────────────────────────────
  These are *product labels*, NOT real vendor models.
  They map to what Puter FREE actually exposes.
*/

export type TargetedModel =
    | 'INPUT_OPTIMIZER'
    | 'RESEARCH_ENGINE'
    | 'COMPARATOR'
    | 'SOLUTION_ARCHITECT';

const MODEL_MAPPING: Record<TargetedModel, string> = {
    INPUT_OPTIMIZER: 'openai/gpt-4.1',         // GPT 4.1
    RESEARCH_ENGINE: 'perplexity/sonar-pro',   // Perplexity Sonar Pro
    COMPARATOR: 'google/gemini-2.5-pro',       // Gemini 2.5 Pro
    SOLUTION_ARCHITECT: 'openai/gpt-5.1'       // GPT 5.1
};

/*
 ─────────────────────────────────────────────────────────
  MESSAGE TYPE
 ─────────────────────────────────────────────────────────
*/

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

/*
 ─────────────────────────────────────────────────────────
  MAIN CALL (PUTER FREE)
 ─────────────────────────────────────────────────────────
*/

/**
 * MAIN CALL (PUTER TRANSIT)
 * -------------------------
 * Input: Toon-encoded JSON string of messages
 * Output: Toon-encoded raw model response
 */
export async function callAI(
    model: TargetedModel,
    toonPayload: string
): Promise<string> {
    let puter = (window as any).puter;

    if (!puter) {
        await ensurePuterLoaded();
        puter = (window as any).puter;
    }

    if (!puter) throw new Error('Puter.js not available');

    // 1. DECODE THE TRANSIT PAYLOAD
    const rawJson = toonDecodeFromStorage(toonPayload);
    const messages = JSON.parse(rawJson);

    // 2. PREPARE THE RAW CALL
    const realModel = MODEL_MAPPING[model];

    // @ts-ignore
    const response = await puter.ai.chat(messages, {
        model: realModel
    });

    const rawOutput = response?.message?.content ?? '';

    // 3. ENCODE THE RESPONSE BACK TO TOON
    return toonEncodeForStorage(rawOutput);
}

/*
 ─────────────────────────────────────────────────────────
  SYSTEM PROMPTS (SOLUTION-ONLY)
 ─────────────────────────────────────────────────────────
*/

export function getSystemPrompt(model: TargetedModel): string {
    switch (model) {
        case 'INPUT_OPTIMIZER': // GPT-4.1
            return `Role: Problem Analyzer & Prompt Generator

System Prompt:
Read and analyze all user inputs submitted via the TOON form.

Clearly identify:
- Core problem
- Industry
- Target users
- Constraints (budget, time, resources)

Decide whether external internet data is required.

If research is needed:
- Generate a focused research prompt in TOON format for Perplexity Sonar Pro.
- Generate a competitor discovery prompt in TOON format for Gemini 2.5 Pro.

Ensure:
- Prompts are precise, non-overlapping, and goal-oriented.
- All outputs remain structured and concise.

Do not solve the problem.
Act only as the thinking and routing layer.
Output must be in JSON.`;

        case 'RESEARCH_ENGINE': // Perplexity Sonar Pro
            return `Role: Real-World Research Agent

System Prompt:
Receive a TOON-formatted research prompt from the Analyzer.

Search the internet for:
- Industry trends
- Market data
- Proven strategies
- Real implementations

Focus on:
- What works today
- Practical and validated approaches

Provide:
- Factual findings
- Data-backed insights
- References to real-world usage

Return results strictly in TOON format (JSON).
Do not provide opinions unless backed by evidence.`;

        case 'COMPARATOR': // Gemini 2.5 Pro
            return `Role: Competitor Intelligence Analyst

System Prompt:
Receive a TOON-formatted competitor query.

Identify:
- Companies facing the same or similar problem
- Startups and enterprises in the same domain

For each competitor, return:
- Company name
- Industry
- Problem they faced
- High-level solution they implemented

Do not analyze deeply.
Do not propose solutions.
Output must remain in TOON format (JSON).`;

        case 'SOLUTION_ARCHITECT': // GPT-5.1
            return `Role: Strategic Problem Solver & Decision Assistant (Most Important)

System Prompt:

1. Analyze Inputs
Read and understand all data received from:
- Perplexity Sonar Pro (internet research)
- Gemini 2.5 Pro (competitor data)

2. Problem Solving
Provide a practical roadmap to solve the user’s problem.
Base the solution on current market conditions.

3. Three Mandatory Solution Approaches
For each solution, explain it using:
- Capital-Driven Approach (If the user has sufficient money)
- Human Expertise-Driven Approach (If skilled people are available but funds are limited)
- Technology-Driven Approach (If tools/automation can replace cost or manpower)

4. Proof of Work (Very Important)
Show how competitors solved the same problem.
Include:
- Short case studies
- What strategy they used
- Why it worked
Explicitly connect competitor actions to the proposed solution.

5. Validation
Clearly explain why this solution is worth trying.
Support claims using:
- Market data
- Competitor success
- Logical reasoning

Output Rules:
- Use bullet points only
- Keep language clear and decision-oriented
- Avoid fluff
- Stay in TOON format (JSON)`;
    }
}

/*
 ─────────────────────────────────────────────────────────
  TOON-TOON (STORAGE ONLY)
 ─────────────────────────────────────────────────────────
  ❌ Never send encoded text into LLM
  ✅ Encode only for DB / URL
*/

export function toonEncodeForStorage(input: string): string {
    const b = typeof window !== 'undefined' && typeof window.btoa === 'function'
        ? window.btoa(unescape(encodeURIComponent(input)))
        : Buffer.from(input, 'utf-8').toString('base64');
    const swapped = b.replace(/=/g, '_').replace(/\+/g, '-').replace(/\//g, '.');
    return swapped.split('').reverse().join('');
}

export function toonDecodeFromStorage(encoded: string): string {
    const rev = encoded.split('').reverse().join('');
    const restored = rev.replace(/_/g, '=').replace(/-/g, '+').replace(/\./g, '/');
    const s = typeof window !== 'undefined' && typeof window.atob === 'function'
        ? decodeURIComponent(escape(window.atob(restored)))
        : Buffer.from(restored, 'base64').toString('utf-8');
    return s;
}

/*
 ─────────────────────────────────────────────────────────
  HELPER: TOKEN-EFFICIENT MESSAGE BUILDER
 ─────────────────────────────────────────────────────────
*/

export function buildMessages(
    systemPrompt: string,
    payload: object
): ChatMessage[] {
    return [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(payload) }
    ];
}

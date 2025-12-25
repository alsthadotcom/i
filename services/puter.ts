// puter.ts — Orchestrated Multi-Model AI Pipeline (TOON-first)
// --------------------------------------------------------------
// PURPOSE:
// One service that coordinates four LLM roles:
//   1) GPT-4.1  → INPUT_OPTIMIZER (clean + structure)
//   2) Gemini 2.5 Pro → COMPARATOR (competitors, mapping)
//   3) Perplexity Sonar Pro → RESEARCH_ENGINE (real-world validation)
//   4) GPT-5.1 → SOLUTION_ARCHITECT (final decision layer)
//
// RULES:
// - All LLM chat I/O MUST be TOON JSON (compact JSON)
// - toonEncode / toonDecode ONLY for storage & URL transport
// - GPT-5.1 may RECALL any model if something is missing

import { ensurePuterLoaded } from "./puterLoader";

// ───────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────

export type TargetedModel =
  | "INPUT_OPTIMIZER"
  | "COMPARATOR"
  | "RESEARCH_ENGINE"
  | "SOLUTION_ARCHITECT";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// ───────────────────────────────────────────────
// STORAGE SAFE ENCODE / DECODE
// ───────────────────────────────────────────────

export function toonEncodeForStorage(input: string): string {
  const b =
    typeof window !== "undefined" && typeof window.btoa === "function"
      ? window.btoa(unescape(encodeURIComponent(input)))
      : Buffer.from(input, "utf-8").toString("base64");

  const swapped = b.replace(/=/g, "_").replace(/\+/g, "-").replace(/\//g, ".");
  return swapped.split("").reverse().join("");
}

export function toonDecodeFromStorage(encoded: string): string {
  const rev = encoded.split("").reverse().join("");
  const restored = rev.replace(/_/g, "=").replace(/-/g, "+").replace(/\./g, "/");

  const s =
    typeof window !== "undefined" && typeof window.atob === "function"
      ? decodeURIComponent(escape(window.atob(restored)))
      : Buffer.from(restored, "base64").toString("utf-8");

  return s;
}

// ───────────────────────────────────────────────
// MODEL MAP (PRODUCT LABELS, not vendors)
// ───────────────────────────────────────────────

const MODEL_MAPPING: Record<TargetedModel, string> = {
  INPUT_OPTIMIZER: "openai/gpt-4.1",
  COMPARATOR: "perplexity/sonar-pro",
  RESEARCH_ENGINE: "perplexity/sonar-pro",
  SOLUTION_ARCHITECT: "openai/gpt-5.1",
};

// ───────────────────────────────────────────────
// BASE CALL WRAPPER
// ───────────────────────────────────────────────

async function callModel(model: TargetedModel, systemPrompt: string, payload: object) {
  let puter: any = (window as any).puter;

  if (!puter) {
    await ensurePuterLoaded();
    puter = (window as any).puter;
  }

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt.trim() },
    { role: "user", content: JSON.stringify(payload, null, 0) }
  ];

  const realModel = MODEL_MAPPING[model];
  const response = await puter.ai.chat(messages, { model: realModel });

  const rawContent = response?.message?.content;

  // 1. If it's already an object, return it (assuming it's the parsed JSON)
  if (typeof rawContent === 'object' && rawContent !== null) {
    return rawContent;
  }

  // 2. Ensure it's a string for cleanup
  let raw = String(rawContent ?? "");

  // CLEANUP: Extract JSON substring if wrapped in text
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    raw = raw.substring(firstBrace, lastBrace + 1);
  }

  // Remove markdown code fences just in case
  const clean = raw.replace(/```json/g, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(clean);
  } catch (e) {
    console.warn(`${model} returned non-JSON:`, raw);
    // Fallback to prevent crash
    return {
      error: "JSON Parsing Failed",
      raw_response: raw,
      fallback_note: "Model returned invalid JSON. Using fallback."
    };
  }
}

// ───────────────────────────────────────────────
// SYSTEM PROMPTS
// ───────────────────────────────────────────────

const PROMPTS = {
  INPUT_OPTIMIZER: `Role: Problem Analyzer
Output ONLY JSON.
Analyze the user's idea and structure it. If "core_idea" is provided, prioritize it.
CRITICAL: When generating "search_queries", do NOT just focus on "MVP" or "How to build". You MUST broaden the scope to include:
1. "Market Size & Trends in [Industry]"
2. "Competitor Landscape for [Core Idea]"
3. "Recent funding in [Industry] startups"
4. "Regulatory challenges in [Industry]"
Output:
{
  "core_problem":"",
  "industry":"",
  "target_users":"",
  "constraints":{ "budget":"", "time":"", "resources":"" },
  "needs_research":true,
  "search_queries": []
}`,

  COMPARATOR: `Role: Competitor Analyst
Return ONLY JSON.
Find exactly 5 real-world competitors.
If you cannot find 5 specific names, you may use "Other Niche Players" as the 5th competitor, but the total MUST be 5.
For EACH competitor, provide a detailed case study with real metrics.
Output:
{
  "competitors": [
    { 
      "name": "Name 1", 
      "reason": "One line explanation of why they are a direct competitor",
      "market_share": 35,
      "case_study": {
        "founded": "2015",
        "funding": "$500M",
        "revenue": "$200M ARR",
        "users": "5M+ active users",
        "key_metric": "150% YoY growth"
      }
    },
    { 
      "name": "Name 2", 
      "reason": "One line explanation...",
      "market_share": 25,
      "case_study": {
        "founded": "2018",
        "funding": "$350M",
        "revenue": "$120M ARR",
        "users": "3M+ users",
        "key_metric": "200% growth in 2 years"
      }
    }
  ],
  "case_studies": [
    { "company": "Name", "problem_solved": "", "positive_outcome": "" }
  ]
}`,

  RESEARCH_ENGINE: `Role: Research Verification\nUse REAL internet sources.\nOutput:\n{\n  "sources": ["https://...", "https://..."],\n  "verified_solutions": ["Sol 1", "Sol 2", "Sol 3", "Sol 4", "Sol 5"]\n}`,

  SOLUTION_ARCHITECT: `Role: Strategic Advisor
Combine all data into the FINAL requested format.
NO MARKDOWN. ONLY JSON.

REQUIRED OUTPUT STRUCTURE:
{
  "competitors": [
    { 
      "name": "Name", 
      "reason": "Why...", 
      "market_share": 25,
      "case_study": {
        "founded": "2015",
        "funding": "$500M",
        "revenue": "$200M ARR",
        "users": "5M+ active users",
        "key_metric": "150% YoY growth"
      }
    }
  ],
  "problem_solutions": [
    {
      "problem": "Name of the problem",
      "solutions": ["Topic: Detail..."],
      "video_search_term": "Search query for a YouTube video related to solving this problem"
    }
  ],
  "case_studies": [{ "company": "", "outcome": "positive result" }],
  "sources": ["list of links"],
  "roadmap": "A full detailed roadmap"
}

CRITICAL INSTRUCTIONS:
1. For EACH problem selected, generate 3 distinct solutions.
2. Format solutions as "Topic: Detail". CRITICAL: The 'Detail' must contain at least 3 distinct sentences (points), each ending with a period, to explain the execution clearly.
3. Provide a 'video_search_term' for finding a relevant YouTube video about this problem (e.g., "How to solve cash flow for startups").
4. Use 'sources' and 'competitors' from inputs.
5. For "case_studies", use REAL NAMES found in research.
6. The 'competitors' array MUST contain objects with 'name', 'reason', 'market_share' (integer percentage), and the full 'case_study' object providing metrics. Ensure market shares sum roughly to 100% or logical market distribution.`
};

// ───────────────────────────────────────────────
// PIPELINE ORCHESTRATOR
// ───────────────────────────────────────────────

export async function analyzeIdea(
  idea: any,
  userProblems: string[],
  onProgress?: (stage: string) => void
) {
  if (onProgress) onProgress("Initializing AI Agents...");

  // 1. Optimize Input (Gemini)
  if (onProgress) onProgress("Optimizing Input Context...");
  const optimizedInput: any = await callModel('INPUT_OPTIMIZER', PROMPTS.INPUT_OPTIMIZER, {
    original_idea: idea,
    required_problems: userProblems
  });

  if (optimizedInput.error) {
    // Fallback: use original idea if optimization fails
    console.error("Optimization failed, using raw input");
  }

  // 2. Identify Competitors & Case Studies (Perplexity)
  if (onProgress) onProgress("Searching for Competitors & Case Studies...");
  const marketData: any = await callModel('COMPARATOR', PROMPTS.COMPARATOR, {
    search_context: optimizedInput.search_queries || [idea.business_type + " competitors"],
    industry: optimizedInput.industry || "General",
    core_idea: optimizedInput.core_idea || idea.problem_details
  });

  // 3. Verify Links & Solutions (Perplexity)
  if (onProgress) onProgress("Verifying Market Research & Trends...");
  const researchData: any = await callModel('RESEARCH_ENGINE', PROMPTS.RESEARCH_ENGINE, {
    ...marketData,
    constraints: optimizedInput.constraints
  });

  // 4. Final Strategy Generation (GPT-5.1)
  if (onProgress) onProgress("Drafting Strategic Execution Roadmap...");
  let finalStrategy: any = await callModel('SOLUTION_ARCHITECT', PROMPTS.SOLUTION_ARCHITECT, {
    context: optimizedInput,
    market_data: marketData,
    research: researchData,
    required_problems: userProblems
  });

  return finalStrategy;
}

// Ready for UI modules like SellIdea / Validation Chain
export default {
  analyzeIdea,
};

/**
 * analyzeBusinessModel.ts
 *
 * Node.js pipeline: Document text/image -> structured summary -> strict teacher-style scoring.
 * - Uses OpenRouter API with simple fetch calls (no OpenAI SDK).
 * - Validates output via strict prompts.
 */

// CONSTANTS (using OpenRouter as requested)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY; // Must be in .env.local
const SITE_URL = "http://localhost:3000"; // Or your actual site URL
const SITE_NAME = "ida-marketplace";
const MODEL_NAME = "google/gemini-2.0-flash-exp:free"; // Or whatever model key you prefer

if (!OPENROUTER_API_KEY) {
    console.warn("Warning: OPENROUTER_API_KEY is not set in environment variables.");
}

// --- System prompts (strict, teacher-like) ---
const EXTRACTION_PROMPT = `
You are an expert business analyst and document parser. Input: content from a business-model PDF or text document.
Task A: extract and return ONLY the following JSON (no extra text, no markdown blocks):
{
  "businessSummary": "",
  "problem": "",
  "solution": "",
  "market": "",
  "competition": "",
  "revenueModel": "",
  "operations": "",
  "financials": "",
  "risks": ""
}
Requirements:
- Each field must be a short, precise paragraph (1-4 sentences).
- If a field is not present in the text, return an empty string for that field.
- Do not include commentary or opinions here — just structured extracted content.
`;

const SCORING_PROMPT = `
You are a strict, expert evaluator (like a senior teacher grading a paper). You will receive the structured business data (JSON) from the extraction step.
You MUST produce a single JSON object and ONLY that JSON. No surrounding text, no markdown blocks.

Schema required (scores and explanation object):
{
  "scores": {
    "uniqueness": <integer 0-100>,
    "demand": "<Low|Low-Mid|Mid|Mid-High|High>",
    "problemImpact": <integer 0-100>,
    "profitability": {
      "estimatedRevenue": <number>,
      "estimatedProfit": <number>,
      "marginPercentage": <number 0-100>
    },
    "viability": <integer 0-100>,
    "scalability": <integer 0-100>
  },
  "evidence": {
    "uniqueness": "<1-3 sentence evidence supporting the exact numeric score and which rubric items were used>",
    "demand": "<1-3 sentence evidence supporting the labeled demand level>",
    "problemImpact": "<1-3 sentence evidence>",
    "profitability": "<1-3 sentence evidence including assumptions used for estimates>",
    "viability": "<1-3 sentence evidence>",
    "scalability": "<1-3 sentence evidence>"
  },
  "rubric": {
    "uniqueness": "Score 90-100 = truly novel or IP; 70-89 = strong differentiation; 40-69 = some differentiation; 0-39 = common or commoditized",
    "demand": "Low / Low-Mid / Mid / Mid-High / High - choose one based on prevalence, willingness-to-pay evidence, and growth trend",
    "problemImpact": "Score 90-100 = severe wide impact; 50-89 = moderate; 0-49 = low impact",
    "profitability": "Provide numeric revenue/profit estimates and margin% with a brief 1-line assumption (e.g., pricing, market share, TAM%)",
    "viability": "Score 90-100 = buildable with current resources and low regulatory/tech risk; lower scores for higher barriers",
    "scalability": "Score 90-100 = global, automated, multi-channel; lower scores for manual, local, or high marginal costs"
  }
}

Scoring rules (strict):
1) For each numeric score, round to nearest integer.
2) For profitability, give conservative estimates and include the numeric assumptions used in the evidence field.
3) If any value cannot be determined, provide a conservative default and explicitly state the missing assumptions in evidence.
4) Output MUST be valid JSON.

Use the structured data to justify each score succinctly. Prioritize facts in the structured fields (market size, revenue model, financials, competition). Act like a demanding grader: be precise, cite the reason, and do not be vague.
`;

// --- Helper: parse LLM JSON safely ---
function safeJsonParse(text: string) {
    try {
        return JSON.parse(text);
    } catch (e) {
        // Some LLMs wrap JSON in code fences; strip common wrappers
        const stripped = text.replace(/^[\s\n]*```json\s*/i, "").replace(/```[\s\n]*$/i, "").trim();
        // Sometimes stripping backticks leaves just text, ensure we have brackets
        if (stripped.startsWith('{') && stripped.endsWith('}')) {
            return JSON.parse(stripped);
        }
        throw e;
    }
}

/**
 * Helper function to call OpenRouter API
 */
async function callOpenRouter(systemPrompt: string, userContent: any[], responseFormat?: any) {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "HTTP-Referer": SITE_URL,
            "X-Title": SITE_NAME,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: MODEL_NAME,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userContent }
            ],
            response_format: responseFormat, // Optional, depending on provider support
            temperature: 0.1 // Low temp for more deterministic results
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    if (!content) throw new Error("No content returned from AI");

    return content;
}


// --- STEP 1: extraction call ---
async function extractStructuredData(fileBase64: string, mimeType: string) {
    const userContent = [
        { type: "text", text: "Extract business data from this document:" },
        { type: "image_url", image_url: { url: `data:${mimeType};base64,${fileBase64}` } }
    ];

    const rawResponse = await callOpenRouter(EXTRACTION_PROMPT, userContent, { type: "json_object" });
    return safeJsonParse(rawResponse);
}

// --- STEP 2: scoring call (strict) ---
async function scoreStructuredData(structuredJson: any) {
    const userContent = [
        { type: "text", text: JSON.stringify(structuredJson) }
    ];

    const rawResponse = await callOpenRouter(SCORING_PROMPT, userContent, { type: "json_object" });
    const parsed = safeJsonParse(rawResponse);

    // Basic structure check
    if (!parsed || typeof parsed !== "object" || !parsed.scores) {
        throw new Error("Scoring model did not return the required JSON structure with 'scores'.");
    }

    return parsed;
}

// --- Public: analyzePDF ---
export async function analyzeBusinessPipeline(fileBase64: string, mimeType: string) {
    try {
        // Step A: extract
        const structured = await extractStructuredData(fileBase64, mimeType);

        // Step B: score using strict rubric
        const scoringOutput = await scoreStructuredData(structured);

        // Combined result
        return {
            structured,
            scoring: scoringOutput
        };
    } catch (error) {
        console.error("Pipeline Error:", error);
        // You might want to return a fallback or rethrow depending on UI requirements
        throw error;
    }
}

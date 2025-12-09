/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// CONSTANTS
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const SITE_URL = window.location.origin;
const SITE_NAME = "ida-marketplace";
const MODEL_NAME = "google/gemini-2.0-flash-exp:free";

const SYSTEM_INSTRUCTION = `You are an expert Venture Capitalist, Business Analyst, and Product Strategist. 
Your goal is to analyze a user's upload (a napkin sketch, a diagram, notes, or a photo) and generate a **high-value Business Listing Prospectus** for a marketplace called "ida-marketplace".

CORE DIRECTIVES:
1. **Analyze the Input**:
    - Identify the core business concept.
    - If it's vague, extrapolate a viable business model (SaaS, Franchise, Consumer Good, Service).
    - Estimate potential target market and revenue streams.

2. **Generate a "Listing" (HTML/CSS)**:
    - Create a single-page, vertically scrolling "Investment Memo" or "Marketplace Listing".
    - **Visual Style**: Clean, high-end financial aesthetic (Stripe Press style). Serif headings, Sans-serif body. Dark mode or clean light mode.
    - **Key Sections**:
        - **Hero**: Catchy Name, One-liner Value Prop, and a bold "Asking Price" (e.g., $50,000 or $2.5M).
        - **The Opportunity**: Why this idea matters now.
        - **Market Analysis**: TAM/SAM/SOM charts (use CSS bars/pie charts).
        - **Monetization**: How it makes money.
        - **SWOT Analysis**: Strengths, Weaknesses, Opportunities, Threats.
        - **Action**: A "Buy IP & Assets" button.

3. **Charts & Visuals**:
    - Use CSS to create bar charts for projected revenue.
    - Use Emojis as icons for features.
    - **NO EXTERNAL IMAGES**. Use CSS gradients or patterns for backgrounds.

4. **Tone**: Professional, persuasive, slightly hype-driven (like a startup pitch).

RESPONSE FORMAT:
Return ONLY the raw HTML code. Start immediately with <!DOCTYPE html>.`;

const EXTRACTION_PROMPT = `You are an expert in business analysis. Extract clean, structured information from the provided PDF text/image. Remove formatting noise. 

Return ONLY the following JSON:

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
}`;

const SCORING_PROMPT = `You are an expert evaluator. Using the provided structured business data, rate the idea.

HIGH SCORE = GOOD. LOW SCORE = BAD.

Return ONLY this JSON:

{
  "uniqueness": 0,
  "demand": "Low",
  "problemImpact": 0,
  "profitability": {
    "estimatedRevenue": 0,
    "estimatedProfit": 0,
    "marginPercentage": 0
  },
  "viability": 0,
  "scalability": 0
}`;

/**
 * Calls OpenRouter to generate the business listing HTML.
 */
export async function bringToLife(prompt: string, fileBase64?: string, mimeType?: string): Promise<string> {
  const finalPrompt = fileBase64
    ? "Analyze this raw idea. Create a professional Business Listing Prospectus with valuation, market analysis, and revenue projections. Make it look like a high-end financial document."
    : prompt || "Generate a sample business listing for a futuristic sustainable energy startup.";

  const content: any[] = [
    {
      type: "text",
      text: finalPrompt
    }
  ];

  if (fileBase64 && mimeType) {
    content.push({
      type: "image_url",
      image_url: {
        url: `data:${mimeType};base64,${fileBase64}`
      }
    });
  }

  const messages = [
    {
      role: "system",
      content: SYSTEM_INSTRUCTION
    },
    {
      role: "user",
      content: content
    }
  ];

  try {
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
        messages: messages
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenRouter API Error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    let text = data.choices[0]?.message?.content || "<!-- Failed to generate content -->";

    // Cleanup markdown fences
    text = text.replace(/^```html\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');

    return text;
  } catch (error) {
    console.error("OpenRouter Generation Error:", error);
    throw error;
  }
}

interface ProfitabilityMetrics {
  estimatedRevenue: number;
  estimatedProfit: number;
  marginPercentage: number;
}

/**
 * Calls OpenRouter to score the asset with the new 6-metric system.
 */
export async function analyzeAssetScores(
  fileBase64: string,
  mimeType: string
): Promise<{
  uniqueness: number;
  demand: 'Low' | 'Low-Mid' | 'Mid' | 'Mid-High' | 'High';
  problem_impact: number;
  profitability: ProfitabilityMetrics;
  viability: number;
  scalability: number;
}> {
  try {
    // STEP 1: EXTRACT
    const extractionResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
          { role: "system", content: EXTRACTION_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract business data from this document:" },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${fileBase64}` } }
            ]
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!extractionResponse.ok) {
      throw new Error("Extraction API failed");
    }

    const extractedData = await extractionResponse.json();
    const structuredBusinessData = JSON.parse(extractedData.choices[0].message.content);

    // STEP 2: SCORE
    const scoringResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
          { role: "system", content: SCORING_PROMPT },
          { role: "user", content: JSON.stringify(structuredBusinessData) }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!scoringResponse.ok) {
      console.warn("OpenRouter Score API Failed, using mock data");
      // Fallback for demo if API fails
      return {
        uniqueness: 75,
        demand: 'Mid-High',
        problem_impact: 80,
        profitability: { estimatedRevenue: 500000, estimatedProfit: 175000, marginPercentage: 35 },
        viability: 78,
        scalability: 82
      };
    }

    const scoreData = await scoringResponse.json();
    const text = scoreData.choices[0]?.message?.content;

    if (!text) throw new Error("No response from AI");

    const parsed = JSON.parse(text);

    // Map problemImpact (AI) to problem_impact (App)
    return {
      uniqueness: parsed.uniqueness || 0,
      demand: parsed.demand || 'Mid',
      problem_impact: parsed.problemImpact || parsed.problem_impact || 0,
      profitability: parsed.profitability || { estimatedRevenue: 0, estimatedProfit: 0, marginPercentage: 0 },
      viability: parsed.viability || 0,
      scalability: parsed.scalability || 0
    };

  } catch (error) {
    console.error("OpenRouter Scoring Error:", error);
    // Fallback scores
    return {
      uniqueness: 65,
      demand: 'Mid',
      problem_impact: 70,
      profitability: { estimatedRevenue: 250000, estimatedProfit: 62500, marginPercentage: 25 },
      viability: 68,
      scalability: 72
    };
  }
}
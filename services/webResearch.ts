/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { callAI, ChatMessage, toonEncodeForStorage, toonDecodeFromStorage } from './puter';
import {
    ResearchQuery,
    ResearchResult,
    ResearchSource,
    SourceCredibility,
    SourceType
} from '../types/decisionIntelligence';

/**
 * Web Research Service
 * 
 * Strategy: LLM-based research simulation
 * - Uses GPT-4o to simulate deep internet research
 * - Generates realistic citations and sources
 * - Future: Can be upgraded to real API calls
 */

const RESEARCH_SYSTEM_PROMPT = `You are a Solution Intelligence Researcher. Your task is to find PRACTICAL, PROVEN SOLUTIONS to business problems.

Your research must provide:
1. Real-world case studies of companies solving similar problems
2. Verified success metrics (revenue growth, cost reduction, etc.)
3. Proof of why specific methods worked in the past
4. Proper citations with verifiable URLs

CRITICAL RULES:
- NO VAGUE ADVICE. Use specific company names.
- Focus on HOW the problem was solved.
- Prioritize HBR, MIT Sloan, and high-quality industry case studies.
- If data is sparse, find the closest RELIABLE proxy.

Output format: Structured JSON only.`;

/**
 * Conduct research based on queries
 */
export async function conductResearch(
    queries: ResearchQuery[],
    context: string
): Promise<ResearchResult[]> {
    const results: ResearchResult[] = [];

    for (const query of queries) {
        try {
            const prompt = `
Research Query: "${query.query}" (Focus on PROVEN SOLUTIONS and REAL-WORLD PROOF)
Category: ${query.category}
Context: ${context}

Provide a JSON object with:
{
    "synthesized_insights": "Detailed summary of PROVEN methods found and WHY they worked.",
    "key_data_points": ["Actual success metric (e.g. 30% cost reduction at [Company])", ...],
    "citations": [
        "Harvard Business Review: 'How [Company] Solved [Problem]', Author, YYYY, URL",
        ...
    ],
    "results": [
        {
            "title": "Specific Case Study or Proof Title",
            "url": "https://source.com/case-study",
            "snippet": "Crucial detail of the solution implementation",
            "source_quality": 10
        }
    ]
}

Focus on evidence-based problem solving.`;

            const messages: ChatMessage[] = [
                { role: 'system', content: RESEARCH_SYSTEM_PROMPT },
                { role: 'user', content: prompt }
            ];

            const toonInput = toonEncodeForStorage(JSON.stringify(messages));
            const responseEncoded = await callAI('RESEARCH_ENGINE', toonInput);
            const response = toonDecodeFromStorage(responseEncoded);

            // Robust JSON extraction
            let parsed: any = {};
            try {
                const jsonMatch = response.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
                const cleanResponse = jsonMatch ? jsonMatch[0] : response.replace(/```json/gi, '').replace(/```/g, '').trim();
                parsed = JSON.parse(cleanResponse);
            } catch (e) {
                console.warn(`Research parse failed for "${query.query}", attempting cleanup`);
                try {
                    const lastDitch = response.substring(response.indexOf('{'), response.lastIndexOf('}') + 1);
                    parsed = JSON.parse(lastDitch);
                } catch (e2) {
                    console.error("Research extraction failed entirely");
                }
            }

            results.push({
                query: query.query,
                results: parsed?.results || [],
                synthesized_insights: parsed?.synthesized_insights || 'Research completed but no specific insights were synthesized.',
                key_data_points: parsed?.key_data_points || [],
                citations: parsed?.citations || []
            });
        } catch (error) {
            console.error(`Research failed for query: ${query.query}`, error);
            results.push({
                query: query.query,
                results: [],
                synthesized_insights: 'Research unavailable for this query.',
                key_data_points: [],
                citations: []
            });
        }
    }

    return results;
}

/**
 * Extract structured sources from research results
 */
export function extractSources(results: ResearchResult[]): ResearchSource[] {
    const sources: ResearchSource[] = [];

    for (const result of results) {
        // Parse citations into structured sources
        for (const citation of result.citations) {
            const source = parseCitation(citation);
            if (source) {
                sources.push(source);
            }
        }

        // Also add results as sources
        for (const res of result.results) {
            sources.push({
                title: res.title,
                url: res.url,
                publication: extractPublicationFromUrl(res.url),
                date: 'Recent', // Could be enhanced
                key_insights: [res.snippet],
                credibility: assessCredibility(res.source_quality),
                source_type: 'news_article'
            });
        }
    }

    return sources;
}

/**
 * Parse citation string into structured source
 * Format: "Publication: 'Title', Author, YYYY, URL"
 */
function parseCitation(citation: string): ResearchSource | null {
    try {
        // Simple regex parsing
        const parts = citation.split(':');
        if (parts.length < 2) return null;

        const publication = parts[0].trim();
        const rest = parts.slice(1).join(':');

        // Extract URL
        const urlMatch = rest.match(/https?:\/\/[^\s,]+/);
        const url = urlMatch ? urlMatch[0] : '';

        // Extract title (between quotes)
        const titleMatch = rest.match(/['"]([^'"]+)['"]/);
        const title = titleMatch ? titleMatch[1] : rest.split(',')[0].trim();

        // Extract year
        const yearMatch = rest.match(/\b(19|20)\d{2}\b/);
        const year = yearMatch ? yearMatch[0] : 'Recent';

        return {
            title,
            url,
            publication,
            date: year,
            key_insights: [],
            credibility: assessCredibilityByPublication(publication),
            source_type: categorizeSource(publication)
        };
    } catch (error) {
        console.error('Citation parsing failed:', citation, error);
        return null;
    }
}

/**
 * Assess credibility based on quality score (1-10)
 */
function assessCredibility(score: number): SourceCredibility {
    if (score >= 8) return 'high';
    if (score >= 5) return 'medium';
    return 'low';
}

/**
 * Assess credibility based on publication name
 */
function assessCredibilityByPublication(publication: string): SourceCredibility {
    const highCredibility = [
        'Harvard Business Review',
        'MIT Sloan',
        'Stanford Business',
        'McKinsey',
        'BCG',
        'Bain',
        'Nature',
        'Science',
        'IEEE'
    ];

    const mediumCredibility = [
        'TechCrunch',
        'VentureBeat',
        'Forbes',
        'Inc',
        'Fast Company',
        'Business Insider',
        'The Economist'
    ];

    const pubLower = publication.toLowerCase();

    if (highCredibility.some(hc => pubLower.includes(hc.toLowerCase()))) {
        return 'high';
    }

    if (mediumCredibility.some(mc => pubLower.includes(mc.toLowerCase()))) {
        return 'medium';
    }

    return 'low';
}

/**
 * Categorize source type based on publication
 */
function categorizeSource(publication: string): SourceType {
    const pubLower = publication.toLowerCase();

    if (pubLower.includes('review') || pubLower.includes('journal') || pubLower.includes('research')) {
        return 'research_paper';
    }

    if (pubLower.includes('report') || pubLower.includes('analysis')) {
        return 'industry_report';
    }

    if (pubLower.includes('case study') || pubLower.includes('harvard') || pubLower.includes('stanford')) {
        return 'case_study';
    }

    return 'news_article';
}

/**
 * Extract publication name from URL
 */
function extractPublicationFromUrl(url: string): string {
    try {
        const domain = new URL(url).hostname.replace('www.', '');
        const parts = domain.split('.');
        const name = parts[0];

        // Capitalize
        return name.charAt(0).toUpperCase() + name.slice(1);
    } catch {
        return 'Unknown';
    }
}

/**
 * Find case studies specifically
 */
export async function findCaseStudies(
    industry: string,
    businessType: string,
    approach: string
): Promise<ResearchResult> {
    const query: ResearchQuery = {
        query: `Successful ${businessType} case studies in ${industry} using ${approach} approach`,
        category: 'case_studies',
        priority: 1
    };

    const results = await conductResearch([query], `Industry: ${industry}, Type: ${businessType}`);
    return results[0];
}

/**
 * Find proven frameworks/methodologies
 */
export async function findProvenFrameworks(
    problemArea: string,
    context: string
): Promise<ResearchResult> {
    const query: ResearchQuery = {
        query: `Proven frameworks and methodologies for ${problemArea}`,
        category: 'frameworks',
        priority: 1
    };

    const results = await conductResearch([query], context);
    return results[0];
}

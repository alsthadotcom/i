/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SolutionApproach, RoadmapPhase } from '../types/decisionIntelligence';

/**
 * Visual Generator Service
 * 
 * Generates visual representations of solutions:
 * 1. Mermaid diagrams for roadmaps
 * 2. Chart.js data for comparisons
 */

/**
 * Generate Mermaid.js Gantt diagram code for a roadmap
 */
export function generateRoadmapMermaid(solution: SolutionApproach): string {
    const { name, phases } = solution;

    let mermaidCode = `gantt
    title ${name} Roadmap
    dateFormat YYYY-MM-DD
    axisFormat %b %Y
    
`;

    // Calculate start date (today)
    const startDate = new Date();
    let currentDate = new Date(startDate);

    (phases || []).forEach((phase, index) => {
        // Parse duration (e.g., "Month 1-2" or "2 months")
        const durationMonths = parseDurationToMonths(phase.duration);

        // Calculate end date
        const endDate = new Date(currentDate);
        endDate.setMonth(endDate.getMonth() + durationMonths);

        // Format dates
        const startStr = formatDateForMermaid(currentDate);
        const endStr = formatDateForMermaid(endDate);

        // Add section
        mermaidCode += `    section ${phase.name}\n`;

        // Add main phase
        mermaidCode += `    ${phase.name}           :active, p${index}, ${startStr}, ${endStr}\n`;

        // Add milestones as tasks
        (phase.milestones || []).forEach((milestone, mIdx) => {
            const milestoneDate = new Date(currentDate);
            milestoneDate.setMonth(milestoneDate.getMonth() + (durationMonths / (phase.milestones.length + 1)) * (mIdx + 1));
            const milestoneStr = formatDateForMermaid(milestoneDate);

            mermaidCode += `    ${milestone}           :milestone, m${index}-${mIdx}, ${milestoneStr}, 0d\n`;
        });

        mermaidCode += '\n';

        // Update current date for next phase
        currentDate = new Date(endDate);
    });

    return mermaidCode;
}

/**
 * Generate Chart.js radar chart data for solution comparison
 */
export function generateComparisonChartData(solutions: SolutionApproach[]) {
    // Define metrics to compare
    const metrics = [
        'Speed to Market',
        'Capital Efficiency',
        'Risk Level',
        'Scalability',
        'Proven Success Rate'
    ];

    const datasets = solutions.map((solution, index) => {
        // Calculate scores for each metric (0-100)
        const data = [
            calculateSpeedScore(solution.time_to_market),
            calculateCapitalScore(solution.capital_required),
            calculateRiskScore(solution.risk_level),
            calculateScalabilityScore(solution),
            calculateProvenScore(solution.proven_examples)
        ];

        const colors = [
            'rgba(0, 255, 136, 0.6)',  // Green
            'rgba(255, 215, 0, 0.6)',  // Yellow
            'rgba(255, 68, 68, 0.6)'   // Red
        ];

        const borderColors = [
            'rgba(0, 255, 136, 1)',
            'rgba(255, 215, 0, 1)',
            'rgba(255, 68, 68, 1)'
        ];

        return {
            label: solution.name || 'Unnamed Solution',
            data: data,
            backgroundColor: colors[index % colors.length],
            borderColor: borderColors[index % borderColors.length],
            borderWidth: 2
        };
    });

    return {
        labels: metrics,
        datasets: datasets
    };
}

/**
 * Generate bar chart data for capital comparison
 */
export function generateCapitalComparisonData(solutions: SolutionApproach[]) {
    return {
        labels: solutions.map(s => s.name),
        datasets: [
            {
                label: 'Minimum Capital Required ($)',
                data: (solutions || []).map(s => s?.capital_required?.min || 0),
                backgroundColor: 'rgba(0, 255, 136, 0.6)',
                borderColor: 'rgba(0, 255, 136, 1)',
                borderWidth: 1
            },
            {
                label: 'Maximum Capital Required ($)',
                data: (solutions || []).map(s => s?.capital_required?.max || 0),
                backgroundColor: 'rgba(255, 215, 0, 0.6)',
                borderColor: 'rgba(255, 215, 0, 1)',
                borderWidth: 1
            }
        ]
    };
}

/**
 * Generate timeline comparison data
 */
export function generateTimelineComparisonData(solutions: SolutionApproach[]) {
    return {
        labels: solutions.map(s => s.name),
        datasets: [
            {
                label: 'Minimum Time (months)',
                data: (solutions || []).map(s => s?.time_to_market?.min_months || 0),
                backgroundColor: 'rgba(0, 255, 136, 0.6)',
                borderColor: 'rgba(0, 255, 136, 1)',
                borderWidth: 1
            },
            {
                label: 'Maximum Time (months)',
                data: (solutions || []).map(s => s?.time_to_market?.max_months || 0),
                backgroundColor: 'rgba(255, 68, 68, 0.6)',
                borderColor: 'rgba(255, 68, 68, 1)',
                borderWidth: 1
            }
        ]
    };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function parseDurationToMonths(duration: string): number {
    // Parse formats like "Month 1-2", "2 months", "3-6 months"
    const match = duration.match(/(\d+)(?:-(\d+))?/);
    if (!match) return 3; // Default

    const start = parseInt(match[1]);
    const end = match[2] ? parseInt(match[2]) : start;

    return end - start + 1;
}

function formatDateForMermaid(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function calculateSpeedScore(timeToMarket: any): number {
    // Faster = higher score
    const avgMonths = (timeToMarket.min_months + timeToMarket.max_months) / 2;

    if (avgMonths <= 3) return 100;
    if (avgMonths <= 6) return 80;
    if (avgMonths <= 12) return 60;
    if (avgMonths <= 18) return 40;
    return 20;
}

function calculateCapitalScore(capital: any): number {
    // Lower capital = higher score (capital efficiency)
    const avgCapital = (capital.min + capital.max) / 2;

    if (avgCapital <= 10000) return 100;
    if (avgCapital <= 50000) return 80;
    if (avgCapital <= 100000) return 60;
    if (avgCapital <= 200000) return 40;
    return 20;
}

function calculateRiskScore(riskLevel: string): number {
    // Lower risk = higher score
    switch (riskLevel) {
        case 'low': return 100;
        case 'medium': return 60;
        case 'high': return 30;
        default: return 50;
    }
}

function calculateScalabilityScore(solution: SolutionApproach): number {
    // Based on category and resource requirements
    if (solution.category === 'technology_driven') return 95;
    if (solution.category === 'capital_driven') return 80;
    return 50; // Human expertise scales linearly/slowly
}

function calculateProvenScore(examples: any[]): number {
    // More examples = higher score
    const count = examples?.length || 0;

    if (count >= 5) return 100;
    if (count >= 3) return 80;
    if (count >= 1) return 60;
    return 30;
}

/**
 * Generate phase breakdown visualization data
 */
export function generatePhaseBreakdownChart(phases: RoadmapPhase[]) {
    return {
        labels: (phases || []).map(p => p?.name || 'Unknown'),
        datasets: [
            {
                label: 'Estimated Cost ($)',
                data: (phases || []).map(p => p?.estimated_cost || 0),
                backgroundColor: [
                    'rgba(0, 255, 136, 0.6)',
                    'rgba(100, 255, 150, 0.6)',
                    'rgba(150, 255, 180, 0.6)'
                ],
                borderColor: [
                    'rgba(0, 255, 136, 1)',
                    'rgba(100, 255, 150, 1)',
                    'rgba(150, 255, 180, 1)'
                ],
                borderWidth: 1
            }
        ]
    };
}

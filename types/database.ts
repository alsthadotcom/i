/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Database Types matching the Supabase schema

export interface UserInfo {
    user_id: string;
    name: string;
    email: string;
    username: string; // Format: @username (lowercase alphanumeric only)
    password?: string; // Added as per requirement
    profile_picture?: string | null; // URL to profile picture
    created_at?: string;
    updated_at?: string;
}

export interface IdeaListing {
    idea_id: string;
    user_id: string;

    // Idea Info (Step 1)
    title: string;
    one_line_description: string; // "Short Description"
    category: string; // Primary
    secondary_category?: string;

    // Narrative Sections (Arrays for lists, Strings for paragraphs)
    customer_pain?: string[]; // A. Numbered List
    current_solutions?: string[]; // B. Numbered List
    execution_steps?: string[]; // C. Numbered List
    growth_plan?: string[]; // D. Numbered List

    solution_details?: string; // E. Paragraph
    revenue_plan?: string; // F. Paragraph
    impact?: string; // G. Paragraph

    price: number;
    document_url: string;
    additional_doc_1?: string | null;
    additional_doc_2?: string | null;
    additional_doc_3?: string | null;

    created_at?: string;
    updated_at?: string;
}

export type DemandLevel = 'Low' | 'Low-Mid' | 'Mid' | 'Mid-High' | 'High';

export interface AIScoring {
    ai_score_id: string;
    idea_id: string;
    uniqueness: number;
    demand: DemandLevel;
    problem_impact: number;
    profitability: string;
    viability: number;
    scalability: number;
    overall_score?: number;
    created_at?: string;
    updated_at?: string;
}

export interface MarketplaceView {
    marketplace_id: string;
    idea_id: string;
    ai_score_id: string;
    title: string;
    description: string;
    uniqueness: number;
    viability: number;
    profitability: string;
    category?: string | null;
    secondary_category?: string | null;

    mvp: boolean;

    document_url: string;
    price: number;
    username: string;
    created_at: string;
    overall_score: number;
}

export interface IdeaDetailView {
    idea_detail_id?: string; // View might not have ID column depending on implementation
    idea_id: string;
    user_id: string;
    ai_score_id: string;
    title: string;

    // Mapped fields
    description: string;
    mvp: boolean;

    // Full Fields
    one_line_description?: string;
    category?: string;
    secondary_category?: string;

    // New Narrative Fields
    customer_pain?: string[];
    current_solutions?: string[];
    execution_steps?: string[];
    growth_plan?: string[];
    solution_details?: string;
    revenue_plan?: string;
    impact?: string;

    uniqueness: number;
    demand: DemandLevel;
    problem_impact: number;
    profitability: string;
    viability: number;
    scalability: number;
    overall_score: number;
    price: number;
    username: string;
    profile_picture?: string;

    document_url: string;
    additional_doc_1?: string | null;
    additional_doc_2?: string | null;
    additional_doc_3?: string | null;

    created_at: string;
    updated_at: string;
}

// Helper type for creating new ideas (without auto-generated fields)
export type NewIdeaListing = Omit<IdeaListing, 'idea_id' | 'created_at' | 'updated_at'>;
export type NewAIScoring = Omit<AIScoring, 'ai_score_id' | 'created_at' | 'updated_at' | 'overall_score'>;
export type NewUserInfo = Omit<UserInfo, 'user_id' | 'created_at' | 'updated_at'>;

export interface Like {
    like_id: string;
    user_id: string;
    idea_id: string;
    created_at: string;
}

export interface Save {
    save_id: string;
    user_id: string;
    idea_id: string;
    created_at: string;
}

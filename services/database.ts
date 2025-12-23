/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from './supabase';
import {
    UserInfo,
    NewUserInfo,
    IdeaListing,
    NewIdeaListing,
    AIScoring,
    NewAIScoring,
    MarketplaceView,
    IdeaDetailView,
    Venture,
    NewVenture
} from '../types/database';

// ============================================
// HELPERS
// ============================================

export function getAnonymousId(): string {
    let anonId = localStorage.getItem('ida_anonymous_id');
    if (!anonId) {
        // Generate a valid UUID v4
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            anonId = crypto.randomUUID();
        } else {
            // Fallback for older environments
            anonId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
        localStorage.setItem('ida_anonymous_id', anonId);
    }
    return anonId;
}

// ============================================
// USER INFO OPERATIONS
// ============================================

export async function createUserInfo(userData: NewUserInfo): Promise<{ data: UserInfo | null; error: any }> {
    try {
        // Ensure username starts with @ and is lowercase
        let username = userData.username.toLowerCase();
        if (!username.startsWith('@')) {
            username = '@' + username;
        }

        // Validate username format (only lowercase letters and numbers after @)
        if (!/^@[a-z0-9]+$/.test(username)) {
            return {
                data: null,
                error: new Error('Username must contain only lowercase letters and numbers')
            };
        }

        const { data, error } = await supabase
            .from('user_info')
            .insert([{ ...userData, username }])
            .select()
            .single();

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

export async function getUserInfoByEmail(email: string): Promise<{ data: UserInfo | null; error: any }> {
    const { data, error } = await supabase
        .from('user_info')
        .select('*')
        .eq('email', email)
        .single();

    return { data, error };
}

export async function getUserInfoByUsername(username: string): Promise<{ data: UserInfo | null; error: any }> {
    const { data, error } = await supabase
        .from('user_info')
        .select('*')
        .eq('username', username)
        .single();

    return { data, error };
}

export async function getUserInfoById(userId: string): Promise<{ data: UserInfo | null; error: any }> {
    const { data, error } = await supabase
        .from('user_info')
        .select('*')
        .eq('user_id', userId)
        .single();

    return { data, error };
}

export async function ensureUserInfoExists(user: any): Promise<void> {
    try {
        // 1. Check if user already exists
        const { data } = await supabase
            .from('user_info')
            .select('user_id')
            .eq('user_id', user.id)
            .single();

        if (data) return; // User exists, we're good

        // 2. Prepare new user data
        const email = user.email || '';
        const metadata = user.user_metadata || {};

        // Get name from metadata (Google provides full_name or name)
        const name = metadata.full_name || metadata.name || email.split('@')[0];

        // Generate base username from email (sanitize to a-z0-9)
        const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        let username = `@${baseUsername}`;

        // 3. Try to insert (with simple retry for username collision)
        let created = false;
        let attempts = 0;

        while (!created && attempts < 3) {
            const { error } = await supabase
                .from('user_info')
                .insert([{
                    user_id: user.id,
                    email: email,
                    name: name,
                    username: username
                }]);

            if (!error) {
                created = true;
            } else if (error.code === '23505') { // Unique violation
                // Append random number if username taken
                username = `@${baseUsername}${Math.floor(Math.random() * 10000)}`;
                attempts++;
            } else {
                console.error('Failed to create user_info:', error);
                break;
            }
        }
    } catch (error) {
        console.error('Error syncing user info:', error);
    }
}

export async function updateUserProfile(userId: string, newUsername: string, newFullName: string): Promise<{ data: UserInfo | null; error: any }> {
    try {
        // Ensure username starts with @ and is lowercase
        let username = newUsername.toLowerCase();
        if (!username.startsWith('@')) {
            username = '@' + username;
        }

        // Validate username format (only lowercase letters and numbers after @)
        if (!/^@[a-z0-9]+$/.test(username)) {
            return {
                data: null,
                error: new Error('Username must contain only lowercase letters and numbers')
            };
        }

        // Check if username is already taken by another user (only if it changed)
        // Optimization: checking if changed first would be good, but for now we just check existence
        const { data: existingUser } = await supabase
            .from('user_info')
            .select('user_id')
            .eq('username', username)
            .single();

        if (existingUser && existingUser.user_id !== userId) {
            return {
                data: null,
                error: new Error('Username is already taken')
            };
        }

        // Update the profile (username and full_name)
        const { data, error } = await supabase
            .from('user_info')
            .update({
                username: username,
                full_name: newFullName,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .select()
            .single();

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

export async function updateUserProfilePicture(userId: string, profilePictureUrl: string): Promise<{ data: UserInfo | null; error: any }> {
    try {
        const { data, error } = await supabase
            .from('user_info')
            .update({ profile_picture: profilePictureUrl, updated_at: new Date().toISOString() })
            .eq('user_id', userId)
            .select()
            .single();

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}


// ============================================
// IDEA LISTING OPERATIONS
// ============================================

export async function createIdeaListing(ideaData: NewIdeaListing): Promise<{ data: IdeaListing | null; error: any }> {
    const { data, error } = await supabase
        .from('idea_listing')
        .insert([ideaData])
        .select()
        .single();

    return { data, error };
}

export async function getIdeaListingById(ideaId: string): Promise<{ data: IdeaListing | null; error: any }> {
    const { data, error } = await supabase
        .from('idea_listing')
        .select('*')
        .eq('idea_id', ideaId)
        .single();

    return { data, error };
}

export async function getIdeaListingsByUser(userId: string): Promise<{ data: IdeaListing[] | null; error: any }> {
    const { data, error } = await supabase
        .from('idea_listing')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    return { data, error };
}

export async function updateIdeaListing(
    ideaId: string,
    updates: Partial<NewIdeaListing>
): Promise<{ data: IdeaListing | null; error: any }> {
    const { data, error } = await supabase
        .from('idea_listing')
        .update(updates)
        .eq('idea_id', ideaId)
        .select()
        .single();

    return { data, error };
}

export async function deleteIdeaListing(ideaId: string): Promise<{ error: any }> {
    const { error } = await supabase
        .from('idea_listing')
        .delete()
        .eq('idea_id', ideaId);

    return { error };
}

// ============================================
// VENTURE OPERATIONS
// ============================================

export async function createVenture(ventureData: NewVenture): Promise<{ data: Venture | null; error: any }> {
    // If user_id is missing (anonymous), use the anonymous ID
    const finalData = {
        ...ventureData,
        user_id: ventureData.user_id || getAnonymousId()
    };

    const { data, error } = await supabase
        .from('ventures')
        .insert([finalData])
        .select()
        .single();

    return { data, error };
}

export async function getVenturesByUser(userId: string): Promise<{ data: Venture[] | null; error: any }> {
    const { data, error } = await supabase
        .from('ventures')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    return { data, error };
}

// ============================================
// VENTURE ANALYSIS OPERATIONS
// ============================================

export async function saveVentureAnalysis(ventureId: string, analysisData: any): Promise<{ data: any | null; error: any }> {
    // Check if analysis already exists for this venture
    const { data: existing } = await supabase
        .from('venture_analysis')
        .select('id')
        .eq('venture_id', ventureId)
        .maybeSingle();

    let result;
    if (existing) {
        // Update
        result = await supabase
            .from('venture_analysis')
            .update({ roadmap_data: analysisData, updated_at: new Date().toISOString() })
            .eq('venture_id', ventureId)
            .select()
            .single();
    } else {
        // Insert
        result = await supabase
            .from('venture_analysis')
            .insert([{ venture_id: ventureId, roadmap_data: analysisData }])
            .select()
            .single();
    }

    return { data: result.data, error: result.error };
}

// AI SCORING OPERATIONS REMOVED

// ============================================
// MARKETPLACE VIEW OPERATIONS
// ============================================

export interface MarketplaceFilters {
    limit?: number;
    offset?: number;
    searchTerm?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    hasMvp?: boolean;
    hasDocs?: boolean;
    sort?: {
        field: 'price' | 'overall_score' | 'created_at';
        direction: 'asc' | 'desc';
    };
}

export async function getMarketplaceItems(
    filters: MarketplaceFilters = {}
): Promise<{ data: MarketplaceView[] | null; error: any }> {
    let query = supabase
        .from('marketplace')
        .select('*');

    // Search (Keywords)
    if (filters.searchTerm) {
        const terms = filters.searchTerm.trim().split(/\s+/);
        terms.forEach(term => {
            if (term) {
                query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
            }
        });
    }

    // Category
    if (filters.category) {
        query = query.eq('category', filters.category);
    }

    // Price
    if (filters.minPrice !== undefined) query = query.gte('price', filters.minPrice);
    if (filters.maxPrice !== undefined) query = query.lte('price', filters.maxPrice);

    // AI Score (Removed)


    // MVP
    if (filters.hasMvp) {
        query = query.eq('mvp', true);
    }

    // Docs
    if (filters.hasDocs) {
        query = query.not('document_url', 'is', null);
    }

    // Sort
    if (filters.sort) {
        query = query.order(filters.sort.field, { ascending: filters.sort.direction === 'asc' });
    } else {
        // Default sort (if no search, or even with search if no specific sort)
        // With search, typically relevance, but we don't have relevance score easily.
        // Default to created_at descending.
        query = query.order('created_at', { ascending: false });
    }

    // Pagination
    if (filters.limit) query = query.limit(filters.limit);
    if (filters.offset) {
        const limit = filters.limit || 10;
        query = query.range(filters.offset, filters.offset + limit - 1);
    }

    const { data, error } = await query;
    return { data, error };
}

// Deprecated: logic merged into getMarketplaceItems
export async function searchMarketplaceItems(
    searchTerm: string,
    limit?: number
): Promise<{ data: MarketplaceView[] | null; error: any }> {
    return getMarketplaceItems({ searchTerm, limit });
}

export async function getTopRatedMarketplaceItems(
    limit: number = 10
): Promise<{ data: MarketplaceView[] | null; error: any }> {
    const { data, error } = await supabase
        .from('marketplace')
        .select('*')
        .order('overall_score', { ascending: false })
        .limit(limit);

    return { data, error };
}

// ============================================
// IDEA DETAIL PAGE VIEW OPERATIONS
// ============================================

export async function getIdeaDetailById(ideaId: string): Promise<{ data: IdeaDetailView | null; error: any }> {
    const { data: viewData, error } = await supabase
        .from('idea_detail_page')
        .select('*')
        .eq('idea_id', ideaId)
        .single();

    if (error) return { data: null, error };
    if (!viewData) return { data: null, error: null };

    // Patch: Ensure user_id is present
    let finalData = { ...viewData } as IdeaDetailView;

    // Strategy 1: Already has user_id?
    if (finalData.user_id) return { data: finalData, error: null };

    // Strategy 2: Fetch from 'ideas' table
    try {
        console.log('Strategy 2: Attempting fetch from ideas table for', ideaId);
        const { data: ideaData, error: ideaError } = await supabase
            .from('ideas')
            .select('user_id')
            .eq('idea_id', ideaId)
            .maybeSingle();

        if (ideaError) console.warn('Strategy 2 Error:', ideaError);
        if (ideaData && ideaData.user_id) {
            finalData.user_id = ideaData.user_id;
            console.log('Patched user_id from ideas table:', ideaData.user_id);
            return { data: finalData, error: null };
        } else {
            console.log('Strategy 2: No data or user_id found');
        }
    } catch (e) { console.warn('Strategy 2 Exception', e); }

    // Strategy 3: Fetch from 'user_info' table via username
    if (finalData.username) {
        try {
            console.log('Strategy 3: Attempting fetch from user_info for', finalData.username);
            const { data: userData, error: userError } = await supabase
                .from('user_info')
                .select('user_id')
                .eq('username', finalData.username)
                .maybeSingle();

            if (userError) console.warn('Strategy 3 Error:', userError);

            if (userData && userData.user_id) {
                finalData.user_id = userData.user_id;
                console.log('Patched user_id from user_info table:', userData.user_id);
                return { data: finalData, error: null };
            } else {
                console.log('Strategy 3: User not found for username:', finalData.username);
            }
        } catch (e) { console.warn('Strategy 3 Exception', e); }
    } else {
        console.warn('Strategy 3 Skipped: No username in view data');
    }

    return { data: finalData, error: null };
}

// ============================================
// FILE UPLOAD OPERATIONS
// ============================================

export async function uploadDocument(
    file: File,
    userId: string,
    folder: 'documents' | 'mvp-images' | 'mvp-videos' | 'profile-pictures' = 'documents'
): Promise<{ data: { path: string; url: string } | null; error: any }> {
    try {
        let fileExt = file.name.split('.').pop();
        // If extension is missing or same as name (no dot), try to infer from type
        if (!fileExt || fileExt === file.name) {
            const type = file.type;
            if (type === 'image/jpeg') fileExt = 'jpg';
            else if (type === 'image/png') fileExt = 'png';
            else if (type === 'application/pdf') fileExt = 'pdf';
            else fileExt = 'bin';
        }

        // Sanitize filename
        const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const { data, error } = await supabase.storage
            .from('idea-assets')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error("Supabase Storage Upload Error:", error);
            return { data: null, error };
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('idea-assets')
            .getPublicUrl(filePath);

        return {
            data: {
                path: filePath,
                url: urlData.publicUrl
            },
            error: null
        };
    } catch (error) {
        console.error("Upload Document Exception:", error);
        return { data: null, error };
    }
}

export async function deleteDocument(filePath: string): Promise<{ error: any }> {
    const { error } = await supabase.storage
        .from('idea-assets')
        .remove([filePath]);

    return { error };
}

// ============================================
// DASHBOARD OPERATIONS
// ============================================

export async function getUserListings(userId: string): Promise<{ data: MarketplaceView[] | null; error: any }> {
    // Query idea_listing table directly to ensure we get all user items
    const { data: listings, error } = await supabase
        .from('idea_listing')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        return { data: null, error };
    }

    // Map to MarketplaceView shape
    const marketplaceItems: MarketplaceView[] = (listings || []).map((item: any) => {
        return {
            marketplace_id: item.idea_id,
            idea_id: item.idea_id,
            ai_score_id: 'pending',
            title: item.title,
            description: item.one_line_description || '',
            uniqueness: 0,
            viability: 0,
            profitability: 'Pending',
            market_saturation: 0,
            capital_intensity: 0,
            category: item.category,
            secondary_category: item.secondary_category,
            mvp: false,
            document_url: item.document_url,
            price: item.price,
            username: '',
            created_at: item.created_at,
            overall_score: 0
        };
    });

    return { data: marketplaceItems, error: null };
}

export async function getIdeaDetails(ideaId: string): Promise<{ data: IdeaDetailView | null; error: any }> {
    const { data, error } = await supabase
        .from('idea_detail_page')
        .select('*')
        .eq('idea_id', ideaId)
        .single();
    return { data, error };
}

// ============================================
// LIKES AND SAVES OPERATIONS
// ============================================

export async function toggleLike(ideaId: string, userId: string): Promise<{ liked: boolean; count: number; error: any }> {
    try {
        // 1. Check if like exists
        const { data: existingLike } = await supabase
            .from('likes')
            .select('like_id')
            .eq('idea_id', ideaId)
            .eq('user_id', userId)
            .single();

        let liked = false;

        if (existingLike) {
            // Unlike
            await supabase.from('likes').delete().eq('like_id', existingLike.like_id);
            liked = false;
        } else {
            // Like
            await supabase.from('likes').insert([{ idea_id: ideaId, user_id: userId }]);
            liked = true;
        }

        // Get new count
        const { count } = await supabase
            .from('likes')
            .select('like_id', { count: 'exact', head: true })
            .eq('idea_id', ideaId);

        return { liked, count: count || 0, error: null };
    } catch (error) {
        return { liked: false, count: 0, error };
    }
}

export async function getLikeStatus(ideaId: string, userId?: string): Promise<{ liked: boolean; count: number; error: any }> {
    try {
        let liked = false;
        if (userId) {
            const { data } = await supabase
                .from('likes')
                .select('like_id')
                .eq('idea_id', ideaId)
                .eq('user_id', userId)
                .single();
            liked = !!data;
        }

        const { count } = await supabase
            .from('likes')
            .select('like_id', { count: 'exact', head: true })
            .eq('idea_id', ideaId);

        return { liked, count: count || 0, error: null };
    } catch (error) {
        return { liked: false, count: 0, error };
    }
}

export async function toggleSave(ideaId: string, userId: string): Promise<{ saved: boolean; error: any }> {
    try {
        // 1. Check if save exists
        const { data: existingSave } = await supabase
            .from('saves')
            .select('save_id')
            .eq('idea_id', ideaId)
            .eq('user_id', userId)
            .single();

        let saved = false;

        if (existingSave) {
            // Unsave
            await supabase.from('saves').delete().eq('save_id', existingSave.save_id);
            saved = false;
        } else {
            // Save
            await supabase.from('saves').insert([{ idea_id: ideaId, user_id: userId }]);
            saved = true;
        }

        return { saved, error: null };
    } catch (error) {
        return { saved: false, error };
    }
}

export async function getSaveStatus(ideaId: string, userId: string): Promise<{ saved: boolean; error: any }> {
    try {
        const { data } = await supabase
            .from('saves')
            .select('save_id')
            .eq('idea_id', ideaId)
            .eq('user_id', userId)
            .single();

        return { saved: !!data, error: null };
    } catch (error) {
        return { saved: false, error };
    }
}

export async function getUserLikedListings(userId: string): Promise<{ data: MarketplaceView[] | null; error: any }> {
    try {
        // Get liked idea IDs
        const { data: likes } = await supabase
            .from('likes')
            .select('idea_id')
            .eq('user_id', userId);

        if (!likes || likes.length === 0) return { data: [], error: null };

        const ideaIds = likes.map(l => l.idea_id);

        // Fetch details from marketplace view
        const { data, error } = await supabase
            .from('marketplace')
            .select('*')
            .in('idea_id', ideaIds)
            .order('created_at', { ascending: false });

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

export async function getUserSavedListings(userId: string): Promise<{ data: MarketplaceView[] | null; error: any }> {
    try {
        // Get saved idea IDs
        const { data: saves } = await supabase
            .from('saves')
            .select('idea_id')
            .eq('user_id', userId);

        if (!saves || saves.length === 0) return { data: [], error: null };

        const ideaIds = saves.map(s => s.idea_id);

        // Fetch details from marketplace view
        const { data, error } = await supabase
            .from('marketplace')
            .select('*')
            .in('idea_id', ideaIds)
            .order('created_at', { ascending: false });

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

export async function getShareCount(ideaId: string): Promise<number> {
    const { count } = await supabase
        .from('shares')
        .select('id', { count: 'exact', head: true })
        .eq('idea_id', ideaId);
    return count || 0;
}

export async function trackShare(ideaId: string, userId?: string): Promise<void> {
    const { error } = await supabase.from('shares').insert([
        {
            idea_id: ideaId,
            user_id: userId || null
        }
    ]);
    if (error) console.error("Error tracking share:", error);
}

export async function getVentureByUserId(userId: string): Promise<{ data: Venture | null; error: any }> {
    const { data, error } = await supabase
        .from('ventures')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    return { data, error };
}

export async function updateVenture(ventureId: string, updates: Partial<Venture>): Promise<{ data: Venture | null; error: any }> {
    const { data, error } = await supabase
        .from('ventures')
        .update(updates)
        .eq('id', ventureId)
        .select()
        .maybeSingle(); // Use maybeSingle

    if (!data) {
        return { data: null, error: new Error('Venture not found or permission denied') };
    }

    return { data, error };
}


import { createClient } from '@supabase/supabase-js';

// Access environment variables as defined in vite.config.ts
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase credentials. Authentication will not work.');
}

export const supabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || ''
);

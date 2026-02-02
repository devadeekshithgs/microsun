// External Supabase client - connects to user's own Supabase project
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use external Supabase credentials (user's own project)
const EXTERNAL_SUPABASE_URL = import.meta.env.VITE_EXTERNAL_SUPABASE_URL;
const EXTERNAL_SUPABASE_ANON_KEY = import.meta.env.VITE_EXTERNAL_SUPABASE_ANON_KEY;

// Fallback to Lovable Cloud if external credentials not configured
const LOVABLE_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const LOVABLE_SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Use external credentials if available, otherwise fallback to Lovable Cloud
const SUPABASE_URL = EXTERNAL_SUPABASE_URL || LOVABLE_SUPABASE_URL;
const SUPABASE_KEY = EXTERNAL_SUPABASE_ANON_KEY || LOVABLE_SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Supabase credentials not configured. Please set VITE_EXTERNAL_SUPABASE_URL and VITE_EXTERNAL_SUPABASE_ANON_KEY.');
}

// Flag to check if using external Supabase
export const isUsingExternalSupabase = Boolean(EXTERNAL_SUPABASE_URL && EXTERNAL_SUPABASE_ANON_KEY);

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/external-client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

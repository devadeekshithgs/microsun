// External Supabase client - connects to user's own Supabase project
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use external Supabase credentials (user's own project)
const EXTERNAL_SUPABASE_URL = import.meta.env.VITE_EXTERNAL_SUPABASE_URL;
const EXTERNAL_SUPABASE_ANON_KEY = import.meta.env.VITE_EXTERNAL_SUPABASE_ANON_KEY;

// Fallback to Lovable Cloud credentials (always available)
const LOVABLE_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const LOVABLE_SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Use external credentials if available, otherwise fallback to Lovable Cloud
const SUPABASE_URL = EXTERNAL_SUPABASE_URL || LOVABLE_SUPABASE_URL;
const SUPABASE_KEY = EXTERNAL_SUPABASE_ANON_KEY || LOVABLE_SUPABASE_KEY;

// Flag to check if using external Supabase
export const isUsingExternalSupabase = Boolean(EXTERNAL_SUPABASE_URL && EXTERNAL_SUPABASE_ANON_KEY);

// Log which Supabase instance is being used (for debugging)
if (isUsingExternalSupabase) {
  console.log('Using external Supabase project');
} else {
  console.log('Using Lovable Cloud Supabase');
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/external-client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

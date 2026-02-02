// External Supabase client - connects to user's own Supabase project
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use external Supabase credentials (user's own project)
const EXTERNAL_SUPABASE_URL = import.meta.env.VITE_EXTERNAL_SUPABASE_URL as string | undefined;
const EXTERNAL_SUPABASE_ANON_KEY = import.meta.env.VITE_EXTERNAL_SUPABASE_ANON_KEY as string | undefined;

// Fallback to Lovable Cloud credentials (always available)
const LOVABLE_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const LOVABLE_SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

// Determine which credentials to use
const SUPABASE_URL = EXTERNAL_SUPABASE_URL || LOVABLE_SUPABASE_URL || '';
const SUPABASE_KEY = EXTERNAL_SUPABASE_ANON_KEY || LOVABLE_SUPABASE_KEY || '';

// Flag to check if using external Supabase
export const isUsingExternalSupabase = Boolean(EXTERNAL_SUPABASE_URL && EXTERNAL_SUPABASE_ANON_KEY);

// Debug logging
console.log('[Supabase Client] Initializing...', {
  hasExternalUrl: Boolean(EXTERNAL_SUPABASE_URL),
  hasExternalKey: Boolean(EXTERNAL_SUPABASE_ANON_KEY),
  hasLovableUrl: Boolean(LOVABLE_SUPABASE_URL),
  hasLovableKey: Boolean(LOVABLE_SUPABASE_KEY),
  usingExternal: isUsingExternalSupabase,
  finalUrl: SUPABASE_URL ? SUPABASE_URL.substring(0, 30) + '...' : 'MISSING',
});

// Create client with proper error handling
let supabase: SupabaseClient<Database>;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[Supabase Client] Missing credentials! URL:', Boolean(SUPABASE_URL), 'Key:', Boolean(SUPABASE_KEY));
  // Create a dummy client that will fail gracefully
  supabase = createClient<Database>('https://placeholder.supabase.co', 'placeholder-key', {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  });
} else {
  supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  });
}

console.log('[Supabase Client] Client created successfully');

export { supabase };

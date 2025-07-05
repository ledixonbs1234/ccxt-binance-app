import { createClient } from '@supabase/supabase-js';

// Check if required environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase client initialized successfully');
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    supabase = null;
  }
} else {
  console.warn('Supabase environment variables not found. Some features will work in memory-only mode.');
  console.warn('Missing:', {
    NEXT_PUBLIC_SUPABASE_URL: !supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !supabaseAnonKey
  });
}

export { supabase };
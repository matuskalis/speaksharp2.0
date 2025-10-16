import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // During build time, environment variables might not be available
  // Return a safe client that won't be used
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      'Supabase environment variables not found. Auth features will be disabled. ' +
      'Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable authentication.'
    )
    // Return null and handle it in the auth context
    return null as any
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

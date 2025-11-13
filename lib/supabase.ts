// This file is deprecated - use lib/supabase/server.ts for API routes
// and lib/supabase/client.ts for client components
import { createClient as createServerClient } from './supabase/server'

export const getSupabase = async () => {
  return await createServerClient()
}

import { createClient } from './supabase/server'
import { NextResponse } from 'next/server'

export async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return { user: null, error }
  }
  
  return { user, error: null }
}

export async function requireAuth() {
  const { user, error } = await getAuthUser()
  
  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }
  }
  
  return { user, response: null }
}


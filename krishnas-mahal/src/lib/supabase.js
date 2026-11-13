import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isConfigured = Boolean(url && key)

// Main client (keeps the logged-in session)
export const supabase = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
})

// Secondary client used ONLY by admin to create new users without replacing the admin's own session
export const signupClient = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder', {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
})

// Users log in with a simple username; under the hood we map it to a synthetic email.
export const EMAIL_DOMAIN = 'krishnasmahal.app'
export const usernameToEmail = (u) => `${String(u).trim().toLowerCase()}@${EMAIL_DOMAIN}`

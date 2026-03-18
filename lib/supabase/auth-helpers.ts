import { createServerComponentClient } from './server'
import { createClient } from './client'

// Get current user in Server Components
export async function getCurrentUser() {
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

// Get current profile in Server Components
export async function getCurrentProfile() {
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('ERROR fetching profile:', error)
    console.error('User ID:', user.id)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
  }

  return profile
}

// Sign out (client-side only)
export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  window.location.href = '/'
}

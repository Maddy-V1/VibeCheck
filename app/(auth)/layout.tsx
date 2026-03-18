import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth-helpers'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  // If already authenticated, redirect to dashboard
  if (user) {
    redirect('/dashboard')
  }

  return <>{children}</>
}

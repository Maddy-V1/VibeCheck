import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/supabase/auth-helpers'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile()

  if (!profile?.is_evaluator) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Evaluator Dashboard</h1>
              <p className="text-sm text-gray-500">
                {profile.evaluator_role === 'senior' ? 'Senior' : 'Associate'} Evaluator
              </p>
            </div>
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-6">
      <div className="max-w-md text-center">
        <p className="mb-4 text-7xl font-bold text-zinc-800">404</p>
        <h1 className="mb-2 text-xl font-bold text-white">Page not found</h1>
        <p className="mb-8 text-[13px] text-zinc-500">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="secondary">Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

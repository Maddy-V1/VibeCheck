import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ProfileNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-6">
      <div className="max-w-md text-center">
        <h1 className="mb-3 text-4xl font-bold text-white">404</h1>
        <h2 className="mb-2 text-xl font-semibold text-white">Profile Not Found</h2>
        <p className="mb-6 text-zinc-500">
          This user doesn't exist or their profile isn't available.
        </p>
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    </div>
  )
}

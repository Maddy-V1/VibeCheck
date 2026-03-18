import { createServerComponentClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  Shield,
  Calendar,
  Hash,
  Award,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function VerifyBadgePage({ params }: { params: Promise<{ certId: string }> }) {
  const { certId } = await params
  const supabase = await createServerComponentClient()

  const { data: badge, error } = await supabase
    .from('badges')
    .select(
      `
      *,
      profiles:user_id (username, display_name),
      projects:project_id (id, title, live_url)
    `
    )
    .eq('verification_id', certId)
    .single()

  const isValid = !error && badge && badge.is_valid
  const profile = badge?.profiles as any
  const project = badge?.projects as any

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="w-full max-w-lg">
        {isValid ? (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-8">
            {/* Success */}
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 ring-2 ring-emerald-500/30">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
            </div>

            <h1 className="mb-1 text-center text-2xl font-bold text-white">Badge Verified</h1>
            <p className="mb-8 text-center text-[13px] text-zinc-500">
              This badge is authentic and issued by VibeCheck
            </p>

            {/* Details */}
            <div className="mb-8 space-y-0">
              {[
                {
                  icon: <Shield size={13} />,
                  label: 'Type',
                  value: badge.type === 'project_badge' ? 'Project Badge' : 'Profile Certificate',
                },
                project && { icon: <Award size={13} />, label: 'Project', value: project.title },
                {
                  icon: <User size={13} />,
                  label: 'Recipient',
                  value: `@${profile.username}`,
                  link: `/u/${profile.username}`,
                },
                badge.tier && {
                  icon: <Award size={13} />,
                  label: 'Tier',
                  value: badge.tier.replace('tier', 'Tier '),
                },
                badge.score && {
                  icon: <Award size={13} />,
                  label: 'Score',
                  value: `${badge.score}/100`,
                },
                {
                  icon: <Calendar size={13} />,
                  label: 'Issued',
                  value: new Date(badge.issued_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  }),
                },
                {
                  icon: <Hash size={13} />,
                  label: 'Verification ID',
                  value: badge.verification_id,
                  mono: true,
                },
              ]
                .filter(Boolean)
                .map((item: any) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between border-b border-white/[0.06] py-3 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-600">{item.icon}</span>
                      <span className="text-[12px] text-zinc-500">{item.label}</span>
                    </div>
                    {item.link ? (
                      <Link
                        href={item.link}
                        className="text-[13px] font-medium text-indigo-400 transition-colors hover:text-indigo-300"
                      >
                        {item.value}
                      </Link>
                    ) : (
                      <span
                        className={`text-[13px] font-medium text-white ${item.mono ? 'font-mono text-[11px] text-zinc-500' : ''}`}
                      >
                        {item.value}
                      </span>
                    )}
                  </div>
                ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 sm:flex-row">
              {project && (
                <>
                  <Link href={`/badge/${project.id}`} className="flex-1">
                    <Button className="w-full">View Full Badge</Button>
                  </Link>
                  <a
                    href={project.live_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button variant="secondary" className="w-full">
                      <ExternalLink size={13} className="mr-1.5" /> View Project
                    </Button>
                  </a>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-red-500/20 bg-red-500/[0.03] p-8">
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 ring-2 ring-red-500/30">
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
            </div>

            <h1 className="mb-1 text-center text-2xl font-bold text-white">Badge Not Found</h1>
            <p className="mb-8 text-center text-[13px] text-zinc-500">
              This badge could not be verified. It may have been revoked or the ID is incorrect.
            </p>

            <div className="mb-6 rounded-lg bg-white/[0.03] p-3 text-center">
              <p className="text-[11px] text-zinc-600">
                Verification ID: <span className="font-mono text-zinc-500">{certId}</span>
              </p>
            </div>

            <div className="flex justify-center">
              <Link href="/">
                <Button variant="secondary">Return to Home</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { Notification } from '@/lib/types'
import {
  Bell,
  CheckCircle2,
  Clock,
  Award,
  Star,
  MessageCircle,
  ThumbsUp,
  CheckCheck,
  Sparkles,
  Zap,
  ArrowUpRight,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface NotificationsListProps {
  notifications: Notification[]
}

const NOTIFICATION_ICON: Record<string, typeof Bell> = {
  evaluation_complete: CheckCircle2,
  project_submitted: Zap,
  badge_earned: Award,
  queue_update: Clock,
  score_reveal: Star,
  comment: MessageCircle,
  reaction: ThumbsUp,
}

function getNotificationIcon(type: string) {
  return NOTIFICATION_ICON[type] || Bell
}

function getNotificationAccent(type: string) {
  switch (type) {
    case 'evaluation_complete':
      return {
        icon: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/25',
        glow: 'shadow-[0_0_20px_rgba(16,185,129,0.12)]',
        dot: 'bg-emerald-400',
        line: 'from-emerald-500/40',
      }
    case 'badge_earned':
      return {
        icon: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/25',
        glow: 'shadow-[0_0_20px_rgba(245,158,11,0.12)]',
        dot: 'bg-amber-400',
        line: 'from-amber-500/40',
      }
    case 'score_reveal':
      return {
        icon: 'text-violet-400',
        bg: 'bg-violet-500/10',
        border: 'border-violet-500/25',
        glow: 'shadow-[0_0_20px_rgba(139,92,246,0.12)]',
        dot: 'bg-violet-400',
        line: 'from-violet-500/40',
      }
    case 'comment':
      return {
        icon: 'text-sky-400',
        bg: 'bg-sky-500/10',
        border: 'border-sky-500/25',
        glow: 'shadow-[0_0_20px_rgba(14,165,233,0.12)]',
        dot: 'bg-sky-400',
        line: 'from-sky-500/40',
      }
    case 'reaction':
      return {
        icon: 'text-rose-400',
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/25',
        glow: 'shadow-[0_0_20px_rgba(244,63,94,0.12)]',
        dot: 'bg-rose-400',
        line: 'from-rose-500/40',
      }
    default:
      return {
        icon: 'text-indigo-400',
        bg: 'bg-indigo-500/10',
        border: 'border-indigo-500/25',
        glow: 'shadow-[0_0_20px_rgba(99,102,241,0.12)]',
        dot: 'bg-indigo-400',
        line: 'from-indigo-500/40',
      }
  }
}

function groupByDate(notifications: Notification[]) {
  const groups: { label: string; items: Notification[] }[] = []
  const map = new Map<string, Notification[]>()

  for (const n of notifications) {
    const d = new Date(n.created_at)
    let key: string
    if (isToday(d)) key = 'Today'
    else if (isYesterday(d)) key = 'Yesterday'
    else if (isThisWeek(d)) key = 'This Week'
    else key = format(d, 'MMMM yyyy')

    const existing = map.get(key) ?? []
    existing.push(n)
    map.set(key, existing)
  }

  for (const [label, items] of map) {
    groups.push({ label, items })
  }

  return groups
}

export function NotificationsList({ notifications }: NotificationsListProps) {
  const router = useRouter()
  const [markingAll, setMarkingAll] = useState(false)
  const [localRead, setLocalRead] = useState<Set<string>>(new Set())

  const unreadCount = notifications.filter((n) => !n.is_read && !localRead.has(n.id)).length

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      const supabase = createClient()
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
      if (unreadIds.length > 0) {
        await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
        setLocalRead(new Set(unreadIds))
        router.refresh()
      }
    } catch {
      // silently fail
    } finally {
      setMarkingAll(false)
    }
  }

  const handleMarkRead = async (id: string) => {
    const supabase = createClient()
    setLocalRead((prev) => new Set([...prev, id]))
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  }

  const groups = groupByDate(notifications)

  return (
    <div className="space-y-6">
      {/* Actions bar */}
      {unreadCount > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/[0.06] to-violet-500/[0.04] px-5 py-3.5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="relative flex h-8 w-8 items-center justify-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-indigo-500/20" />
              <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-[11px] font-bold text-indigo-300">
                {unreadCount}
              </span>
            </div>
            <p className="text-[13px] font-medium text-indigo-300">
              unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleMarkAllRead} disabled={markingAll}>
            <CheckCheck size={13} className="mr-1.5" />
            {markingAll ? 'Marking…' : 'Mark all read'}
          </Button>
        </div>
      )}

      {/* Empty state */}
      {notifications.length === 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] p-16 text-center">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 60%)',
            }}
          />
          <div className="relative">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04]">
              <Bell size={22} className="text-zinc-600" />
            </div>
            <p className="text-[15px] font-semibold text-zinc-300">All caught up</p>
            <p className="mx-auto mt-1.5 max-w-xs text-[12px] leading-relaxed text-zinc-600">
              We&apos;ll let you know when something happens — evaluations, badges, comments, and
              more.
            </p>
          </div>
        </div>
      )}

      {/* Timeline */}
      {groups.map((group) => (
        <div key={group.label}>
          {/* Date header */}
          <div className="mb-4 flex items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">
              {group.label}
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-white/[0.08] to-transparent" />
          </div>

          {/* Timeline items */}
          <div className="relative">
            {/* Timeline spine */}
            <div className="absolute bottom-0 left-[19px] top-0 w-px bg-gradient-to-b from-white/[0.08] via-white/[0.05] to-transparent" />

            <div className="space-y-1">
              {group.items.map((notif, i) => {
                const isRead = notif.is_read || localRead.has(notif.id)
                const Icon = getNotificationIcon(notif.type)
                const accent = getNotificationAccent(notif.type)
                const isLast = i === group.items.length - 1

                return (
                  <Link
                    key={notif.id}
                    href={notif.link || '/dashboard'}
                    onClick={() => {
                      if (!isRead) void handleMarkRead(notif.id)
                    }}
                    className={cn(
                      'group relative flex items-start gap-4 rounded-xl py-3 pl-0 pr-4 transition-all duration-200',
                      'hover:bg-white/[0.03]',
                      !isRead && 'bg-white/[0.02]'
                    )}
                  >
                    {/* Timeline node */}
                    <div className="relative z-10 flex w-10 shrink-0 items-center justify-center">
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200',
                          accent.bg,
                          accent.border,
                          !isRead && accent.glow,
                          'group-hover:scale-110'
                        )}
                      >
                        <Icon size={16} className={accent.icon} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 pt-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              'text-[13px] font-medium leading-snug transition-colors',
                              isRead ? 'text-zinc-400' : 'text-white'
                            )}
                          >
                            {notif.title}
                          </p>
                          {notif.body && (
                            <p className="mt-0.5 line-clamp-1 text-[12px] text-zinc-600">
                              {notif.body}
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-2 pt-0.5">
                          {!isRead && (
                            <span className={cn('h-1.5 w-1.5 rounded-full', accent.dot)} />
                          )}
                          <ArrowUpRight
                            size={13}
                            className="text-zinc-700 opacity-0 transition-all group-hover:text-zinc-400 group-hover:opacity-100"
                          />
                        </div>
                      </div>

                      <p className="mt-1 text-[11px] text-zinc-700">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

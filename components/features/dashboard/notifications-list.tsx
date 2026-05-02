'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
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
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface NotificationsListProps {
  notifications: Notification[]
}

const NOTIFICATION_ICON: Record<string, typeof Bell> = {
  evaluation_complete: CheckCircle2,
  project_submitted: Clock,
  badge_earned: Award,
  queue_update: Clock,
  score_reveal: Star,
  comment: MessageCircle,
  reaction: ThumbsUp,
}

function getNotificationIcon(type: string) {
  return NOTIFICATION_ICON[type] || Bell
}

function getNotificationColor(type: string) {
  switch (type) {
    case 'evaluation_complete':
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    case 'badge_earned':
      return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    case 'score_reveal':
      return 'text-violet-400 bg-violet-500/10 border-violet-500/20'
    case 'comment':
      return 'text-sky-400 bg-sky-500/10 border-sky-500/20'
    case 'reaction':
      return 'text-rose-400 bg-rose-500/10 border-rose-500/20'
    default:
      return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
  }
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

  return (
    <div className="space-y-4">
      {/* Actions bar */}
      {unreadCount > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-indigo-500/20 bg-indigo-500/[0.04] px-4 py-3">
          <p className="text-[13px] font-medium text-indigo-400">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
          <Button variant="secondary" size="sm" onClick={handleMarkAllRead} disabled={markingAll}>
            <CheckCheck size={13} className="mr-1.5" />
            {markingAll ? 'Marking…' : 'Mark all read'}
          </Button>
        </div>
      )}

      {/* Notification list */}
      {notifications.length === 0 ? (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-16 text-center">
          <Bell size={28} className="mx-auto mb-3 text-zinc-700" />
          <p className="text-[15px] font-medium text-zinc-400">No notifications yet</p>
          <p className="mt-1 text-[12px] text-zinc-700">
            We&apos;ll let you know when something happens — evaluations, badges, and more.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.08] bg-white/[0.025]">
          {notifications.map((notif) => {
            const isRead = notif.is_read || localRead.has(notif.id)
            const Icon = getNotificationIcon(notif.type)
            const colorClass = getNotificationColor(notif.type)

            return (
              <Link
                key={notif.id}
                href={notif.link || '/dashboard'}
                onClick={() => {
                  if (!isRead) {
                    void handleMarkRead(notif.id)
                  }
                }}
                className={cn(
                  'flex items-start gap-4 p-5 transition-colors hover:bg-white/[0.03]',
                  !isRead && 'bg-indigo-500/[0.03]'
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border',
                    colorClass
                  )}
                >
                  <Icon size={15} />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p
                      className={cn(
                        'text-[13px] font-medium',
                        isRead ? 'text-zinc-400' : 'text-white'
                      )}
                    >
                      {notif.title}
                    </p>
                    {!isRead && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                    )}
                  </div>
                  {notif.body && (
                    <p className="mt-0.5 line-clamp-2 text-[12px] text-zinc-600">{notif.body}</p>
                  )}
                  <p className="mt-1.5 text-[11px] text-zinc-700">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

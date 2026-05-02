'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Profile } from '@/lib/types'
import { cn } from '@/lib/utils/cn'
import LogoutButton from './logout-button'
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  Settings,
  Plus,
  ExternalLink,
  Bell,
} from 'lucide-react'

interface SidebarProps {
  profile: Profile
  isUnlocked: boolean
  unreadCount?: number
}

interface NavItem {
  href: string
  label: string
  icon: typeof LayoutDashboard
  locked?: boolean
  tooltip?: string
}

export function Sidebar({ profile, isUnlocked, unreadCount = 0 }: SidebarProps) {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/projects', label: 'My Projects', icon: FolderOpen },
    { href: '/community', label: 'Community', icon: Users },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-white/[0.07] lg:bg-zinc-950">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 border-b border-white/[0.07] px-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-500/10 ring-1 ring-indigo-500/25">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#818CF8"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-[14px] font-bold text-white">VibeCheck</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {/* Submit Project CTA */}
          <Link
            href="/dashboard/submit"
            className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-indigo-400 active:scale-[0.97]"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Submit Project</span>
          </Link>

          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const isLocked = false
            const Icon = item.icon

            return (
              <div key={item.href} className="group relative">
                <Link
                  href={isLocked ? '#' : item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                    isActive && !isLocked
                      ? 'bg-white/[0.06] text-white'
                      : isLocked
                        ? 'cursor-not-allowed text-zinc-700'
                        : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300'
                  )}
                  onClick={(e) => isLocked && e.preventDefault()}
                >
                  <Icon size={16} strokeWidth={1.8} />
                  <span>{item.label}</span>
                  {isLocked && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ml-auto opacity-50"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                  )}
                </Link>
                {isLocked && item.tooltip && (
                  <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-white/[0.08] bg-zinc-800 px-3 py-1.5 text-[11px] text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100">
                    {item.tooltip}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div className="space-y-2 border-t border-white/[0.07] p-3">
          {/* Notifications */}
          <Link
            href="/dashboard/notifications"
            className={cn(
              'flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
              pathname === '/dashboard/notifications'
                ? 'bg-white/[0.06] text-white'
                : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300'
            )}
          >
            <div className="flex items-center gap-3">
              <Bell size={16} strokeWidth={1.8} />
              <span>Notifications</span>
            </div>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-500 px-1.5 text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          {/* View Public Profile */}
          {isUnlocked && profile.is_profile_public && (
            <Link
              href={`/u/${profile.username}`}
              target="_blank"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-zinc-300"
            >
              <ExternalLink size={14} strokeWidth={1.8} />
              <span>Public Profile</span>
            </Link>
          )}

          {/* User info */}
          <div className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[11px] font-bold text-white">
              {profile.display_name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-white">
                {profile.display_name || 'User'}
              </p>
              <p className="truncate text-[11px] text-zinc-600">@{profile.username}</p>
            </div>
          </div>

          <LogoutButton />
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="safe-area-pb fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.07] bg-zinc-950/95 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-around px-2 py-1.5">
          {navItems
            .filter((item) => !item.locked)
            .map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href))
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex min-w-[56px] flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors',
                    isActive ? 'text-indigo-400' : 'text-zinc-600'
                  )}
                >
                  <Icon size={18} strokeWidth={1.8} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          {/* Mobile submit button */}
          <Link
            href="/dashboard/submit"
            className="flex min-w-[56px] flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-medium text-indigo-400"
          >
            <Plus size={18} strokeWidth={2} />
            <span>Submit</span>
          </Link>
        </div>
      </nav>
    </>
  )
}

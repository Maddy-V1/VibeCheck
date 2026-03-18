'use client'

import { useState } from 'react'
import { Profile } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Trash2, Download, AlertTriangle } from 'lucide-react'

interface SettingsDangerZoneProps {
  profile: Profile
}

export function SettingsDangerZone({ profile }: SettingsDangerZoneProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    // TODO: Implement account deletion via API route
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsDeleting(false)
  }

  return (
    <section className="rounded-xl border border-red-500/15 bg-red-500/[0.03]">
      <div className="border-b border-red-500/10 p-5">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-red-400" />
          <h2 className="text-[15px] font-semibold text-white">Danger Zone</h2>
        </div>
        <p className="mt-0.5 text-[12px] text-zinc-600">Irreversible and destructive actions</p>
      </div>

      <div className="space-y-3 p-5">
        {/* Delete Account */}
        <div className="flex items-center justify-between rounded-lg border border-red-500/15 bg-white/[0.02] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
              <Trash2 size={14} className="text-red-400" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-white">Delete Account</p>
              <p className="text-[11px] text-zinc-600">
                Permanently delete your account and all data
              </p>
            </div>
          </div>
          {!showDeleteConfirm ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="!border-red-500/30 !text-red-400 hover:!bg-red-500/10"
            >
              Delete
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting…' : 'Confirm'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Export Data */}
        <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04]">
              <Download size={14} className="text-zinc-500" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-white">Export Your Data</p>
              <p className="text-[11px] text-zinc-600">
                Download all your projects, evaluations, and profile data
              </p>
            </div>
          </div>
          <Button variant="secondary" size="sm">
            Export
          </Button>
        </div>
      </div>
    </section>
  )
}

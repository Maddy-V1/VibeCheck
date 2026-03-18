'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface QueueData {
  position: number
  estimated_days: number
}

export function useQueuePosition(projectId: string | null, initialData: QueueData | null) {
  const [queueData, setQueueData] = useState<QueueData | null>(initialData)
  const supabase = createClient()

  useEffect(() => {
    if (!projectId) return

    const channel = supabase
      .channel(`queue-tracker-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'queue',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            // Project left queue — evaluation started or complete
            setQueueData(null)
          } else if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setQueueData({
              position: payload.new.position,
              estimated_days: payload.new.estimated_days,
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId, supabase])

  return queueData
}

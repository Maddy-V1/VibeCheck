# 05 — Queue System

> Agent scope: Queue logic, position display, realtime updates, ETA calculation.
> Read `00-PROJECT-OVERVIEW.md` and `01-DATABASE-SCHEMA.md` first.

---

## Queue Rules

1. **Priority plan** always sits above **free plan** — regardless of submission time
2. **Within same plan**: FIFO — first submitted, first evaluated (ordered by `entered_at ASC`)
3. When a project is removed from queue (evaluation starts), all positions below it shift up by 1
4. Queue position updates in real-time via Supabase Realtime

---

## Queue Lifecycle

```
Project submitted
  → INSERT into queue table (DB trigger assigns position)
  → project.status = 'in_queue'

Evaluator picks up project
  → queue.assigned_to = evaluator_id
  → queue.assigned_at = now()
  → project.status = 'evaluating'

Evaluation complete
  → DELETE from queue
  → project.status = 'evaluated'
  → All lower positions shift up (trigger)
  → Notifications + emails fire
```

---

## Position Shift Trigger

```sql
-- When a project is removed from queue, shift remaining positions
CREATE OR REPLACE FUNCTION shift_queue_positions()
RETURNS trigger AS $$
BEGIN
  UPDATE queue
  SET position = position - 1
  WHERE position > OLD.position;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_queue_delete
  AFTER DELETE ON queue
  FOR EACH ROW EXECUTE FUNCTION shift_queue_positions();
```

---

## ETA Calculation

```typescript
// lib/utils/queue.ts

const EVALUATIONS_PER_DAY = 30 // Phase 1 team capacity

export function calculateETA(position: number, plan: 'free' | 'priority'): number {
  // Priority users: position already accounts for their placement above free
  // Just divide position by daily throughput
  return Math.ceil(position / EVALUATIONS_PER_DAY)
}

// Update estimated_days for all queue entries
// Run this as a cron job or after every queue change
export async function refreshQueueETAs(supabase: any) {
  const { data: queueEntries } = await supabase
    .from('queue')
    .select('id, position, plan')
    .order('position', { ascending: true })

  for (const entry of queueEntries ?? []) {
    await supabase
      .from('queue')
      .update({ estimated_days: calculateETA(entry.position, entry.plan) })
      .eq('id', entry.id)
  }
}
```

---

## Realtime Subscription

```typescript
// hooks/useQueuePosition.ts
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useQueuePosition(projectId: string, initialData: { position: number; estimated_days: number } | null) {
  const [queueData, setQueueData] = useState(initialData)
  const supabase = createClient()

  useEffect(() => {
    if (!projectId) return

    const channel = supabase
      .channel(`queue-tracker-${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'queue',
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        if (payload.eventType === 'DELETE') {
          // Project left queue — evaluation started or complete
          setQueueData(null)
        } else {
          setQueueData({
            position: payload.new.position,
            estimated_days: payload.new.estimated_days,
          })
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [projectId])

  return queueData
}
```

---

## Admin: Queue Management View

The evaluator dashboard (see `06-EVALUATOR-DASHBOARD.md`) shows a live queue view:

```
┌──────────────────────────────────────────────────────────────────┐
│  Evaluation Queue                          [Refresh] [My Queue]  │
├────┬──────────────────────┬────────┬───────┬───────┬────────────┤
│ #  │ Project              │ Tier   │ Plan  │ Days  │ Action     │
├────┼──────────────────────┼────────┼───────┼───────┼────────────┤
│ 1  │ My SaaS App          │ Tier 2 │ ⚡PRI │  1d   │ [Evaluate] │
│ 2  │ AI Writing Tool      │ Tier 3 │ ⚡PRI │  1d   │ [Evaluate] │
│ 3  │ Todo App v2          │ Tier 1 │ FREE  │  3d   │ [Evaluate] │
│ 4  │ Portfolio Builder    │ Tier 2 │ FREE  │  3d   │ [Evaluate] │
└────┴──────────────────────┴────────┴───────┴───────┴────────────┘
```

---

## API Routes

### GET `/api/queue/position/[projectId]`
Returns current position and ETA for a project. Used for server-side initial load.

### POST `/api/queue/assign`
Evaluator picks up a project. Sets `assigned_to` and changes project status to `evaluating`.
Protected: evaluator role only.

### DELETE `/api/queue/[projectId]`
Remove from queue when evaluation completes. Triggered internally by evaluation submission.
Protected: evaluator role only.

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

interface EvaluationFormData {
  tier_confirmed: 'tier1' | 'tier2' | 'tier3'
  score_functionality: number
  score_ux: number
  score_complexity: number
  score_deployment: number
  score_code_quality: number
  score_documentation: number
  score_originality: number
  reviewer_note: string
  internal_notes: string
}

export default function EvaluatePage({ params }: { params: Promise<{ projectId: string }> }) {
  const router = useRouter()
  const [projectId, setProjectId] = useState<string | null>(null)
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<EvaluationFormData>({
    tier_confirmed: 'tier2',
    score_functionality: 0,
    score_ux: 0,
    score_complexity: 0,
    score_deployment: 0,
    score_code_quality: 0,
    score_documentation: 0,
    score_originality: 0,
    reviewer_note: '',
    internal_notes: '',
  })

  // Unwrap params promise
  useEffect(() => {
    params.then((p) => setProjectId(p.projectId))
  }, [params])

  // Fetch project when projectId is available
  useEffect(() => {
    if (projectId) {
      fetchProject()
    }
  }, [projectId])

  const fetchProject = async () => {
    if (!projectId) return

    try {
      const res = await fetch(`/api/admin/projects/${projectId}`)
      if (!res.ok) throw new Error('Failed to fetch project')
      const data = await res.json()
      setProject(data)
      setFormData((prev) => ({
        ...prev,
        tier_confirmed: data.tier,
      }))
    } catch (err) {
      setError('Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  const calculateTotal = () => {
    return (
      formData.score_functionality +
      formData.score_ux +
      formData.score_complexity +
      formData.score_deployment +
      formData.score_code_quality +
      formData.score_documentation +
      formData.score_originality
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectId) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/evaluations/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          ...formData,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit evaluation')
      }

      router.push('/admin')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading project...</p>
      </div>
    )
  }

  if (error && !project) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  const total = calculateTotal()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.push('/admin')} className="mb-4">
          ← Back to Queue
        </Button>

        <div className="rounded-lg border bg-white p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
              <p className="text-sm text-gray-500">by @{project.profiles?.username}</p>
            </div>
            <Badge variant="outline">{project.tier?.replace('tier', 'Tier ')}</Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-gray-500">Live URL</p>
              <a
                href={project.live_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                View Live →
              </a>
            </div>
            {project.github_url && (
              <div>
                <p className="text-xs text-gray-500">GitHub</p>
                <a
                  href={project.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  View Code →
                </a>
              </div>
            )}
            {project.demo_video_url && (
              <div>
                <p className="text-xs text-gray-500">Demo Video</p>
                <a
                  href={project.demo_video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Watch →
                </a>
              </div>
            )}
          </div>

          <div className="mt-4">
            <p className="text-xs text-gray-500">Description</p>
            <p className="text-sm text-gray-700">{project.description}</p>
          </div>

          {project.tech_stack && project.tech_stack.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-500">Tech Stack</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {project.tech_stack.map((tech: string) => (
                  <Badge key={tech} variant="secondary">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border bg-white p-6">
        <h2 className="mb-6 text-xl font-semibold text-gray-900">Evaluation Scoring</h2>

        <div className="space-y-4">
          <ScoreInput
            label="Functionality & Problem Solving"
            max={25}
            value={formData.score_functionality}
            onChange={(val) => setFormData({ ...formData, score_functionality: val })}
          />
          <ScoreInput
            label="UX & Design Quality"
            max={20}
            value={formData.score_ux}
            onChange={(val) => setFormData({ ...formData, score_ux: val })}
          />
          <ScoreInput
            label="Technical Complexity (relative to tier)"
            max={20}
            value={formData.score_complexity}
            onChange={(val) => setFormData({ ...formData, score_complexity: val })}
          />
          <ScoreInput
            label="Deployment & Liveness"
            max={10}
            value={formData.score_deployment}
            onChange={(val) => setFormData({ ...formData, score_deployment: val })}
          />
          <ScoreInput
            label="Code & Prompt Quality"
            max={10}
            value={formData.score_code_quality}
            onChange={(val) => setFormData({ ...formData, score_code_quality: val })}
          />
          <ScoreInput
            label="Documentation & Presentation"
            max={8}
            value={formData.score_documentation}
            onChange={(val) => setFormData({ ...formData, score_documentation: val })}
          />
          <ScoreInput
            label="Originality & Creativity"
            max={7}
            value={formData.score_originality}
            onChange={(val) => setFormData({ ...formData, score_originality: val })}
          />
        </div>

        <div className="mt-6 rounded-lg bg-gray-50 p-4">
          <p className="text-lg font-semibold text-gray-900">Total: {total} / 100</p>
        </div>

        <div className="mt-6">
          <Label>Tier Confirmation</Label>
          <div className="mt-2 flex gap-4">
            {(['tier1', 'tier2', 'tier3'] as const).map((tier) => (
              <label key={tier} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="tier"
                  value={tier}
                  checked={formData.tier_confirmed === tier}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tier_confirmed: e.target.value as any,
                    })
                  }
                  className="h-4 w-4"
                />
                <span className="text-sm">{tier.replace('tier', 'Tier ')}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <Label htmlFor="reviewer_note">Reviewer Note (shown to user — 50-500 chars)</Label>
          <Textarea
            id="reviewer_note"
            value={formData.reviewer_note}
            onChange={(e) => setFormData({ ...formData, reviewer_note: e.target.value })}
            placeholder="Write 2-3 sentences of real feedback for the user..."
            className="mt-2"
            rows={4}
            required
            minLength={50}
            maxLength={500}
          />
          <p className="mt-1 text-xs text-gray-500">
            {formData.reviewer_note.length} / 500 characters
          </p>
        </div>

        <div className="mt-6">
          <Label htmlFor="internal_notes">Internal Notes (team only — not shown to user)</Label>
          <Textarea
            id="internal_notes"
            value={formData.internal_notes}
            onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
            placeholder="Optional internal notes..."
            className="mt-2"
            rows={3}
          />
        </div>

        {error && <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>}

        <div className="mt-6 flex gap-4">
          <Button type="submit" disabled={submitting || total > 100}>
            {submitting ? 'Submitting...' : 'Submit Evaluation'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/admin')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}

function ScoreInput({
  label,
  max,
  value,
  onChange,
}: {
  label: string
  max: number
  value: number
  onChange: (val: number) => void
}) {
  return (
    <div className="flex items-center gap-4">
      <Label className="w-64 text-sm">{label}</Label>
      <Input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-24"
        required
      />
      <span className="text-sm text-gray-500">/ {max}</span>
    </div>
  )
}

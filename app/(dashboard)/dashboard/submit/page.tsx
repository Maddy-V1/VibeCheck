'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { projectSubmissionSchema, type ProjectSubmissionInput } from '@/lib/validations/project'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils/cn'
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react'

type FormData = Omit<
  ProjectSubmissionInput,
  'confirmed_live' | 'confirmed_own' | 'confirmed_guidelines'
>

const TIER_CONFIG = {
  tier1: {
    name: 'Tier 1',
    subtitle: 'Foundational',
    color: 'emerald-400',
    borderColor: 'border-emerald-500/40',
    bgColor: 'bg-emerald-500/10',
    glowColor: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
    examples: ['To-do apps', 'Landing pages', 'Basic CRUD', 'Simple tools'],
  },
  tier2: {
    name: 'Tier 2',
    subtitle: 'Builder',
    color: 'sky-400',
    borderColor: 'border-sky-500/40',
    bgColor: 'bg-sky-500/10',
    glowColor: 'shadow-[0_0_20px_rgba(14,165,233,0.15)]',
    examples: ['Full-stack apps', 'Auth systems', 'API integrations', 'SaaS MVPs'],
  },
  tier3: {
    name: 'Tier 3',
    subtitle: 'Architect',
    color: 'violet-400',
    borderColor: 'border-violet-500/40',
    bgColor: 'bg-violet-500/10',
    glowColor: 'shadow-[0_0_20px_rgba(139,92,246,0.15)]',
    examples: ['AI tools', 'Dev platforms', 'Open source libs', 'Complex systems'],
  },
}

const COMMON_TECH = [
  'React',
  'Next.js',
  'TypeScript',
  'Node.js',
  'Python',
  'PostgreSQL',
  'MongoDB',
  'Tailwind CSS',
  'Express',
  'FastAPI',
  'Supabase',
  'Firebase',
  'AWS',
  'Vercel',
]

export default function SubmitProjectPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [urlWarning, setUrlWarning] = useState('')
  const [isCheckingUrl, setIsCheckingUrl] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [queueData, setQueueData] = useState<{
    position: number
    estimatedDays: number
    projectTitle: string
    tier: string
  } | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    mode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      live_url: '',
      github_url: '',
      demo_video_url: '',
      tech_stack: [],
    },
  })

  const selectedTier = watch('tier')
  const title = watch('title') || ''
  const description = watch('description') || ''
  const liveUrl = watch('live_url')
  const techStack = watch('tech_stack') || []
  const [confirmedLive, setConfirmedLive] = useState(false)
  const [confirmedOwn, setConfirmedOwn] = useState(false)
  const [confirmedGuidelines, setConfirmedGuidelines] = useState(false)

  const checkUrl = async (url: string) => {
    if (!url) return
    setIsCheckingUrl(true)
    setUrlWarning('')

    try {
      const response = await fetch('/api/check-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await response.json()

      if (!data.reachable) {
        setUrlWarning("We couldn't reach this URL — make sure it's publicly accessible.")
      }
    } catch (error) {
      setUrlWarning("We couldn't reach this URL — make sure it's publicly accessible.")
    } finally {
      setIsCheckingUrl(false)
    }
  }

  const toggleTech = (tech: string) => {
    const current = techStack
    if (current.includes(tech)) {
      setValue(
        'tech_stack',
        current.filter((t) => t !== tech)
      )
    } else {
      setValue('tech_stack', [...current, tech])
    }
  }

  const onSubmit = async (data: FormData) => {
    // Check confirmation checkboxes first
    if (!confirmedLive || !confirmedOwn || !confirmedGuidelines) {
      alert('Please confirm all three checkboxes before submitting')
      return
    }

    setIsSubmitting(true)

    try {
      // Validate with zod before submitting
      const validationResult = projectSubmissionSchema.safeParse({
        ...data,
        confirmed_live: true,
        confirmed_own: true,
        confirmed_guidelines: true,
      })

      if (!validationResult.success) {
        console.error('Validation errors:', validationResult.error.flatten())
        const errors = validationResult.error.flatten()
        const errorMessages = Object.entries(errors.fieldErrors)
          .map(([field, msgs]) => `${field}: ${msgs?.join(', ')}`)
          .join('\n')
        alert(`Please check all required fields:\n\n${errorMessages}`)
        setIsSubmitting(false)
        return
      }

      console.log('Submitting data:', validationResult.data)

      const response = await fetch('/api/projects/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validationResult.data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Submission error:', errorData)
        alert(
          `Failed to submit project: ${errorData.details || errorData.error || 'Unknown error'}`
        )
        setIsSubmitting(false)
        return
      }

      const result = await response.json()

      setQueueData({
        position: result.queue_position,
        estimatedDays: result.estimated_days,
        projectTitle: data.title,
        tier: data.tier,
      })
      setShowConfirmation(true)
    } catch (error) {
      console.error('Submission error:', error)
      alert(
        `Failed to submit project: ${error instanceof Error ? error.message : 'Please try again.'}`
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceedStep1 = title.length >= 3 && description.length >= 50 && selectedTier
  const canProceedStep2 = liveUrl && liveUrl.length > 0

  if (showConfirmation && queueData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10"
          >
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-2 text-3xl font-bold text-white"
          >
            You're in the queue!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-2 text-zinc-400"
          >
            {queueData.projectTitle}
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-8 text-sm text-zinc-600"
          >
            {TIER_CONFIG[queueData.tier as keyof typeof TIER_CONFIG].name} —{' '}
            {TIER_CONFIG[queueData.tier as keyof typeof TIER_CONFIG].subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8 rounded-xl border border-white/[0.08] bg-white/[0.025] p-8"
          >
            <p className="mb-3 text-xs uppercase tracking-widest text-zinc-500">Queue Position</p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mb-4 text-6xl font-bold text-indigo-400"
            >
              #{queueData.position}
            </motion.p>
            <p className="text-sm text-zinc-500">Estimated: ~{queueData.estimatedDays} days</p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mb-6 text-sm text-zinc-500"
          >
            We'll notify you by email and in-app when your evaluation is ready.
          </motion.p>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}>
            <Button onClick={() => router.push('/dashboard')} size="lg">
              View My Dashboard
            </Button>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-6 py-12">
      <div className="mb-8">
        <h1 className="mb-1 text-2xl font-bold tracking-tight text-white">Submit a Project</h1>
        <p className="text-[13px] text-zinc-500">Get your work evaluated and earn your badge</p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-12">
        <div className="mb-3 flex items-center justify-between">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex flex-1 items-center">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all',
                  step >= s
                    ? 'bg-indigo-500 text-white'
                    : 'border border-white/[0.1] bg-white/[0.04] text-zinc-600'
                )}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={cn(
                    'mx-2 h-0.5 flex-1 transition-all',
                    step > s ? 'bg-indigo-500' : 'bg-white/[0.08]'
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-zinc-600">
          <span>Basics</span>
          <span>Links</span>
          <span>Confirm</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-[13px] font-medium text-zinc-300">
                  Project Title <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="My Awesome Project"
                  maxLength={100}
                />
                <div className="flex items-center justify-between">
                  {errors.title ? (
                    <p className="text-xs text-red-400">{errors.title.message}</p>
                  ) : (
                    <p className="text-xs text-zinc-600">
                      A clear, descriptive name for your project
                    </p>
                  )}
                  <p className="text-xs text-zinc-700">{title.length}/100</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-[13px] font-medium text-zinc-300">
                  Description <span className="text-red-400">*</span>
                </Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="What does it do and why did you build it?"
                  rows={6}
                  maxLength={1000}
                  className=""
                />
                <div className="flex items-center justify-between">
                  {errors.description ? (
                    <p className="text-xs text-red-400">{errors.description.message}</p>
                  ) : (
                    <p className="text-xs text-zinc-600">
                      Tell us about your project (50-1000 characters)
                    </p>
                  )}
                  <p
                    className={cn(
                      'text-xs',
                      description.length < 50
                        ? 'text-zinc-700'
                        : description.length > 1000
                          ? 'text-red-400'
                          : 'text-emerald-400'
                    )}
                  >
                    {description.length}/1000
                  </p>
                </div>
              </div>

              {/* Tier Selection */}
              <div className="space-y-3">
                <Label className="text-[13px] font-medium text-zinc-300">
                  Select Tier <span className="text-red-400">*</span>
                </Label>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.entries(TIER_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setValue('tier', key as any)}
                      className={cn(
                        'relative rounded-xl border-2 p-6 text-left transition-all hover:scale-[1.02]',
                        selectedTier === key
                          ? `${config.borderColor} ${config.bgColor} ${config.glowColor}`
                          : 'border-white/[0.08] bg-white/[0.025] hover:border-white/[0.15]'
                      )}
                    >
                      <div className="mb-4">
                        <h3 className="mb-1 text-lg font-bold text-white">{config.name}</h3>
                        <p className={cn('text-sm font-semibold', `text-${config.color}`)}>
                          {config.subtitle}
                        </p>
                      </div>
                      <ul className="space-y-1.5">
                        {config.examples.map((example) => (
                          <li key={example} className="flex items-start text-xs text-zinc-600">
                            <span className="mr-2">•</span>
                            <span>{example}</span>
                          </li>
                        ))}
                      </ul>
                      {selectedTier === key && (
                        <motion.div
                          layoutId="tier-check"
                          className="absolute right-4 top-4"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <CheckCircle2 className={cn('h-6 w-6', `text-${config.color}`)} />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
                {errors.tier && <p className="text-xs text-red-400">{errors.tier.message}</p>}
                <p className="text-xs italic text-zinc-700">
                  Not sure? Pick the one that feels right — our evaluator may adjust it.
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                  size="lg"
                >
                  Next: Links
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Live URL */}
              <div className="space-y-1.5">
                <Label htmlFor="live_url" className="text-[13px] font-medium text-zinc-300">
                  Live URL <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="live_url"
                  {...register('live_url')}
                  placeholder="https://myproject.com"
                  onBlur={(e) => checkUrl(e.target.value)}
                />
                {isCheckingUrl && (
                  <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Checking URL...
                  </p>
                )}
                {urlWarning && (
                  <p className="flex items-start gap-1.5 text-xs text-amber-500">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                    <span>{urlWarning}</span>
                  </p>
                )}
                {errors.live_url && (
                  <p className="text-xs text-red-400">{errors.live_url.message}</p>
                )}
                {!errors.live_url && !urlWarning && !isCheckingUrl && (
                  <p className="text-xs text-zinc-600">Where can we see your project live?</p>
                )}
              </div>

              {/* GitHub URL */}
              <div className="space-y-1.5">
                <Label htmlFor="github_url" className="text-[13px] font-medium text-zinc-300">
                  GitHub URL <span className="text-zinc-600">(optional)</span>
                </Label>
                <Input
                  id="github_url"
                  {...register('github_url')}
                  placeholder="https://github.com/username/repo"
                />
                {errors.github_url && (
                  <p className="text-xs text-red-400">{errors.github_url.message}</p>
                )}
                {!errors.github_url && (
                  <p className="text-xs text-zinc-600">Link to your source code</p>
                )}
              </div>

              {/* Demo Video */}
              <div className="space-y-1.5">
                <Label htmlFor="demo_video_url" className="text-[13px] font-medium text-zinc-300">
                  Demo Video <span className="text-zinc-600">(optional)</span>
                </Label>
                <Input
                  id="demo_video_url"
                  {...register('demo_video_url')}
                  placeholder="https://youtube.com/watch?v=... or https://loom.com/..."
                />
                {errors.demo_video_url && (
                  <p className="text-xs text-red-400">{errors.demo_video_url.message}</p>
                )}
                {!errors.demo_video_url && (
                  <p className="text-xs text-zinc-600">YouTube or Loom link to a walkthrough</p>
                )}
              </div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!canProceedStep2}
                  size="lg"
                >
                  Next: Confirm
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Tech Stack */}
              <div className="space-y-3">
                <Label className="text-[13px] font-medium text-zinc-300">
                  Tech Stack <span className="text-zinc-600">(optional but encouraged)</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_TECH.map((tech) => (
                    <button
                      key={tech}
                      type="button"
                      onClick={() => toggleTech(tech)}
                      className={cn(
                        'rounded-badge px-3 py-1.5 text-xs font-medium transition-all',
                        techStack.includes(tech)
                          ? 'border border-indigo-500 bg-indigo-500 text-white'
                          : 'border border-white/[0.1] bg-white/[0.04] text-zinc-400 hover:border-indigo-500/30'
                      )}
                    >
                      {tech}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-zinc-600">Select all that apply or add your own below</p>
              </div>

              {/* Confirmation Checkboxes */}
              <div className="space-y-4 rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
                <p className="mb-3 text-[13px] font-semibold text-white">Before you submit</p>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="confirmed_live"
                    checked={confirmedLive}
                    onCheckedChange={(checked) => setConfirmedLive(checked as boolean)}
                  />
                  <label
                    htmlFor="confirmed_live"
                    className="cursor-pointer text-[13px] leading-tight text-zinc-400"
                  >
                    My project is live and publicly accessible
                  </label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="confirmed_own"
                    checked={confirmedOwn}
                    onCheckedChange={(checked) => setConfirmedOwn(checked as boolean)}
                  />
                  <label
                    htmlFor="confirmed_own"
                    className="cursor-pointer text-[13px] leading-tight text-zinc-400"
                  >
                    I built this project (with or without AI tools)
                  </label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="confirmed_guidelines"
                    checked={confirmedGuidelines}
                    onCheckedChange={(checked) => setConfirmedGuidelines(checked as boolean)}
                  />
                  <label
                    htmlFor="confirmed_guidelines"
                    className="cursor-pointer text-[13px] leading-tight text-zinc-400"
                  >
                    I have read and agree to the evaluation guidelines
                  </label>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={!confirmedLive || !confirmedOwn || !confirmedGuidelines || isSubmitting}
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Project'
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  )
}

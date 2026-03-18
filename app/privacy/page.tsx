import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy — VibeCheck',
  description: 'Privacy Policy for the VibeCheck platform.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-[12px] text-zinc-600 transition-colors hover:text-zinc-400"
        >
          <ArrowLeft size={13} /> Back to Home
        </Link>

        <h1 className="mb-2 text-3xl font-bold tracking-tight text-white">Privacy Policy</h1>
        <p className="mb-8 text-[13px] text-zinc-500">Last updated: March 2026</p>

        <div className="space-y-6">
          <Section title="1. Information We Collect">
            <ul className="list-disc space-y-1 pl-4 text-zinc-400">
              <li>
                <strong className="text-zinc-300">Account data:</strong> Email address, display
                name, username, and optional profile information (bio, GitHub, LinkedIn).
              </li>
              <li>
                <strong className="text-zinc-300">Project data:</strong> Project titles,
                descriptions, URLs, tech stack, and evaluation results.
              </li>
              <li>
                <strong className="text-zinc-300">Usage data:</strong> Pages visited, features used,
                and interaction patterns (via Posthog analytics).
              </li>
              <li>
                <strong className="text-zinc-300">OAuth data:</strong> If you sign in with Google,
                GitHub, or LinkedIn, we receive your name, email, and avatar from those services.
              </li>
            </ul>
          </Section>

          <Section title="2. How We Use Your Information">
            <ul className="list-disc space-y-1 pl-4 text-zinc-400">
              <li>To provide and maintain the Platform's services.</li>
              <li>To process project evaluations and issue badges/certificates.</li>
              <li>To display your public profile and project evaluations (when you opt in).</li>
              <li>To send transactional emails (evaluation results, queue updates).</li>
              <li>To improve the Platform through anonymized usage analytics.</li>
            </ul>
          </Section>

          <Section title="3. Data Sharing">
            We do not sell your personal information. We may share data with:
            <ul className="mt-2 list-disc space-y-1 pl-4 text-zinc-400">
              <li>
                <strong className="text-zinc-300">Service providers:</strong> Supabase (database),
                Vercel (hosting), Resend (email).
              </li>
              <li>
                <strong className="text-zinc-300">Public profiles:</strong> If you enable your
                public profile, your display name, username, bio, and evaluated project scores are
                visible to anyone.
              </li>
              <li>
                <strong className="text-zinc-300">Legal requirements:</strong> If required by law or
                to protect our rights.
              </li>
            </ul>
          </Section>

          <Section title="4. Data Security">
            We use industry-standard security measures including encrypted connections (HTTPS),
            Supabase Row Level Security (RLS), and secure authentication via Supabase Auth.
          </Section>

          <Section title="5. Your Rights">
            <ul className="list-disc space-y-1 pl-4 text-zinc-400">
              <li>
                <strong className="text-zinc-300">Access:</strong> You can view all your data in
                Settings.
              </li>
              <li>
                <strong className="text-zinc-300">Export:</strong> You can export your data from the
                Settings page.
              </li>
              <li>
                <strong className="text-zinc-300">Delete:</strong> You can delete your account and
                all associated data from Settings.
              </li>
              <li>
                <strong className="text-zinc-300">Visibility:</strong> You control whether your
                profile is public or private.
              </li>
            </ul>
          </Section>

          <Section title="6. Cookies">
            We use essential cookies for authentication and session management. Analytics cookies
            (Posthog) are used to understand Platform usage. You can disable analytics cookies in
            your browser settings.
          </Section>

          <Section title="7. Children's Privacy">
            The Platform is not intended for children under 13. We do not knowingly collect
            information from children under 13.
          </Section>

          <Section title="8. Changes to This Policy">
            We may update this Privacy Policy periodically. We will notify you of significant
            changes via email or in-app notification.
          </Section>

          <Section title="9. Contact">
            For privacy concerns, contact us at{' '}
            <a
              href="mailto:privacy@vibecheck.app"
              className="text-indigo-400 transition-colors hover:text-indigo-300"
            >
              privacy@vibecheck.app
            </a>
            .
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 text-[15px] font-semibold text-white">{title}</h2>
      <div className="text-[13px] leading-relaxed text-zinc-400">{children}</div>
    </div>
  )
}

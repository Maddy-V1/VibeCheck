import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service — VibeCheck',
  description: 'Terms of Service for the VibeCheck platform.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-[12px] text-zinc-600 transition-colors hover:text-zinc-400"
        >
          <ArrowLeft size={13} /> Back to Home
        </Link>

        <h1 className="mb-2 text-3xl font-bold tracking-tight text-white">Terms of Service</h1>
        <p className="mb-8 text-[13px] text-zinc-500">Last updated: March 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-6">
          <Section title="1. Acceptance of Terms">
            By accessing or using VibeCheck ("the Platform"), you agree to be bound by these Terms
            of Service. If you do not agree to these terms, do not use the Platform.
          </Section>

          <Section title="2. Description of Service">
            VibeCheck is a platform where developers who build with AI tools can submit their
            projects for professional evaluation. The Platform provides project evaluation, scoring,
            badge issuance, certificate generation, and public portfolio features.
          </Section>

          <Section title="3. User Accounts">
            <ul className="list-disc space-y-1 pl-4 text-zinc-400">
              <li>You must provide accurate information when creating an account.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must be at least 13 years old to use the Platform.</li>
              <li>One account per person — duplicate accounts may be terminated.</li>
            </ul>
          </Section>

          <Section title="4. Project Submissions">
            <ul className="list-disc space-y-1 pl-4 text-zinc-400">
              <li>You must own or have the right to submit any project you upload.</li>
              <li>Projects must be publicly accessible at the time of evaluation.</li>
              <li>We reserve the right to reject submissions that violate community guidelines.</li>
              <li>
                Evaluations are subjective assessments and should not be considered as definitive
                measures of quality.
              </li>
            </ul>
          </Section>

          <Section title="5. Badges and Certificates">
            Badges and certificates are issued based on evaluator assessments. They represent a
            point-in-time evaluation and may be revoked if fraud or misrepresentation is discovered.
          </Section>

          <Section title="6. Prohibited Conduct">
            <ul className="list-disc space-y-1 pl-4 text-zinc-400">
              <li>Submitting projects you did not build or contribute to.</li>
              <li>Manipulating evaluation scores or queue positions.</li>
              <li>Harassing other users or evaluators.</li>
              <li>Using the Platform for any illegal purpose.</li>
              <li>Attempting to gain unauthorized access to the Platform's systems.</li>
            </ul>
          </Section>

          <Section title="7. Intellectual Property">
            You retain ownership of your submitted projects. By submitting, you grant VibeCheck a
            license to display your project information, scores, and badges on the Platform and in
            promotional materials.
          </Section>

          <Section title="8. Limitation of Liability">
            The Platform is provided "as is" without warranties of any kind. VibeCheck shall not be
            liable for any indirect, incidental, special, or consequential damages arising from your
            use of the Platform.
          </Section>

          <Section title="9. Changes to Terms">
            We may update these Terms from time to time. Continued use of the Platform after changes
            constitutes acceptance of the new Terms.
          </Section>

          <Section title="10. Contact">
            For questions about these Terms, contact us at{' '}
            <a
              href="mailto:legal@vibecheck.app"
              className="text-indigo-400 transition-colors hover:text-indigo-300"
            >
              legal@vibecheck.app
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

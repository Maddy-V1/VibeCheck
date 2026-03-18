'use client'

import Link from 'next/link'

export function BrandPanel() {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden border-r border-white/[0.06] bg-zinc-950 p-10 lg:flex lg:w-[45%] xl:p-12">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 20% 50%, rgba(99,102,241,0.08) 0%, transparent 60%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* Logo */}
      <div className="relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 transition-opacity hover:opacity-70"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.07] ring-1 ring-white/[0.1]">
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
          <span className="text-[14px] font-semibold tracking-tight text-white">VibeCheck</span>
        </Link>
      </div>

      {/* Centre */}
      <div className="relative z-10">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
          <span className="text-[11px] font-medium tracking-wide text-zinc-500">
            Verifiable Credentials
          </span>
        </div>

        <h2 className="mb-4 text-[28px] font-bold leading-[1.2] tracking-tight text-white xl:text-[32px]">
          Where AI-built
          <br />
          projects earn <span className="gradient-text">real cred.</span>
        </h2>

        <p className="mb-6 max-w-[280px] text-[13px] leading-relaxed text-zinc-500">
          Get your work reviewed by engineers who&apos;ve shipped real products. Not vibes. Proof.
        </p>

        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Provisional', color: '#71717A' },
            { label: 'Maker', color: '#06B6D4' },
            { label: 'Builder', color: '#8B5CF6' },
            { label: 'Architect', color: '#F59E0B' },
          ].map((tier) => (
            <span
              key={tier.label}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-zinc-500"
            >
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: tier.color }}
              />
              {tier.label}
            </span>
          ))}
        </div>
      </div>

      {/* Testimonial */}
      <div className="relative z-10">
        <div className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-5">
          <p className="mb-4 text-[13px] leading-relaxed text-zinc-400">
            &ldquo;VibeCheck gave me a credential I could actually point to when applying to YC. No
            more &lsquo;trust me bro&rsquo; moments.&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-[11px] font-bold text-white">
              SL
            </div>
            <div>
              <p className="text-[12px] font-semibold text-zinc-300">@sarahliang</p>
              <p className="text-[11px] text-zinc-600">Builder · Tier 3</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

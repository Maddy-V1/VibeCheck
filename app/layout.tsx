import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

// Geist — modern, clean sans-serif
const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'VibeCheck — Verified credentials for AI-native developers',
    template: '%s — VibeCheck',
  },
  description:
    'Submit your AI-built projects, earn expert evaluations, and showcase verifiable credentials that prove your skills as a vibe coder.',
  keywords: [
    'vibe coding',
    'AI development',
    'project evaluation',
    'developer portfolio',
    'coding certificate',
    'vibe coder credentials',
  ],
  authors: [{ name: 'VibeCheck' }],
  creator: 'VibeCheck',
  metadataBase: new URL(process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'VibeCheck',
    title: 'VibeCheck — Verified credentials for AI-native developers',
    description:
      'Submit your AI-built projects, earn expert evaluations, and showcase verifiable credentials.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VibeCheck — Verified credentials for AI-native developers',
    description:
      'Submit your AI-built projects, earn expert evaluations, and showcase verifiable credentials.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geist.variable} ${geistMono.variable} bg-black font-sans text-white antialiased`}
      >
        {children}
      </body>
    </html>
  )
}

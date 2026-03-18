import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Strict React mode — catches potential issues during development
  reactStrictMode: true,

  images: {
    // Allow avatars from GitHub, Google, and LinkedIn CDNs
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'media.licdn.com',
      },
      {
        // Supabase Storage CDN for badges, certificates, avatars
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Needed for satori + sharp running in Node.js API routes
  serverExternalPackages: ['sharp', 'pdfkit'],

  // Headers for security — applied to all routes
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}

export default nextConfig

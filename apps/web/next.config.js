const path = require('path')

/** @type {import('next').NextConfig} */
module.exports = {
  async headers() {
    return [
      {
        source: '/embed/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          { key: 'Content-Security-Policy', value: "frame-ancestors *" },
        ],
      },
      {
        // Service worker must not be cached by the browser so updates deploy immediately
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        // Offline fallback page — short cache so updates propagate
        source: '/offline.html',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }],
      },
    ]
  },
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@play-money/ui'],
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../'),
    instrumentationHook: true,
    serverActions: {
      allowedOrigins: [process.env.NEXT_PUBLIC_API_URL],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bijbnpk9x6qrvjzj.public.blob.vercel-storage.com',
        port: '',
      },
    ],
  },
}

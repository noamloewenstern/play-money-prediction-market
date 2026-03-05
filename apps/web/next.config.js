const path = require('path')

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@play-money/ui'],
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../'),
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

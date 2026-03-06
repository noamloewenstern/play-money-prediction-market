import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://playmoney.dev'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/settings/',
          '/journal/',
          '/questions/bookmarks',
          '/questions/following',
          '/share/',
          '/check-email',
          '/create-post',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

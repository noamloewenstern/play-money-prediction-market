import type { MetadataRoute } from 'next'
import { getLists, getMarkets, getPopularTags } from '@play-money/api-helpers/client'

const BASE_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://playmoney.dev'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/questions`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/leaderboard`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/transparency`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ]

  const [marketRoutes, listRoutes, tagRoutes, userRoutes] = await Promise.all([
    fetchMarketRoutes(),
    fetchListRoutes(),
    fetchTagRoutes(),
    fetchUserRoutes(),
  ])

  return [...staticRoutes, ...marketRoutes, ...listRoutes, ...tagRoutes, ...userRoutes]
}

async function fetchMarketRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const { data: markets } = await getMarkets({ limit: 1000 })
    return markets.map((market) => ({
      url: `${BASE_URL}/questions/${market.id}/${market.slug}`,
      lastModified: market.updatedAt ? new Date(market.updatedAt) : new Date(),
      changeFrequency: market.resolvedAt || market.canceledAt ? 'monthly' : 'hourly',
      priority: market.resolvedAt || market.canceledAt ? 0.5 : 0.8,
    }))
  } catch {
    return []
  }
}

async function fetchListRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const { data: lists } = await getLists({ limit: 500 })
    return lists.map((list) => ({
      url: `${BASE_URL}/lists/${list.id}/${list.slug}`,
      lastModified: list.updatedAt ? new Date(list.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch {
    return []
  }
}

async function fetchTagRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const { data: tags } = await getPopularTags({ limit: 100 })
    return tags.map(({ tag }) => ({
      url: `${BASE_URL}/questions/tagged/${encodeURIComponent(tag)}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.6,
    }))
  } catch {
    return []
  }
}

async function fetchUserRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const { data: markets } = await getMarkets({ limit: 1000 })
    const usernameSet = new Set<string>()
    for (const market of markets) {
      if (market.user?.username) {
        usernameSet.add(market.user.username)
      }
    }
    return Array.from(usernameSet).map((username) => ({
      url: `${BASE_URL}/${username}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))
  } catch {
    return []
  }
}

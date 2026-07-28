import { Redis } from '@upstash/redis'
import type { VercelRequest } from '@vercel/node'

function envPassword(name: string, fallback: string): string {
  const value = process.env[name]
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

export const PLAYER_PASSWORD = envPassword(
  'PLAYER_PASSWORD',
  envPassword('VITE_PLAYER_PASSWORD', 'calzone'),
)
export const ADMIN_PASSWORD = envPassword(
  'ADMIN_PASSWORD',
  envPassword('VITE_ADMIN_PASSWORD', 'calzoneduplo'),
)

export type ApiAuthRole = 'player' | 'admin'

export function authRole(req: VercelRequest): ApiAuthRole | null {
  const header = req.headers.authorization ?? ''
  const token = header.replace(/^Bearer\s+/i, '')
  if (token === ADMIN_PASSWORD) return 'admin'
  if (token === PLAYER_PASSWORD) return 'player'
  return null
}

/** Accept both Upstash Redis and Vercel KV env names (local .env.local often has KV_*). */
export function redisConfigured(): boolean {
  return Boolean(
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) ||
      (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN),
  )
}

export function getRedis(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  if (!url || !token) {
    throw new Error('Redis not configured')
  }
  return new Redis({ url, token })
}

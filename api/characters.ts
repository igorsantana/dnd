import { Redis } from '@upstash/redis'
import type { VercelRequest, VercelResponse } from '@vercel/node'

function envPassword(name: string, fallback: string): string {
  const value = process.env[name]
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

const PLAYER_PASSWORD = envPassword('PLAYER_PASSWORD', envPassword('VITE_PLAYER_PASSWORD', 'calzone'))
const ADMIN_PASSWORD = envPassword('ADMIN_PASSWORD', envPassword('VITE_ADMIN_PASSWORD', 'calzoneduplo'))
const INDEX_KEY = 'dnd:character-index'

function getRedis(): Redis {
  return Redis.fromEnv()
}

interface StoredCharacter {
  id: string
  profileId?: string
  name: string
  updatedAt: string
  [key: string]: unknown
}

async function readIndex(): Promise<string[]> {
  const index = await getRedis().get<string[]>(INDEX_KEY)
  return Array.isArray(index) ? index : []
}

async function writeIndex(ids: string[]): Promise<void> {
  await getRedis().set(INDEX_KEY, ids)
}

function isAuthorized(req: VercelRequest, role: 'player' | 'admin'): boolean {
  const header = req.headers.authorization ?? ''
  const token = header.replace(/^Bearer\s+/i, '')
  return role === 'admin' ? token === ADMIN_PASSWORD : token === PLAYER_PASSWORD
}

function storageKey(id: string): string {
  return `dnd:character:${id}`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return res.status(503).json({
      error: 'Cloud storage not configured. Add Upstash Redis from the Vercel Marketplace.',
    })
  }

  try {
    const redis = getRedis()

    if (req.method === 'GET') {
      if (!isAuthorized(req, 'admin')) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const index = await readIndex()
      const characters = (
        await Promise.all(index.map((id) => redis.get<StoredCharacter>(storageKey(id))))
      ).filter((character): character is StoredCharacter => Boolean(character?.id))

      characters.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
      return res.status(200).json(characters)
    }

    if (req.method === 'POST') {
      if (!isAuthorized(req, 'player')) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const character = req.body as StoredCharacter
      if (!character?.id || !character?.name) {
        return res.status(400).json({ error: 'Invalid character payload' })
      }

      const key = character.profileId || character.id
      const saved: StoredCharacter = {
        ...character,
        updatedAt: new Date().toISOString(),
      }

      await redis.set(storageKey(key), saved)

      const index = await readIndex()
      if (!index.includes(key)) {
        await writeIndex([...index, key])
      }

      return res.status(200).json(saved)
    }

    if (req.method === 'DELETE') {
      if (!isAuthorized(req, 'admin')) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const id = typeof req.query.id === 'string' ? req.query.id : ''
      if (!id) {
        return res.status(400).json({ error: 'Missing character id' })
      }

      await redis.del(storageKey(id))
      const index = await readIndex()
      await writeIndex(index.filter((entry) => entry !== id))

      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', 'GET, POST, DELETE')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch {
    return res.status(500).json({ error: 'Failed to access cloud storage' })
  }
}

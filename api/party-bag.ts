import type { VercelRequest, VercelResponse } from '@vercel/node'
import { authRole, getRedis, redisConfigured } from './_auth'

const BAG_KEY = 'dnd:party:bag'

export interface PartyBagItem {
  id: string
  name: string
  quantity: string
  notes: string
}

export interface PartyBagDoc {
  items: PartyBagItem[]
  updatedAt: string
}

function emptyBag(): PartyBagDoc {
  return { items: [], updatedAt: new Date(0).toISOString() }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!redisConfigured()) {
    return res.status(503).json({
      error: 'Cloud storage not configured. Add Upstash Redis from the Vercel Marketplace.',
    })
  }

  try {
    const redis = getRedis()
    const role = authRole(req)
    if (!role) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (req.method === 'GET') {
      const doc = (await redis.get<PartyBagDoc>(BAG_KEY)) ?? emptyBag()
      if (!Array.isArray(doc.items)) doc.items = []
      return res.status(200).json(doc)
    }

    if (req.method === 'POST') {
      const body = req.body as Partial<PartyBagDoc>
      const items = Array.isArray(body.items)
        ? body.items
            .filter((item) => item && typeof item === 'object')
            .map((item) => ({
              id: typeof item.id === 'string' && item.id ? item.id : crypto.randomUUID(),
              name: typeof item.name === 'string' ? item.name : '',
              quantity: typeof item.quantity === 'string' ? item.quantity : '1',
              notes: typeof item.notes === 'string' ? item.notes : '',
            }))
        : []

      const saved: PartyBagDoc = {
        items,
        updatedAt: new Date().toISOString(),
      }
      await redis.set(BAG_KEY, saved)
      return res.status(200).json(saved)
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch {
    return res.status(500).json({ error: 'Failed to access party bag' })
  }
}

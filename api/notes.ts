import type { VercelRequest, VercelResponse } from '@vercel/node'
import { authRole, getRedis, redisConfigured } from './_auth.js'

const NOTES_KEY = 'dnd:party:notes'

export interface PartyNotesDoc {
  html: string
  /** @deprecated kept for older Redis docs written as markdown */
  markdown?: string
  updatedAt: string
  updatedBy?: string
}

function emptyNotes(): PartyNotesDoc {
  return { html: '', updatedAt: new Date(0).toISOString() }
}

function normalizeNotes(doc: PartyNotesDoc | null): PartyNotesDoc {
  if (!doc) return emptyNotes()
  const html =
    typeof doc.html === 'string'
      ? doc.html
      : typeof doc.markdown === 'string'
        ? doc.markdown
        : ''
  return {
    html,
    updatedAt: doc.updatedAt || new Date(0).toISOString(),
    updatedBy: doc.updatedBy,
  }
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
      const doc = normalizeNotes(await redis.get<PartyNotesDoc>(NOTES_KEY))
      return res.status(200).json(doc)
    }

    if (req.method === 'POST') {
      const body = req.body as Partial<PartyNotesDoc>
      const html =
        typeof body.html === 'string'
          ? body.html
          : typeof body.markdown === 'string'
            ? body.markdown
            : ''
      const saved: PartyNotesDoc = {
        html,
        updatedAt: new Date().toISOString(),
        updatedBy: typeof body.updatedBy === 'string' ? body.updatedBy : role,
      }
      await redis.set(NOTES_KEY, saved)
      return res.status(200).json(saved)
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch {
    return res.status(500).json({ error: 'Failed to access party notes' })
  }
}

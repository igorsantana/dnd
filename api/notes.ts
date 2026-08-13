import type { VercelRequest, VercelResponse } from '@vercel/node'
import { authRole, getRedis, redisConfigured } from './_auth.js'

const NOTES_KEY = 'dnd:party:notes'

export interface DiaryPage {
  id: string
  title: string
  html: string
  createdAt: string
  updatedAt: string
  updatedBy?: string
}

export interface PartyNotesDoc {
  v: 2
  pages: DiaryPage[]
  updatedAt: string
}

type LegacyNotes = {
  html?: string
  markdown?: string
  updatedAt?: string
  updatedBy?: string
}

function legacyPage(html: string, updatedBy?: string): DiaryPage {
  const zero = new Date(0).toISOString()
  return { id: 'pagina-1', title: 'Sessão 23', html, createdAt: zero, updatedAt: zero, updatedBy }
}

function normalizePage(raw: unknown): DiaryPage | null {
  const p = (raw ?? {}) as {
    id?: unknown
    title?: unknown
    html?: unknown
    createdAt?: unknown
    updatedAt?: unknown
    updatedBy?: unknown
  }
  if (typeof p.id !== 'string' || typeof p.title !== 'string') return null
  return {
    id: p.id,
    title: p.title,
    html: typeof p.html === 'string' ? p.html : '',
    createdAt: typeof p.createdAt === 'string' ? p.createdAt : new Date().toISOString(),
    updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : new Date().toISOString(),
    updatedBy: typeof p.updatedBy === 'string' ? p.updatedBy : undefined,
  }
}

function normalizeNotes(raw: unknown): PartyNotesDoc {
  const doc = (raw ?? {}) as Record<string, unknown>
  if (Array.isArray(doc.pages)) {
    const pages = doc.pages
      .map(normalizePage)
      .filter((p): p is DiaryPage => Boolean(p))
    return {
      v: 2,
      pages,
      updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : new Date(0).toISOString(),
    }
  }
  const legacy = doc as LegacyNotes
  const html =
    typeof legacy.html === 'string'
      ? legacy.html
      : typeof legacy.markdown === 'string'
        ? legacy.markdown
        : ''
  return {
    v: 2,
    pages: html ? [legacyPage(html, legacy.updatedBy)] : [],
    updatedAt: typeof legacy.updatedAt === 'string' ? legacy.updatedAt : new Date(0).toISOString(),
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
      const body = (req.body ?? {}) as { pages?: unknown[]; updatedBy?: unknown }
      const pages = Array.isArray(body.pages)
        ? body.pages.map(normalizePage).filter((p): p is DiaryPage => Boolean(p))
        : []
      const saved: PartyNotesDoc = {
        v: 2,
        pages,
        updatedAt: new Date().toISOString(),
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
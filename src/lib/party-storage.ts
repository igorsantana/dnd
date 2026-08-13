import type { InventoryItem } from '../types/character'
import { getPlayerPassword } from './auth'

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

export interface PartyBagDoc {
  items: InventoryItem[]
  updatedAt: string
}

const NOTES_URL = '/api/notes'
const BAG_URL = '/api/party-bag'
const UPLOAD_URL = '/api/upload'

function authHeaders(json = true): HeadersInit {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getPlayerPassword()}`,
  }
  if (json) headers['Content-Type'] = 'application/json'
  return headers
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
    createdAt: typeof p.createdAt === 'string' ? p.createdAt : '',
    updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : '',
    updatedBy: typeof p.updatedBy === 'string' ? p.updatedBy : undefined,
  }
}

function normalizeNotesPayload(raw: unknown): PartyNotesDoc {
  const doc = (raw ?? {}) as {
    v?: number
    pages?: unknown[]
    html?: string
    markdown?: string
    updatedAt?: string
    updatedBy?: string
  }
  const pages = Array.isArray(doc.pages)
    ? doc.pages.map(normalizePage).filter((p): p is DiaryPage => Boolean(p))
    : []
  if (pages.length > 0) {
    return { v: 2, pages, updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : '' }
  }
  const html = typeof doc.html === 'string' ? doc.html : typeof doc.markdown === 'string' ? doc.markdown : ''
  const migrated = html
    ? [{ id: 'pagina-1', title: 'Sessão 23', html, createdAt: '', updatedAt: '', updatedBy: doc.updatedBy }]
    : []
  return { v: 2, pages: migrated, updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : '' }
}

export async function fetchPartyNotes(): Promise<{
  doc: PartyNotesDoc | null
  available: boolean
}> {
  try {
    const response = await fetch(NOTES_URL, { headers: authHeaders(false) })
    if (response.status === 503) return { doc: null, available: false }
    if (!response.ok) return { doc: null, available: false }
    return { doc: normalizeNotesPayload(await response.json()), available: true }
  } catch {
    return { doc: null, available: false }
  }
}

export async function pushPartyNotes(
  pages: DiaryPage[],
  updatedBy?: string,
): Promise<PartyNotesDoc | null> {
  try {
    const response = await fetch(NOTES_URL, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ pages, updatedBy }),
    })
    if (!response.ok) return null
    return normalizeNotesPayload(await response.json())
  } catch {
    return null
  }
}

export async function fetchPartyBag(): Promise<{
  doc: PartyBagDoc | null
  available: boolean
}> {
  try {
    const response = await fetch(BAG_URL, { headers: authHeaders(false) })
    if (response.status === 503) return { doc: null, available: false }
    if (!response.ok) return { doc: null, available: false }
    const data = (await response.json()) as PartyBagDoc
    return {
      doc: { items: Array.isArray(data.items) ? data.items : [], updatedAt: data.updatedAt },
      available: true,
    }
  } catch {
    return { doc: null, available: false }
  }
}

export async function pushPartyBag(items: InventoryItem[]): Promise<PartyBagDoc | null> {
  try {
    const response = await fetch(BAG_URL, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ items }),
    })
    if (!response.ok) return null
    return (await response.json()) as PartyBagDoc
  } catch {
    return null
  }
}

export async function uploadPartyNoteImage(file: File): Promise<string | null> {
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result ?? ''))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })

    const response = await fetch(UPLOAD_URL, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || 'image/png',
        data: dataUrl,
      }),
    })
    if (!response.ok) return null
    const payload = (await response.json()) as { url?: string }
    return payload.url ?? null
  } catch {
    return null
  }
}

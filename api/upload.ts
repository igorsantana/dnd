import { put } from '@vercel/blob'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { authRole } from './_auth'
import { Buffer } from 'buffer'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
}

function extensionFromMime(mime: string): string {
  if (mime.includes('png')) return 'png'
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg'
  if (mime.includes('gif')) return 'gif'
  if (mime.includes('webp')) return 'webp'
  return 'bin'
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const role = authRole(req)
  if (!role) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({
      error: 'Blob storage not configured. Add a Vercel Blob store and BLOB_READ_WRITE_TOKEN.',
    })
  }

  try {
    const body = req.body as {
      filename?: string
      contentType?: string
      data?: string
    }

    if (!body?.data || typeof body.data !== 'string') {
      return res.status(400).json({ error: 'Missing image data' })
    }

    const contentType =
      typeof body.contentType === 'string' && body.contentType.startsWith('image/')
        ? body.contentType
        : 'image/png'
    const rawName =
      typeof body.filename === 'string' && body.filename.trim()
        ? body.filename.trim().replace(/[^\w.\-]+/g, '_')
        : `note-${Date.now()}.${extensionFromMime(contentType)}`

    const base64 = body.data.includes(',') ? body.data.split(',')[1] : body.data
    const buffer = Buffer.from(base64, 'base64')
    if (buffer.byteLength === 0) {
      return res.status(400).json({ error: 'Empty image' })
    }
    if (buffer.byteLength > 3.5 * 1024 * 1024) {
      return res.status(413).json({ error: 'Image too large (max ~3.5MB)' })
    }

    const blob = await put(`party-notes/${rawName}`, buffer, {
      access: 'public',
      contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    return res.status(200).json({ url: blob.url })
  } catch {
    return res.status(500).json({ error: 'Failed to upload image' })
  }
}

/**
 * Converts DM source into chunky 8-bit pixel art with transparent background.
 * Run: bun scripts/pixelate-dm.mjs
 */

import { Jimp } from 'jimp'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = join(__dirname, '../public/sprites/dm-source.png')
const OUT = join(__dirname, '../public/sprites/dm-pixel.png')

/** Pokemon-style sprite width in pixels (display scaled up in CSS) */
const PIXEL_WIDTH = 32

/** Color quantization levels per channel (lower = chunkier 8-bit look) */
const COLOR_LEVELS = 4

function quantize(value) {
  const step = 255 / (COLOR_LEVELS - 1)
  return Math.round(Math.round(value / step) * step)
}

function isBackground(r, g, b, a) {
  if (a < 20) return true
  const avg = (r + g + b) / 3
  const spread = Math.max(r, g, b) - Math.min(r, g, b)
  // White backdrop
  if (avg > 245 && spread < 20) return true
  // Gray drop shadow on white floor
  if (avg > 175 && spread < 28) return true
  // Off-white fringe
  if (r > 238 && g > 238 && b > 238) return true
  return false
}

function stripBackground(image) {
  image.scan(0, 0, image.width, image.height, (x, y, idx) => {
    const r = image.bitmap.data[idx]
    const g = image.bitmap.data[idx + 1]
    const b = image.bitmap.data[idx + 2]
    const a = image.bitmap.data[idx + 3]

    if (isBackground(r, g, b, a)) {
      image.bitmap.data[idx + 3] = 0
    }
  })
}

function quantizeColors(image) {
  image.scan(0, 0, image.width, image.height, (x, y, idx) => {
    const a = image.bitmap.data[idx + 3]
    if (a === 0) return

    image.bitmap.data[idx] = quantize(image.bitmap.data[idx])
    image.bitmap.data[idx + 1] = quantize(image.bitmap.data[idx + 1])
    image.bitmap.data[idx + 2] = quantize(image.bitmap.data[idx + 2])
    image.bitmap.data[idx + 3] = 255
  })
}

const img = await Jimp.read(SRC)

// Remove backdrop at full resolution before downscale (cleaner edges)
stripBackground(img)

const aspect = img.height / img.width
const w = PIXEL_WIDTH
const h = Math.round(w * aspect)

await img.resize({ w, h, mode: Jimp.RESIZE_NEAREST_NEIGHBOR })

// Second pass for fringe pixels introduced by scaling
stripBackground(img)
quantizeColors(img)

await img.write(OUT)
console.log(`Wrote 8-bit pixel art ${w}x${h} (transparent) -> ${OUT}`)

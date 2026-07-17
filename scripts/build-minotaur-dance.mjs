import { Jimp } from 'jimp'
import { GIFEncoder, quantize, applyPalette } from 'gifenc'
import { writeFileSync } from 'fs'
import path from 'path'

const assets = 'C:/Users/igorp/.cursor/projects/d-PROJETOS-dnd/assets'
const outDir = 'D:/PROJETOS/dnd/public/sprites'
const PAD = 24
const TARGET_H = 360

function isBackground(r, g, b, a) {
  if (a < 8) return true
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const sat = max - min
  if (min >= 220 && sat <= 18) return true
  if (min >= 200 && sat <= 12 && (r + g + b) / 3 >= 228) return true
  return false
}

function clearBackground(img) {
  const { data } = img.bitmap
  let removed = 0
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]
    if (isBackground(r, g, b, a)) {
      data[i] = 0
      data[i + 1] = 0
      data[i + 2] = 0
      data[i + 3] = 0
      removed++
    }
  }
  return removed
}

function contentBounds(img) {
  const { data, width, height } = img.bitmap
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = data[(y * width + x) * 4 + 3]
      if (a > 16) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return null
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
}

function opaqueCount(img) {
  const { data } = img.bitmap
  let n = 0
  for (let i = 3; i < data.length; i += 4) if (data[i] > 16) n++
  return n
}

const crops = []
const stats = []
let removedTotal = 0

for (let i = 1; i <= 32; i++) {
  const file = path.join(assets, `minotaur-frame-${String(i).padStart(2, '0')}.png`)
  const img = await Jimp.read(file)
  removedTotal += clearBackground(img)
  const bounds = contentBounds(img)
  if (!bounds) throw new Error(`empty frame ${i}`)
  const crop = img.clone().crop({ x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h })
  crops.push(crop)
  stats.push({ i, w: bounds.w, h: bounds.h, opaque: opaqueCount(crop) })
}

const scale = TARGET_H / Math.max(...crops.map((c) => c.bitmap.height))
const scaled = []
for (const crop of crops) {
  const w = Math.max(1, Math.round(crop.bitmap.width * scale))
  const h = Math.max(1, Math.round(crop.bitmap.height * scale))
  scaled.push(crop.clone().resize({ w, h }))
}

const maxW = Math.max(...scaled.map((c) => c.bitmap.width))
const maxH = Math.max(...scaled.map((c) => c.bitmap.height))
const canvasW = maxW + PAD * 2
const canvasH = maxH + PAD * 2

const frames = []
for (const crop of scaled) {
  const canvas = new Jimp({ width: canvasW, height: canvasH, color: 0x00000000 })
  const x = Math.floor((canvasW - crop.bitmap.width) / 2)
  const y = Math.floor((canvasH - crop.bitmap.height) / 2)
  canvas.composite(crop, x, y)
  frames.push(canvas)
}

const sheet = new Jimp({ width: canvasW * 32, height: canvasH, color: 0x00000000 })
for (let i = 0; i < 32; i++) sheet.composite(frames[i], i * canvasW, 0)
await sheet.write(path.join(outDir, 'minotaur-dance-sheet.png'))

const samplePixels = []
for (const frame of frames) {
  const { data } = frame.bitmap
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 16) {
      samplePixels.push(data[i], data[i + 1], data[i + 2], 255)
    }
  }
}
const sampleRgba = new Uint8Array(samplePixels)
const palette = quantize(sampleRgba, 255)
const gifPalette = [
  [0, 0, 0],
  ...palette.filter((c) => !(c[0] < 8 && c[1] < 8 && c[2] < 8)).slice(0, 254),
]

const gif = GIFEncoder()
for (const frame of frames) {
  const { data, width, height } = frame.bitmap
  const rgba = new Uint8Array(width * height * 4)
  rgba.set(data)
  const indexed = applyPalette(rgba, gifPalette)
  for (let p = 0, i = 3; i < data.length; i += 4, p++) {
    if (data[i] <= 16) indexed[p] = 0
  }
  gif.writeFrame(indexed, width, height, {
    palette: gifPalette,
    delay: 95,
    dispose: 2,
    transparent: true,
    transparentIndex: 0,
  })
}
gif.finish()
const gifBytes = Buffer.from(gif.bytes())
writeFileSync(path.join(outDir, 'minotaur-dance.gif'), gifBytes)

let remainingWhite = 0
const frameOpaque = []
for (const frame of frames) {
  const { data } = frame.bitmap
  let op = 0
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]
    if (a > 16) {
      op++
      if (Math.min(r, g, b) >= 220 && Math.max(r, g, b) - Math.min(r, g, b) <= 18) {
        remainingWhite++
      }
    }
  }
  frameOpaque.push(op)
}

console.log(
  JSON.stringify(
    {
      poses: frames.length,
      canvas: [canvasW, canvasH],
      maxCrop: [maxW, maxH],
      removedTotal,
      remainingWhite,
      gifBytes: gifBytes.length,
      frameOpaque,
      cropStats: stats,
    },
    null,
    2,
  ),
)

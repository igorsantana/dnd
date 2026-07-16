/**
 * Generates an 8-bit dancing skeleton sprite sheet (4 frames).
 * Run: bun scripts/generate-skeleton-sprite.mjs
 */

import { Jimp, rgbaToInt } from 'jimp'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../public/sprites/skeleton-dance.png')

const W = 16
const H = 24
const FRAMES = 4

const PALETTE = {
  '.': null,
  B: rgbaToInt(232, 232, 232, 255),
  D: rgbaToInt(102, 102, 102, 255),
  E: rgbaToInt(0, 0, 0, 255),
}

/** @type {string[][]} */
const BASE = [
  '................',
  '.....BBBB.......',
  '....BBBBBB......',
  '...BBBBBBBB.....',
  '...BBEEEBB......',
  '...BBBBBBBB.....',
  '....BBBBBB......',
  '.....BBBB.......',
  '....BB..BB......',
  '...BBBBBBBB.....',
  '...BB....BB.....',
  '...BB....BB.....',
  '..BB......BB....',
  '..BB......BB....',
  '..BB......BB....',
  '.BB........BB...',
  '.BB........BB...',
  '.....BB..BB.....',
  '.....BB..BB.....',
  '....BB....BB....',
  '....BB....BB....',
  '...BB......BB...',
  '...BB......BB...',
  '................',
]

/** Arm/leg offsets per dance frame */
const FRAME_POSES = [
  { armL: -1, armR: 1, legL: 0, legR: 0, bob: 0 },
  { armL: -2, armR: 2, legL: 1, legR: -1, bob: 1 },
  { armL: 0, armR: 0, legL: -1, legR: 1, bob: 0 },
  { armL: 1, armR: -1, legL: 0, legR: 0, bob: -1 },
]

function shiftRow(row, dx) {
  if (dx === 0) return row
  const chars = row.split('')
  if (dx > 0) {
    return '.'.repeat(dx) + chars.slice(0, 16 - dx).join('')
  }
  return chars.slice(-dx).join('') + '.'.repeat(-dx)
}

function buildFrame(pose) {
  return BASE.map((row, y) => {
    let line = row
    if (y >= 8 && y <= 13) {
      if (y <= 10) line = shiftRow(line, pose.armL)
      else line = shiftRow(line, pose.armR)
    }
    if (y >= 17) line = shiftRow(line, y % 2 === 0 ? pose.legL : pose.legR)
    return line
  })
}

const sheet = new Jimp({ width: W * FRAMES, height: H })

for (let f = 0; f < FRAMES; f++) {
  const frame = buildFrame(FRAME_POSES[f])
  const ox = f * W

  for (let y = 0; y < H; y++) {
    const row = frame[y] ?? '................'
    for (let x = 0; x < W; x++) {
      const ch = row[x] ?? '.'
      const color = PALETTE[ch]
      if (color) {
        sheet.setPixelColor(color, ox + x, y)
      }
    }
  }
}

await sheet.write(OUT)
console.log(`Wrote skeleton dance sprite ${W * FRAMES}x${H} -> ${OUT}`)

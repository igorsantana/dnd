import type { CharacterClass } from './profiles'
import type { SpellSlots } from '../types/character'

/** Full caster (wizard/bard) PHB spell slots by character level. */
const FULL_CASTER_SLOTS: Record<number, number[]> = {
  1: [2],
  2: [3],
  3: [4, 2],
  4: [4, 3],
  5: [4, 3, 2],
  6: [4, 3, 3],
  7: [4, 3, 3, 1],
  8: [4, 3, 3, 2],
  9: [4, 3, 3, 3, 1],
  10: [4, 3, 3, 3, 2],
  11: [4, 3, 3, 3, 2, 1],
  12: [4, 3, 3, 3, 2, 1],
  13: [4, 3, 3, 3, 2, 1, 1],
  14: [4, 3, 3, 3, 2, 1, 1],
  15: [4, 3, 3, 3, 2, 1, 1, 1],
  16: [4, 3, 3, 3, 2, 1, 1, 1],
  17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
  18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
  19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
  20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
}

/** Half caster (ranger) PHB spell slots by character level. */
const HALF_CASTER_SLOTS: Record<number, number[]> = {
  1: [],
  2: [2],
  3: [3],
  4: [3],
  5: [4, 2],
  6: [4, 2],
  7: [4, 3],
  8: [4, 3],
  9: [4, 3, 2],
  10: [4, 3, 2],
  11: [4, 3, 3],
  12: [4, 3, 3],
  13: [4, 3, 3, 1],
  14: [4, 3, 3, 1],
  15: [4, 3, 3, 2],
  16: [4, 3, 3, 2],
  17: [4, 3, 3, 3, 1],
  18: [4, 3, 3, 3, 1],
  19: [4, 3, 3, 3, 2],
  20: [4, 3, 3, 3, 2],
}

export function proficiencyBonusForLevel(level: number): string {
  if (level >= 17) return '+6'
  if (level >= 13) return '+5'
  if (level >= 9) return '+4'
  if (level >= 5) return '+3'
  return '+2'
}

export function spellSlotsForClassLevel(
  characterClass: CharacterClass,
  level: number,
): SpellSlots {
  const clamped = Math.max(1, Math.min(20, level))
  let counts: number[] = []
  if (characterClass === 'wizard' || characterClass === 'bard') {
    counts = FULL_CASTER_SLOTS[clamped] ?? []
  } else if (characterClass === 'ranger') {
    counts = HALF_CASTER_SLOTS[clamped] ?? []
  }

  const slots: SpellSlots = {}
  counts.forEach((total, index) => {
    slots[String(index + 1)] = { total: String(total), used: '0' }
  })
  return slots
}

export function formatSpellSlotSummary(slots: SpellSlots): string {
  return Object.entries(slots)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([level, slot]) => `${level}º×${slot.total}`)
    .join(' · ')
}

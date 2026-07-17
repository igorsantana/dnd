import type { CharacterClass, SubclassId } from '../data/profiles'
import type { ClassFeatureDef } from '../data/class-features'
import {
  proficiencyBonusForLevel,
  spellSlotsForClassLevel,
} from '../data/spell-slots'
import type { Character } from '../types/character'
import {
  effectiveMaxChoices,
  getAttacksPerTurn,
  parseLevel,
  resolveFeatures,
} from './class-features'
import { pt } from '../i18n/pt'

export interface LevelUpPreview {
  profileId?: string
  characterId: string
  characterName: string
  characterClass: CharacterClass
  subclassId?: SubclassId
  fromLevel: number
  toLevel: number
  additions: string[]
}

function featureLabel(feature: ClassFeatureDef): string {
  const labels = pt.features as Record<string, string>
  return labels[feature.labelKey] ?? feature.labelKey
}

function featureDetail(feature: ClassFeatureDef): string | undefined {
  if (!feature.detailKey) return undefined
  const labels = pt.features as Record<string, string>
  return labels[feature.detailKey]
}

export function buildLevelUpPreview(
  character: Character,
  characterClass: CharacterClass,
  subclassId: SubclassId | undefined,
): LevelUpPreview {
  const fromLevel = parseLevel(character.level)
  const toLevel = Math.min(20, fromLevel + 1)
  const additions: string[] = []

  const before = new Set(
    resolveFeatures(characterClass, subclassId, fromLevel).map((f) => f.id),
  )
  const unlocked = resolveFeatures(characterClass, subclassId, toLevel).filter(
    (f) => !before.has(f.id),
  )

  for (const feature of unlocked) {
    const detail = featureDetail(feature)
    additions.push(detail ? `${featureLabel(feature)} — ${detail}` : featureLabel(feature))
  }

  const beforeChoices = resolveFeatures(characterClass, subclassId, fromLevel).filter(
    (f) => f.kind === 'choice' && f.choiceKey,
  )
  for (const feature of beforeChoices) {
    const prevMax = effectiveMaxChoices(feature, fromLevel)
    const nextMax = effectiveMaxChoices(feature, toLevel)
    if (nextMax > prevMax) {
      additions.push(pt.levelUp.choiceSlotsExpanded(featureLabel(feature), nextMax))
    }
  }

  const oldSlots = spellSlotsForClassLevel(characterClass, fromLevel)
  const newSlots = spellSlotsForClassLevel(characterClass, toLevel)
  const slotLevels = new Set([...Object.keys(oldSlots), ...Object.keys(newSlots)])
  const slotChanges = [...slotLevels]
    .sort((a, b) => Number(a) - Number(b))
    .flatMap((level) => {
      const before = Number(oldSlots[level]?.total ?? 0)
      const after = Number(newSlots[level]?.total ?? 0)
      return after > before ? [`LVL ${level}: ${before} → ${after}`] : []
    })

  if (slotChanges.length > 0) {
    additions.push(pt.levelUp.spellSlotsUpdated(slotChanges.join('\n')))
  }

  const oldProf = proficiencyBonusForLevel(fromLevel)
  const newProf = proficiencyBonusForLevel(toLevel)
  if (oldProf !== newProf) {
    additions.push(pt.levelUp.proficiencyUpdated(newProf))
  }

  const oldAttacks = getAttacksPerTurn(characterClass, fromLevel)
  const newAttacks = getAttacksPerTurn(characterClass, toLevel)
  if (oldAttacks !== newAttacks) {
    additions.push(pt.levelUp.attacksUpdated(newAttacks))
  }

  if (additions.length === 0) {
    additions.push(pt.levelUp.noAutomaticChanges)
  }

  return {
    profileId: character.profileId,
    characterId: character.id,
    characterName: character.name,
    characterClass,
    subclassId,
    fromLevel,
    toLevel,
    additions,
  }
}

/** Apply level bump + spell slot totals locally. Does not touch cloud. */
export function applyLevelUpToCharacter(
  character: Character,
  characterClass: CharacterClass,
): Character {
  const fromLevel = parseLevel(character.level)
  const toLevel = Math.min(20, fromLevel + 1)
  const nextSlots = spellSlotsForClassLevel(characterClass, toLevel)
  const mergedSlots = { ...nextSlots }

  // Preserve custom totals if player already edited a slot level upward
  for (const [level, slot] of Object.entries(character.spellSlots ?? {})) {
    const catalogTotal = Number(nextSlots[level]?.total ?? 0)
    const currentTotal = Number(slot.total ?? 0)
    if (currentTotal > catalogTotal) {
      mergedSlots[level] = {
        total: slot.total,
        used: '0',
      }
    } else if (mergedSlots[level]) {
      mergedSlots[level] = {
        total: mergedSlots[level].total,
        used: '0',
      }
    }
  }

  return {
    ...character,
    level: String(toLevel),
    proficiencyBonus: proficiencyBonusForLevel(toLevel),
    spellSlots: Object.keys(mergedSlots).length > 0 ? mergedSlots : character.spellSlots,
    updatedAt: new Date().toISOString(),
  }
}

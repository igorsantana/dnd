import type { CharacterClass, SubclassId } from '../data/profiles'
import {
  CLASS_FEATURE_CATALOG,
  FIGHTING_STYLES,
  type ClassFeatureDef,
  type FeatureOption,
} from '../data/class-features'

export function parseLevel(level: string | number | undefined): number {
  const n = typeof level === 'number' ? level : Number.parseInt(String(level ?? '1'), 10)
  return Number.isFinite(n) && n > 0 ? n : 1
}

export function abilityModifier(score: string | number | undefined): number {
  const n = typeof score === 'number' ? score : Number.parseInt(String(score ?? '10'), 10)
  if (!Number.isFinite(n)) return 0
  return Math.floor((n - 10) / 2)
}

/** Bardic Inspiration die by character level (PHB). */
export function bardicInspirationDie(level: string | number): string {
  const lvl = parseLevel(level)
  if (lvl >= 15) return 'd12'
  if (lvl >= 10) return 'd10'
  if (lvl >= 5) return 'd8'
  return 'd6'
}

/** Bardic Inspiration uses = Charisma modifier (minimum 1). */
export function bardicInspirationUses(charisma: string | number | undefined): number {
  return Math.max(1, abilityModifier(charisma))
}

/** Song of Rest die by character level (PHB). */
export function songOfRestDie(level: string | number): string {
  const lvl = parseLevel(level)
  if (lvl >= 17) return 'd12'
  if (lvl >= 13) return 'd10'
  if (lvl >= 9) return 'd8'
  return 'd6'
}

/** Attacks per Attack action for martial classes (Extra Attack at 5). */
export function getAttacksPerTurn(characterClass: CharacterClass, level: string | number): number {
  const lvl = parseLevel(level)
  if (characterClass === 'fighter' || characterClass === 'ranger') {
    if (lvl >= 20 && characterClass === 'fighter') return 4
    if (lvl >= 11 && characterClass === 'fighter') return 3
    if (lvl >= 5) return 2
    return 1
  }
  return 1
}

export function resolveFeatures(
  characterClass: CharacterClass,
  subclassId: SubclassId | undefined,
  level: string | number,
): ClassFeatureDef[] {
  const lvl = parseLevel(level)
  return CLASS_FEATURE_CATALOG.filter((feature) => {
    if (feature.hide) return false
    if (feature.characterClass !== characterClass) return false
    if (feature.minLevel > lvl) return false
    if (feature.subclassId && feature.subclassId !== subclassId) return false
    return true
  })
}

export function optionLabel(options: FeatureOption[] | undefined, id: string): string {
  return options?.find((o) => o.id === id)?.label ?? id
}

export function choiceLabels(feature: ClassFeatureDef, selectedIds: string[]): string[] {
  return selectedIds.map((id) => optionLabel(feature.options, id))
}

/** Choice caps that scale with character level (PHB progression). */
export function effectiveMaxChoices(feature: ClassFeatureDef, level: string | number): number {
  const lvl = parseLevel(level)
  const base = feature.maxChoices ?? 1

  if (feature.choiceKey === 'favoredEnemy') {
    if (lvl >= 14) return 3
    if (lvl >= 6) return 2
    return 1
  }
  if (feature.choiceKey === 'favoredTerrain') {
    if (lvl >= 10) return 3
    if (lvl >= 6) return 2
    return 1
  }
  if (feature.choiceKey === 'bardExpertise') {
    if (lvl >= 10) return 4
    return 2
  }
  if (feature.choiceKey === 'battleMasterManeuvers') {
    if (lvl >= 15) return 9
    if (lvl >= 10) return 7
    if (lvl >= 7) return 5
    return 3
  }
  return base
}

/** Map free-text / Portuguese fighting style to catalog id. */
export function normalizeFightingStyleId(raw: string | undefined): string | undefined {
  if (!raw?.trim()) return undefined
  const value = raw.trim().toLowerCase()
  const byId = FIGHTING_STYLES.find((o) => o.id.toLowerCase() === value)
  if (byId) return byId.id
  const byLabel = FIGHTING_STYLES.find((o) => o.label.toLowerCase() === value)
  if (byLabel) return byLabel.id
  const aliases: Record<string, string> = {
    duelista: 'dueling',
    dueling: 'dueling',
    arqueiro: 'archery',
    archery: 'archery',
    defesa: 'defense',
    defense: 'defense',
    proteção: 'protection',
    protecao: 'protection',
    protection: 'protection',
    'duas armas': 'twoWeapon',
    twoweapon: 'twoWeapon',
    'two weapon': 'twoWeapon',
    'arma grande': 'greatWeapon',
    greatweapon: 'greatWeapon',
  }
  return aliases[value] ?? aliases[value.replace(/\s+/g, ' ')]
}

/** Map free-text / Portuguese favored enemy or terrain to catalog id. */
export function normalizeOptionId(
  options: FeatureOption[],
  raw: string | undefined,
): string | undefined {
  if (!raw?.trim()) return undefined
  const value = raw.trim().toLowerCase()
  const byId = options.find((o) => o.id.toLowerCase() === value)
  if (byId) return byId.id
  const byLabel = options.find((o) => o.label.toLowerCase() === value)
  if (byLabel) return byLabel.id
  return undefined
}

/** Keep only valid option IDs and truncate to each feature's maxChoices. */
export function normalizeFeatureChoices(
  characterClass: CharacterClass,
  subclassId: SubclassId | undefined,
  level: string | number,
  choices: Record<string, string[]> | undefined,
  legacyScalars?: { favoredEnemy?: string; favoredTerrain?: string },
): Record<string, string[]> {
  const features = resolveFeatures(characterClass, subclassId, level).filter(
    (feature) => feature.kind === 'choice' && feature.choiceKey && feature.options && feature.maxChoices,
  )
  const seeded: Record<string, string[]> = { ...(choices ?? {}) }

  if (!seeded.favoredEnemy?.length && legacyScalars?.favoredEnemy) {
    const id = normalizeOptionId(
      features.find((f) => f.choiceKey === 'favoredEnemy')?.options ?? [],
      legacyScalars.favoredEnemy,
    )
    if (id) seeded.favoredEnemy = [id]
  }
  if (!seeded.favoredTerrain?.length && legacyScalars?.favoredTerrain) {
    const id = normalizeOptionId(
      features.find((f) => f.choiceKey === 'favoredTerrain')?.options ?? [],
      legacyScalars.favoredTerrain,
    )
    if (id) seeded.favoredTerrain = [id]
  }

  const next: Record<string, string[]> = {}

  for (const feature of features) {
    const key = feature.choiceKey!
    const validIds = new Set(feature.options!.map((option) => option.id))
    const selected = seeded[key] ?? []
    const cleaned = selected.filter((id) => validIds.has(id)).slice(0, effectiveMaxChoices(feature, level))
    if (cleaned.length > 0) {
      next[key] = cleaned
    }
  }

  return next
}

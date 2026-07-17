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

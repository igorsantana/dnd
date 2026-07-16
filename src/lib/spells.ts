import type { CharacterClass } from '../data/profiles'
import catalog from '../data/spell-catalog.json'
import type { SpellCatalogEntry } from '../types/spells'

const CLASS_FILTER: Record<CharacterClass, string> = {
  wizard: 'Wizard',
  bard: 'Bard',
  ranger: 'Ranger',
  fighter: '',
}

const spells = catalog as SpellCatalogEntry[]

export function getSpellsForClass(characterClass: CharacterClass): SpellCatalogEntry[] {
  const className = CLASS_FILTER[characterClass]
  if (!className) return []
  return spells.filter((s) => s.classes.includes(className))
}

export function getSpellById(id: string): SpellCatalogEntry | undefined {
  return spells.find((s) => s.id === id)
}

export function searchSpells(
  characterClass: CharacterClass,
  query: string,
  cantripsOnly: boolean,
): SpellCatalogEntry[] {
  const q = query.trim().toLowerCase()
  return getSpellsForClass(characterClass).filter((s) => {
    if (cantripsOnly ? s.level !== 0 : s.level === 0) return false
    if (!q) return true
    return (
      s.name.toLowerCase().includes(q) ||
      s.nameEn.toLowerCase().includes(q) ||
      s.school.toLowerCase().includes(q)
    )
  })
}

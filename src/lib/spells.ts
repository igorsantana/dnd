import type { CharacterClass } from '../data/profiles'
import catalog from '../data/spell-catalog.json'
import type { SpellCatalogEntry } from '../types/spells'

const CLASS_FILTER: Record<CharacterClass, string> = {
  wizard: 'Wizard',
  bard: 'Bard',
  ranger: 'Ranger',
  fighter: '',
}

/** Genie (Djinni) expanded spell list granted at Warlock 1 (2014). */
const GENIE_EXPANDED_SPELL_NAMES = new Set(['Detect Evil and Good', 'Thunderwave'])

const spells = catalog as SpellCatalogEntry[]

function matches(
  entries: SpellCatalogEntry[],
  query: string,
  cantripsOnly: boolean,
): SpellCatalogEntry[] {
  const q = query.trim().toLowerCase()
  return entries.filter((s) => {
    if (cantripsOnly ? s.level !== 0 : s.level === 0) return false
    if (!q) return true
    return (
      s.name.toLowerCase().includes(q) ||
      s.nameEn.toLowerCase().includes(q) ||
      s.school.toLowerCase().includes(q)
    )
  })
}

function uniqueById(entries: SpellCatalogEntry[]): SpellCatalogEntry[] {
  const byId = new Map<string, SpellCatalogEntry>()
  for (const s of entries) byId.set(s.id, s)
  return [...byId.values()]
}

export function getSpellsForClass(characterClass: CharacterClass): SpellCatalogEntry[] {
  const className = CLASS_FILTER[characterClass]
  if (!className) return []
  return spells.filter((s) => s.classes.includes(className))
}

/** Warlock spell list plus the Genie (Djinni) expanded spells. */
export function getWarlockSpells(): SpellCatalogEntry[] {
  const warlock = spells.filter((s) => s.classes.includes('Warlock'))
  const expanded = spells.filter((s) => GENIE_EXPANDED_SPELL_NAMES.has(s.nameEn))
  return uniqueById([...warlock, ...expanded])
}

/** True when a catalog entry comes from the warlock list or the Genie expanded list. */
export function isWarlockCatalogEntry(entry: SpellCatalogEntry): boolean {
  return entry.classes.includes('Warlock') || GENIE_EXPANDED_SPELL_NAMES.has(entry.nameEn)
}

/** True when a saved spell comes from the warlock list or the Genie expanded list. */
export function isWarlockSpell(spell: { catalogId?: string }): boolean {
  if (!spell.catalogId) return false
  const entry = getSpellById(spell.catalogId)
  if (!entry) return false
  return isWarlockCatalogEntry(entry)
}

export function getSpellById(id: string): SpellCatalogEntry | undefined {
  return spells.find((s) => s.id === id)
}

export function searchSpells(
  characterClass: CharacterClass,
  query: string,
  cantripsOnly: boolean,
  includeWarlock = false,
): SpellCatalogEntry[] {
  const entries = includeWarlock
    ? uniqueById([...getSpellsForClass(characterClass), ...getWarlockSpells()])
    : getSpellsForClass(characterClass)
  return matches(entries, query, cantripsOnly)
}

import { MAGIC_ITEM_CATALOG, type MagicItemCatalogEntry } from '../data/magic-item-catalog'
import type { MagicItem } from '../types/character'

function flattenEntries(
  entries: MagicItemCatalogEntry['document']['entries'] | undefined,
): string[] {
  if (!entries?.length) return []
  const lines: string[] = []
  for (const entry of entries) {
    if (typeof entry === 'string') {
      const text = entry.trim()
      if (text) lines.push(text)
      continue
    }
    const nested = (entry.entries ?? []).map((line) => line.trim()).filter(Boolean)
    if (!nested.length) continue
    if (entry.name?.trim()) {
      lines.push(`${entry.name.trim()}: ${nested.join(' ')}`)
    } else {
      lines.push(...nested)
    }
  }
  return lines
}

function formatStats(entry: MagicItemCatalogEntry): string {
  const doc = entry.document
  const bits: string[] = [
    `${doc.type} · ${doc.rarity}${doc.reqAttune ? ' · requer sintonização' : ''}`,
  ]
  if (doc.ac != null) {
    bits.push(`CA ${doc.ac}${doc.bonusAc ? ` (${doc.bonusAc})` : ''}`)
  }
  if (doc.bonusWeapon) bits.push(`Ataque/dano ${doc.bonusWeapon}`)
  if (doc.dmg1) {
    const dmgType =
      doc.dmgType === 'S' ? 'cortante' : doc.dmgType === 'B' ? 'concussão' : doc.dmgType === 'P' ? 'perfurante' : doc.dmgType
    bits.push(`Dano ${doc.dmg1}${dmgType ? ` ${dmgType}` : ''}`)
  }
  if (doc.property?.length) bits.push(doc.property.join(', '))
  if (doc.resist?.length) bits.push(`Resistência: ${doc.resist.join(', ')}`)
  if (doc.stealth) bits.push('Desvantagem em Furtividade')
  if (doc.weight != null) bits.push(`${doc.weight} lb`)
  return bits.join(' · ')
}

export function formatMagicItemDescription(entry: MagicItemCatalogEntry): string {
  const parts = [formatStats(entry), ...flattenEntries(entry.document.entries)]
  const lore = entry.extensions?.lore?.background?.trim()
  if (lore) parts.push(`Lore:\n${lore}`)
  return parts.join('\n\n')
}

export function catalogEntryToMagicItem(entry: MagicItemCatalogEntry): MagicItem {
  return {
    id: crypto.randomUUID(),
    catalogId: entry.id,
    name: entry.name,
    description: formatMagicItemDescription(entry),
    attuned: false,
    equipped: false,
    personal: false,
  }
}

export function getMagicItemCatalog(): MagicItemCatalogEntry[] {
  return MAGIC_ITEM_CATALOG
}

export function getMagicItemById(id: string): MagicItemCatalogEntry | undefined {
  return MAGIC_ITEM_CATALOG.find((entry) => entry.id === id)
}

export function characterHasCatalogItem(character: { magicItems?: MagicItem[] }, catalogId: string): boolean {
  return (character.magicItems ?? []).some(
    (item) => item.catalogId === catalogId || item.name === getMagicItemById(catalogId)?.name,
  )
}

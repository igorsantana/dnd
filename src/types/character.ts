import type { CharacterClass, SubclassId } from '../data/profiles'
import { getSpellById } from '../lib/spells'
import { normalizeFeatureChoices, normalizeFightingStyleId } from '../lib/class-features'

export interface Attack {
  id: string
  name: string
  bonus: string
  damage: string
  damageType: string
  notes: string
}

export interface MagicItem {
  id: string
  name: string
  description: string
  attuned: boolean
}

export interface InventoryItem {
  id: string
  name: string
  quantity: string
  notes: string
}

export interface Currency {
  copper: string
  silver: string
  electrum: string
  gold: string
  platinum: string
}

export interface AbilityScores {
  strength: string
  dexterity: string
  constitution: string
  intelligence: string
  wisdom: string
  charisma: string
}

export interface Spell {
  id: string
  catalogId?: string
  name: string
  level: string
  school: string
  notes: string
  prepared: boolean
  isCantrip: boolean
}

export interface SpellSlotLevel {
  total: string
  used: string
}

export type SpellSlots = Record<string, SpellSlotLevel>

export interface ClassFeatures {
  fightingStyle?: string
  secondWind?: string
  actionSurgeUses?: string
  extraAttack?: string
  bardicInspirationDie?: string
  bardicInspirationUses?: string
  jackOfAllTrades?: string
  favoredEnemy?: string
  favoredTerrain?: string
  arcaneRecovery?: string
  spellbookNotes?: string
  ritualCasting?: boolean
  /** Multi-select feature choices keyed by feature choiceKey */
  choices?: Record<string, string[]>
}

export interface Character {
  id: string
  profileId?: string
  updatedAt: string
  name: string
  playerName: string
  class: string
  subclass: string
  race: string
  background: string
  level: string
  alignment: string
  abilities: AbilityScores
  hpMax: string
  hpCurrent: string
  armorClass: string
  speed: string
  initiative: string
  proficiencyBonus: string
  spellAttackBonus: string
  spellSaveDC: string
  attacks: Attack[]
  magicItems: MagicItem[]
  currency: Currency
  inventory: InventoryItem[]
  notes: string
  spells: Spell[]
  spellSlots: SpellSlots
  classFeatures: ClassFeatures
}

export function defaultSpellSlotsForClass(characterClass: CharacterClass): SpellSlots {
  switch (characterClass) {
    case 'wizard':
    case 'bard':
      return {
        '1': { total: '4', used: '0' },
        '2': { total: '3', used: '0' },
        '3': { total: '2', used: '0' },
      }
    case 'ranger':
      return {
        '1': { total: '4', used: '0' },
        '2': { total: '2', used: '0' },
      }
    default:
      return {}
  }
}

export function defaultClassFeatures(characterClass: CharacterClass): ClassFeatures {
  switch (characterClass) {
    case 'wizard':
      return { ritualCasting: true, arcaneRecovery: '', spellbookNotes: '' }
    case 'bard':
      return { bardicInspirationDie: 'd8', bardicInspirationUses: '', jackOfAllTrades: '+1' }
    case 'ranger':
      return { favoredEnemy: '', favoredTerrain: '', fightingStyle: '' }
    case 'fighter':
      return {
        secondWind: '1d10+5',
        actionSurgeUses: '1',
        extraAttack: '2',
        fightingStyle: '',
      }
  }
}

export function createEmptyCharacter(): Character {
  return {
    id: crypto.randomUUID(),
    updatedAt: new Date().toISOString(),
    name: '',
    playerName: '',
    class: '',
    subclass: '',
    race: '',
    background: '',
    level: '5',
    alignment: '',
    abilities: {
      strength: '10',
      dexterity: '10',
      constitution: '10',
      intelligence: '10',
      wisdom: '10',
      charisma: '10',
    },
    hpMax: '',
    hpCurrent: '',
    armorClass: '',
    speed: '30',
    initiative: '',
    proficiencyBonus: '+3',
    spellAttackBonus: '',
    spellSaveDC: '',
    attacks: [],
    magicItems: [],
    currency: {
      copper: '0',
      silver: '0',
      electrum: '0',
      gold: '0',
      platinum: '0',
    },
    inventory: [],
    notes: '',
    spells: [],
    spellSlots: {},
    classFeatures: {},
  }
}

function isLegacySpellAttackEntry(attack: Attack): boolean {
  const name = attack.name.trim().replace(/\s+/g, ' ').toUpperCase()
  return (
    name.includes('SPELL ATTACK') &&
    (name.includes('SAVE DC') || name.includes('SPELL SAVE'))
  )
}

function canonicalizeSpell(spell: Spell): Spell {
  if (!spell.catalogId) return spell
  const entry = getSpellById(spell.catalogId)
  if (!entry) return spell
  return {
    ...spell,
    name: entry.name,
    school: entry.school,
    level: String(entry.level),
    isCantrip: entry.level === 0,
  }
}

const TEXT_REPAIRS: Array<[RegExp, string]> = [
  [/Charlat\uFFFDo/g, 'Charlatão'],
  [/ala\uFFFDde/g, 'alaúde'],
  [/m\uFFFDgico/g, 'mágico'],
  [/at\uFFFD /g, 'até '],
  [/d\uFFFD pra/g, 'dá pra'],
  [/fuma\uFFFDa/g, 'fumaça'],
  [/Ilus\uFFFDo/g, 'Ilusão'],
  [/Disfar\uFFFDar-se/g, 'Disfarçar-se'],
  [/Sugest\uFFFDo/g, 'Sugestão'],
  [/Padr\uFFFDo/g, 'Padrão'],
  [/Hipn\uFFFDtico/g, 'Hipnótico'],
  [/Transmuta\uFFFD\uFFFDo/g, 'Transmutação'],
  [/Evoca\uFFFD\uFFFDo/g, 'Evocação'],
]

function repairCorruptedText(value: string | undefined): string {
  if (!value) return value ?? ''
  return TEXT_REPAIRS.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value)
}

function repairMagicItems(items: MagicItem[] | undefined): MagicItem[] {
  return (items ?? []).map((item) => ({
    ...item,
    name: repairCorruptedText(item.name),
    description: repairCorruptedText(item.description),
  }))
}

export function mergeCharacterDefaults(
  character: Character,
  characterClass: CharacterClass,
  classLabel: string,
  subclassLabel?: string,
  subclassId?: SubclassId,
): Character {
  const isGeraldo =
    character.profileId === 'antunes' ||
    (character.name?.trim().toLowerCase() === 'geraldo' &&
      character.playerName?.trim().toLowerCase() === 'antunes')
  const attacks = (character.attacks ?? []).filter((attack) => !isLegacySpellAttackEntry(attack))
  const existingChoices = { ...(character.classFeatures?.choices ?? {}) }

  // Sync legacy fightingStyle scalar into choices if present
  const rawFightingStyle =
    existingChoices.fightingStyle?.[0] ?? character.classFeatures?.fightingStyle ?? ''
  const normalizedStyle = normalizeFightingStyleId(rawFightingStyle)
  if (normalizedStyle) {
    existingChoices.fightingStyle = [normalizedStyle]
  }

  const normalizedChoices = normalizeFeatureChoices(
    characterClass,
    subclassId,
    character.level || '5',
    existingChoices,
  )

  const spells = (character.spells ?? []).map((spell) =>
    canonicalizeSpell({
      ...spell,
      name: repairCorruptedText(spell.name),
      school: repairCorruptedText(spell.school),
      notes: repairCorruptedText(spell.notes),
    }),
  )

  return {
    ...createEmptyCharacter(),
    ...character,
    class: character.class || classLabel,
    // Prefer profile subclass label so mangled cloud/free-text never sticks
    subclass: subclassLabel?.trim() || character.subclass?.trim() || '',
    background: repairCorruptedText(character.background),
    notes: repairCorruptedText(character.notes),
    attacks,
    magicItems: repairMagicItems(character.magicItems),
    spellAttackBonus: character.spellAttackBonus || (isGeraldo ? '+7' : ''),
    spellSaveDC: character.spellSaveDC || (isGeraldo ? '15' : ''),
    spells,
    spellSlots:
      character.spellSlots && Object.keys(character.spellSlots).length > 0
        ? character.spellSlots
        : defaultSpellSlotsForClass(characterClass),
    classFeatures: {
      ...defaultClassFeatures(characterClass),
      ...character.classFeatures,
      ...(normalizedStyle ? { fightingStyle: normalizedStyle } : {}),
      choices: normalizedChoices,
    },
  }
}

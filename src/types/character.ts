import type { CharacterClass } from '../data/profiles'

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

export function mergeCharacterDefaults(
  character: Character,
  characterClass: CharacterClass,
  classLabel: string,
): Character {
  return {
    ...createEmptyCharacter(),
    ...character,
    class: character.class || classLabel,
    spells: character.spells ?? [],
    spellSlots:
      character.spellSlots && Object.keys(character.spellSlots).length > 0
        ? character.spellSlots
        : defaultSpellSlotsForClass(characterClass),
    classFeatures: {
      ...defaultClassFeatures(characterClass),
      ...character.classFeatures,
    },
  }
}

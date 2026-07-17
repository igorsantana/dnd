import type { CharacterClass } from './profiles'
import type { SubclassId } from './profiles'

export type FeatureKind = 'info' | 'value' | 'choice'

export interface FeatureOption {
  id: string
  label: string
}

export interface ClassFeatureDef {
  id: string
  characterClass: CharacterClass
  subclassId?: SubclassId
  minLevel: number
  kind: FeatureKind
  /** i18n key under pt.features */
  labelKey: string
  detailKey?: string
  valueKey?: keyof import('../types/character').ClassFeatures
  choiceKey?: string
  maxChoices?: number
  options?: FeatureOption[]
  /** Hide from feature lists (ASI, Extra Attack as named feature, etc.) */
  hide?: boolean
}

export const FIGHTING_STYLES: FeatureOption[] = [
  { id: 'archery', label: 'Arqueiro' },
  { id: 'defense', label: 'Defesa' },
  { id: 'dueling', label: 'Duelista' },
  { id: 'greatWeapon', label: 'Combate com Arma Grande' },
  { id: 'protection', label: 'Proteção' },
  { id: 'twoWeapon', label: 'Combate com Duas Armas' },
]

export const BARD_EXPERTISE_SKILLS: FeatureOption[] = [
  { id: 'acrobatics', label: 'Acrobacia' },
  { id: 'animalHandling', label: 'Adestrar Animais' },
  { id: 'arcana', label: 'Arcanismo' },
  { id: 'athletics', label: 'Atletismo' },
  { id: 'deception', label: 'Enganação' },
  { id: 'history', label: 'História' },
  { id: 'insight', label: 'Intuição' },
  { id: 'intimidation', label: 'Intimidação' },
  { id: 'investigation', label: 'Investigação' },
  { id: 'medicine', label: 'Medicina' },
  { id: 'nature', label: 'Natureza' },
  { id: 'perception', label: 'Percepção' },
  { id: 'performance', label: 'Atuação' },
  { id: 'persuasion', label: 'Persuasão' },
  { id: 'religion', label: 'Religião' },
  { id: 'sleightOfHand', label: 'Prestidigitação' },
  { id: 'stealth', label: 'Furtividade' },
  { id: 'survival', label: 'Sobrevivência' },
]

export const SAMURAI_BONUS: FeatureOption[] = [
  { id: 'history', label: 'História' },
  { id: 'insight', label: 'Intuição' },
  { id: 'performance', label: 'Atuação' },
  { id: 'persuasion', label: 'Persuasão' },
  { id: 'language', label: 'Um idioma à escolha' },
]

export const BATTLE_MASTER_MANEUVERS: FeatureOption[] = [
  { id: 'commandersStrike', label: 'Ataque do Comandante' },
  { id: 'disarmingAttack', label: 'Ataque Desarmador' },
  { id: 'distractingStrike', label: 'Golpe Distrativo' },
  { id: 'evasiveFootwork', label: 'Pés Evasivos' },
  { id: 'feintingAttack', label: 'Ataque Fintado' },
  { id: 'goadingAttack', label: 'Ataque Provocador' },
  { id: 'lungingAttack', label: 'Ataque Avançado' },
  { id: 'maneuveringAttack', label: 'Ataque de Manobra' },
  { id: 'menacingAttack', label: 'Ataque Amedrontador' },
  { id: 'parry', label: 'Aparar' },
  { id: 'precisionAttack', label: 'Ataque Preciso' },
  { id: 'pushingAttack', label: 'Ataque Empurrão' },
  { id: 'rally', label: 'Reagrupar' },
  { id: 'riposte', label: 'Ripostar' },
  { id: 'sweepingAttack', label: 'Ataque Amplificado' },
  { id: 'tripAttack', label: 'Ataque de Queda' },
]

/** Catalog of features. Hidden entries exist for completeness but are filtered out. */
export const CLASS_FEATURE_CATALOG: ClassFeatureDef[] = [
  // --- Bard ---
  {
    id: 'bardicInspiration',
    characterClass: 'bard',
    minLevel: 1,
    kind: 'value',
    labelKey: 'bardicInspirationMax',
    detailKey: 'bardicInspirationDetail',
    valueKey: 'bardicInspirationUses',
  },
  {
    id: 'jackOfAllTrades',
    characterClass: 'bard',
    minLevel: 2,
    kind: 'info',
    labelKey: 'jackOfAllTrades',
    detailKey: 'jackOfAllTradesDetail',
  },
  {
    id: 'songOfRest',
    characterClass: 'bard',
    minLevel: 2,
    kind: 'info',
    labelKey: 'songOfRest',
    detailKey: 'songOfRestDetail',
  },
  {
    id: 'bardExpertise',
    characterClass: 'bard',
    minLevel: 3,
    kind: 'choice',
    labelKey: 'bardExpertise',
    detailKey: 'bardExpertiseDetail',
    choiceKey: 'bardExpertise',
    maxChoices: 2,
    options: BARD_EXPERTISE_SKILLS,
  },
  {
    id: 'fontOfInspiration',
    characterClass: 'bard',
    minLevel: 5,
    kind: 'info',
    labelKey: 'fontOfInspiration',
    detailKey: 'fontOfInspirationDetail',
  },
  {
    id: 'silverTongue',
    characterClass: 'bard',
    subclassId: 'eloquence',
    minLevel: 3,
    kind: 'info',
    labelKey: 'silverTongue',
    detailKey: 'silverTongueDetail',
  },
  {
    id: 'unsettlingWords',
    characterClass: 'bard',
    subclassId: 'eloquence',
    minLevel: 3,
    kind: 'info',
    labelKey: 'unsettlingWords',
    detailKey: 'unsettlingWordsDetail',
  },

  // --- Fighter shared ---
  {
    id: 'fightingStyleFighter',
    characterClass: 'fighter',
    minLevel: 1,
    kind: 'choice',
    labelKey: 'fightingStyle',
    choiceKey: 'fightingStyle',
    maxChoices: 1,
    options: FIGHTING_STYLES,
  },
  {
    id: 'secondWind',
    characterClass: 'fighter',
    minLevel: 1,
    kind: 'info',
    labelKey: 'secondWind',
    detailKey: 'secondWindDetail',
  },
  {
    id: 'actionSurge',
    characterClass: 'fighter',
    minLevel: 2,
    kind: 'info',
    labelKey: 'actionSurge',
    detailKey: 'actionSurgeDetail',
  },

  // Battle Master
  {
    id: 'combatSuperiority',
    characterClass: 'fighter',
    subclassId: 'battleMaster',
    minLevel: 3,
    kind: 'info',
    labelKey: 'combatSuperiority',
    detailKey: 'combatSuperiorityDetail',
  },
  {
    id: 'battleMasterManeuvers',
    characterClass: 'fighter',
    subclassId: 'battleMaster',
    minLevel: 3,
    kind: 'choice',
    labelKey: 'battleMasterManeuvers',
    detailKey: 'battleMasterManeuversDetail',
    choiceKey: 'battleMasterManeuvers',
    maxChoices: 3,
    options: BATTLE_MASTER_MANEUVERS,
  },
  {
    id: 'studentOfWar',
    characterClass: 'fighter',
    subclassId: 'battleMaster',
    minLevel: 3,
    kind: 'info',
    labelKey: 'studentOfWar',
    detailKey: 'studentOfWarDetail',
  },

  // Samurai
  {
    id: 'samuraiBonus',
    characterClass: 'fighter',
    subclassId: 'samurai',
    minLevel: 3,
    kind: 'choice',
    labelKey: 'samuraiBonus',
    detailKey: 'samuraiBonusDetail',
    choiceKey: 'samuraiBonus',
    maxChoices: 1,
    options: SAMURAI_BONUS,
  },
  {
    id: 'fightingSpirit',
    characterClass: 'fighter',
    subclassId: 'samurai',
    minLevel: 3,
    kind: 'info',
    labelKey: 'fightingSpirit',
    detailKey: 'fightingSpiritDetail',
  },

  // --- Wizard ---
  {
    id: 'arcaneRecovery',
    characterClass: 'wizard',
    minLevel: 1,
    kind: 'value',
    labelKey: 'arcaneRecovery',
    valueKey: 'arcaneRecovery',
  },
  {
    id: 'ritualCasting',
    characterClass: 'wizard',
    minLevel: 1,
    kind: 'info',
    labelKey: 'ritualCasting',
  },
  {
    id: 'arcaneWard',
    characterClass: 'wizard',
    subclassId: 'abjuration',
    minLevel: 2,
    kind: 'info',
    labelKey: 'arcaneWard',
    detailKey: 'arcaneWardDetail',
  },

  // --- Ranger ---
  {
    id: 'favoredEnemy',
    characterClass: 'ranger',
    minLevel: 1,
    kind: 'value',
    labelKey: 'favoredEnemy',
    valueKey: 'favoredEnemy',
  },
  {
    id: 'naturalExplorer',
    characterClass: 'ranger',
    minLevel: 1,
    kind: 'value',
    labelKey: 'favoredTerrain',
    valueKey: 'favoredTerrain',
  },
  {
    id: 'fightingStyleRanger',
    characterClass: 'ranger',
    minLevel: 2,
    kind: 'choice',
    labelKey: 'fightingStyle',
    choiceKey: 'fightingStyle',
    maxChoices: 1,
    options: FIGHTING_STYLES.filter((o) =>
      ['archery', 'defense', 'dueling', 'twoWeapon'].includes(o.id),
    ),
  },
  {
    id: 'primevalAwareness',
    characterClass: 'ranger',
    minLevel: 3,
    kind: 'info',
    labelKey: 'primevalAwareness',
    detailKey: 'primevalAwarenessDetail',
  },
  {
    id: 'dreadAmbusher',
    characterClass: 'ranger',
    subclassId: 'gloomStalker',
    minLevel: 3,
    kind: 'info',
    labelKey: 'dreadAmbusher',
    detailKey: 'dreadAmbusherDetail',
  },
  {
    id: 'umbralSight',
    characterClass: 'ranger',
    subclassId: 'gloomStalker',
    minLevel: 3,
    kind: 'info',
    labelKey: 'umbralSight',
    detailKey: 'umbralSightDetail',
  },
  {
    id: 'gloomStalkerMagic',
    characterClass: 'ranger',
    subclassId: 'gloomStalker',
    minLevel: 3,
    kind: 'info',
    labelKey: 'gloomStalkerMagic',
    detailKey: 'gloomStalkerMagicDetail',
  },
]

export type CharacterClass = 'wizard' | 'bard' | 'ranger' | 'fighter'

export type SubclassId =
  | 'abjuration'
  | 'eloquence'
  | 'gloomStalker'
  | 'battleMaster'
  | 'samurai'

export interface PlayerProfile {
  id: string
  playerName: string
  characterName: string
  characterClass: CharacterClass
  classLabel: string
  subclassId: SubclassId
  subclassLabel: string
  image: string
  accentColor: string
}

export const PLAYER_PROFILES: PlayerProfile[] = [
  {
    id: 'honda',
    playerName: 'Honda',
    characterName: 'Yohann',
    characterClass: 'wizard',
    classLabel: 'Mago',
    subclassId: 'abjuration',
    subclassLabel: 'Abjuração',
    image: '/profiles/honda.png',
    accentColor: '#4a7cff',
  },
  {
    id: 'antunes',
    playerName: 'Antunes',
    characterName: 'Geraldo',
    characterClass: 'bard',
    classLabel: 'Bardo',
    subclassId: 'eloquence',
    subclassLabel: 'Eloquência',
    image: '/profiles/antunes.png',
    accentColor: '#c44dff',
  },
  {
    id: 'keiti',
    playerName: 'Keiti',
    characterName: 'Wellby',
    characterClass: 'ranger',
    classLabel: 'Patrulheiro',
    subclassId: 'gloomStalker',
    subclassLabel: 'Gloom Stalker',
    image: '/profiles/keiti.png',
    accentColor: '#3dba6a',
  },
  {
    id: 'rafael',
    playerName: 'Rafael',
    characterName: 'Sebastião',
    characterClass: 'fighter',
    classLabel: 'Guerreiro',
    subclassId: 'battleMaster',
    subclassLabel: 'Battle Master',
    image: '/profiles/rafael.png',
    accentColor: '#e85d4c',
  },
  {
    id: 'leozin',
    playerName: 'Leozin',
    characterName: 'Kaneh',
    characterClass: 'fighter',
    classLabel: 'Guerreiro',
    subclassId: 'samurai',
    subclassLabel: 'Samurai',
    image: '/profiles/leozin.png',
    accentColor: '#f0a030',
  },
]

export function getProfileById(id: string): PlayerProfile | undefined {
  return PLAYER_PROFILES.find((p) => p.id === id)
}

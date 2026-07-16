export type CharacterClass = 'wizard' | 'bard' | 'ranger' | 'fighter'

export interface PlayerProfile {
  id: string
  playerName: string
  characterName: string
  characterClass: CharacterClass
  classLabel: string
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
    image: '/profiles/honda.png',
    accentColor: '#4a7cff',
  },
  {
    id: 'antunes',
    playerName: 'Antunes',
    characterName: 'Geraldo',
    characterClass: 'bard',
    classLabel: 'Bardo',
    image: '/profiles/antunes.png',
    accentColor: '#c44dff',
  },
  {
    id: 'keiti',
    playerName: 'Keiti',
    characterName: 'Wellby',
    characterClass: 'ranger',
    classLabel: 'Patrulheiro',
    image: '/profiles/keiti.png',
    accentColor: '#3dba6a',
  },
  {
    id: 'rafael',
    playerName: 'Rafael',
    characterName: 'Sebastião',
    characterClass: 'fighter',
    classLabel: 'Guerreiro',
    image: '/profiles/rafael.png',
    accentColor: '#e85d4c',
  },
  {
    id: 'leozin',
    playerName: 'Leozin',
    characterName: 'Kaneh',
    characterClass: 'fighter',
    classLabel: 'Guerreiro',
    image: '/profiles/leozin.png',
    accentColor: '#f0a030',
  },
]

export function getProfileById(id: string): PlayerProfile | undefined {
  return PLAYER_PROFILES.find((p) => p.id === id)
}

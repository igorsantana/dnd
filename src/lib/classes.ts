import type { CharacterClass } from '../data/profiles'

export function isCasterClass(characterClass: CharacterClass): boolean {
  return characterClass !== 'fighter'
}

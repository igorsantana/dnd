import type { Character } from '../types/character'
import { getAdminPassword, getPlayerPassword } from './auth'

const API_URL = '/api/characters'

function characterKey(character: Character): string {
  return character.profileId || character.id
}

export function mergeCharacterLists(...sources: Character[][]): Character[] {
  const map = new Map<string, Character>()

  for (const list of sources) {
    for (const character of list) {
      if (!character?.id || !character?.name) continue
      const key = characterKey(character)
      const existing = map.get(key)
      if (!existing || new Date(character.updatedAt) > new Date(existing.updatedAt)) {
        map.set(key, character)
      }
    }
  }

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export async function pushCharacterToCloud(character: Character): Promise<boolean> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getPlayerPassword()}`,
      },
      body: JSON.stringify(character),
    })
    return response.ok
  } catch {
    return false
  }
}

export async function fetchCharactersFromCloud(): Promise<{
  characters: Character[]
  available: boolean
}> {
  try {
    const response = await fetch(API_URL, {
      headers: {
        Authorization: `Bearer ${getAdminPassword()}`,
      },
    })
    if (response.status === 503) {
      return { characters: [], available: false }
    }
    if (!response.ok) {
      return { characters: [], available: false }
    }
    const data = (await response.json()) as Character[]
    return { characters: Array.isArray(data) ? data : [], available: true }
  } catch {
    return { characters: [], available: false }
  }
}

export async function deleteCharacterFromCloud(character: Character): Promise<boolean> {
  const id = characterKey(character)
  try {
    const response = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${getAdminPassword()}`,
      },
    })
    return response.ok
  } catch {
    return false
  }
}

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

/** Prefer newer complete records; cloud wins ties or invalid local timestamps. */
export function pickNewerCharacter(
  local: Character | undefined,
  cloud: Character | undefined,
): Character | undefined {
  if (!local) return cloud
  if (!cloud) return local

  const localTime = Date.parse(local.updatedAt)
  const cloudTime = Date.parse(cloud.updatedAt)
  const localValid = Number.isFinite(localTime)
  const cloudValid = Number.isFinite(cloudTime)

  if (localValid && cloudValid) {
    return cloudTime >= localTime ? cloud : local
  }
  if (cloudValid) return cloud
  if (localValid) return local
  return cloud
}

export async function pushCharacterToCloud(character: Character): Promise<Character | null> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getPlayerPassword()}`,
      },
      body: JSON.stringify(character),
    })
    if (!response.ok) return null
    return (await response.json()) as Character
  } catch {
    return null
  }
}

export async function fetchCharacterFromCloud(profileId: string): Promise<{
  character: Character | null
  available: boolean
  notFound: boolean
}> {
  try {
    const response = await fetch(`${API_URL}?profileId=${encodeURIComponent(profileId)}`, {
      headers: {
        Authorization: `Bearer ${getPlayerPassword()}`,
      },
    })
    if (response.status === 503) {
      return { character: null, available: false, notFound: false }
    }
    if (response.status === 404) {
      return { character: null, available: true, notFound: true }
    }
    if (!response.ok) {
      return { character: null, available: false, notFound: false }
    }
    const data = (await response.json()) as Character
    if (!data?.id || !data?.name) {
      return { character: null, available: true, notFound: true }
    }
    return { character: data, available: true, notFound: false }
  } catch {
    return { character: null, available: false, notFound: false }
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

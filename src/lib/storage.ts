import type { Character } from '../types/character'

const STORAGE_KEY = 'dnd-character-sheets'

export function loadAllCharacters(): Character[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Character[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveCharacter(character: Character): Character {
  const characters = loadAllCharacters()
  const updated: Character = {
    ...character,
    updatedAt: new Date().toISOString(),
  }

  const index = characters.findIndex((c) => c.id === updated.id)
  if (index >= 0) {
    characters[index] = updated
  } else {
    characters.push(updated)
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(characters))
  return updated
}

export function deleteCharacter(id: string): void {
  const characters = loadAllCharacters().filter((c) => c.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(characters))
}

export function importCharacters(data: Character[]): number {
  const existing = loadAllCharacters()
  const byId = new Map(existing.map((c) => [c.id, c]))
  let imported = 0

  for (const character of data) {
    if (!character?.id || !character?.name) continue
    byId.set(character.id, character)
    imported++
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify([...byId.values()]))
  return imported
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

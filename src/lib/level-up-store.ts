import type { LevelUpNoticePayload } from '../types/character'
import type { LevelUpPreview } from './level-up'

const STORAGE_KEY = 'dnd-level-up-event'
const NOTICE_MS = 7 * 24 * 60 * 60 * 1000

export type LevelUpNotice = {
  characterName: string
  fromLevel: number
  toLevel: number
  additions: string[]
}

export interface LevelUpEvent {
  leveledAt: string
  fromLevel: number
  toLevel: number
  notices: Record<string, LevelUpNotice>
}

function isFresh(leveledAt: string | undefined): boolean {
  if (!leveledAt) return false
  const age = Date.now() - new Date(leveledAt).getTime()
  return Number.isFinite(age) && age >= 0 && age <= NOTICE_MS
}

export function loadLevelUpEvent(): LevelUpEvent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LevelUpEvent
    if (!parsed?.leveledAt || !parsed.notices) return null
    const age = Date.now() - new Date(parsed.leveledAt).getTime()
    if (!Number.isFinite(age) || age > NOTICE_MS) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function saveLevelUpEvent(previews: LevelUpPreview[]): LevelUpEvent {
  const notices: LevelUpEvent['notices'] = {}
  for (const preview of previews) {
    const key = preview.profileId ?? preview.characterId
    notices[key] = {
      characterName: preview.characterName,
      fromLevel: preview.fromLevel,
      toLevel: preview.toLevel,
      additions: preview.additions,
    }
  }
  const event: LevelUpEvent = {
    leveledAt: new Date().toISOString(),
    fromLevel: previews[0]?.fromLevel ?? 5,
    toLevel: previews[0]?.toLevel ?? 6,
    notices,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(event))
  return event
}

export function getActiveNoticeForProfile(profileId: string): LevelUpNotice | null {
  const event = loadLevelUpEvent()
  if (!event || !isFresh(event.leveledAt)) return null
  return event.notices[profileId] ?? null
}

/** Prefer cloud-backed notice on the character (works across devices). */
export function getNoticeFromCharacter(
  character: { levelUpNotice?: LevelUpNoticePayload | null; name?: string } | null | undefined,
): LevelUpNotice | null {
  const notice = character?.levelUpNotice
  if (!notice || !isFresh(notice.leveledAt)) return null
  return {
    characterName: notice.characterName || character?.name || '',
    fromLevel: notice.fromLevel,
    toLevel: notice.toLevel,
    additions: notice.additions ?? [],
  }
}

export function buildNoticePayload(
  characterName: string,
  fromLevel: number,
  toLevel: number,
  additions: string[],
): LevelUpNoticePayload {
  return {
    characterName,
    fromLevel,
    toLevel,
    additions,
    leveledAt: new Date().toISOString(),
  }
}

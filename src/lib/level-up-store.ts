import type { LevelUpPreview } from './level-up'

const STORAGE_KEY = 'dnd-level-up-event'
const NOTICE_MS = 7 * 24 * 60 * 60 * 1000

export interface LevelUpEvent {
  leveledAt: string
  fromLevel: number
  toLevel: number
  notices: Record<
    string,
    {
      characterName: string
      fromLevel: number
      toLevel: number
      additions: string[]
    }
  >
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

export function getActiveNoticeForProfile(profileId: string) {
  const event = loadLevelUpEvent()
  if (!event) return null
  const notice = event.notices[profileId]
  return notice ?? null
}

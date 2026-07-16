export type AuthRole = 'player' | 'admin'

const SESSION_KEY = 'dnd-auth-role'
const PROFILE_KEY = 'dnd-profile-id'

function envPassword(name: 'VITE_PLAYER_PASSWORD' | 'VITE_ADMIN_PASSWORD', fallback: string): string {
  const value = import.meta.env[name]
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

const PLAYER_PASSWORD = envPassword('VITE_PLAYER_PASSWORD', 'calzone')
const ADMIN_PASSWORD = envPassword('VITE_ADMIN_PASSWORD', 'calzoneduplo')

export function getPlayerPassword(): string {
  return PLAYER_PASSWORD
}

export function getAdminPassword(): string {
  return ADMIN_PASSWORD
}

export function authenticate(password: string): AuthRole | null {
  const value = password.trim()
  if (value === ADMIN_PASSWORD) return 'admin'
  if (value === PLAYER_PASSWORD) return 'player'
  return null
}

export function getSessionRole(): AuthRole | null {
  const role = sessionStorage.getItem(SESSION_KEY)
  if (role === 'player' || role === 'admin') return role
  return null
}

export function setSessionRole(role: AuthRole): void {
  sessionStorage.setItem(SESSION_KEY, role)
}

export function getSessionProfile(): string | null {
  return sessionStorage.getItem(PROFILE_KEY)
}

export function setSessionProfile(profileId: string): void {
  sessionStorage.setItem(PROFILE_KEY, profileId)
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(PROFILE_KEY)
}

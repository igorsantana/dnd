import { useState } from 'react'
import { getSessionRole, type AuthRole } from './lib/auth'
import { LoginGate } from './components/LoginGate'
import { PlayerSheet } from './components/PlayerSheet'
import { AdminPanel } from './components/AdminPanel'

export default function App() {
  const [role, setRole] = useState<AuthRole | null>(getSessionRole)

  if (!role) {
    return <LoginGate onLogin={setRole} />
  }

  if (role === 'admin') {
    return <AdminPanel onLogout={() => setRole(null)} />
  }

  return <PlayerSheet />
}

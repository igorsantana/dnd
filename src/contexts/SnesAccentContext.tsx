import { createContext, useContext, type ReactNode } from 'react'
import type { SnesColor } from '../lib/snes'

const SnesAccentContext = createContext<SnesColor>('galaxy')

export function SnesAccentProvider({
  color,
  children,
}: {
  color: SnesColor
  children: ReactNode
}) {
  return <SnesAccentContext.Provider value={color}>{children}</SnesAccentContext.Provider>
}

export function useSnesAccent() {
  return useContext(SnesAccentContext)
}

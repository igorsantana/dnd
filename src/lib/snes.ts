export type SnesColor =
  | 'plumber'
  | 'nature'
  | 'sunshine'
  | 'ocean'
  | 'turquoise'
  | 'phantom'
  | 'rose'
  | 'galaxy'
  | 'ember'

export function snesButtonClass(color: SnesColor) {
  return `snes-button has-${color}-color`
}

export function snesTitleClass(color: SnesColor) {
  return `snes-container-title has-${color}-underline`
}

export function snesTextClass(color: SnesColor) {
  return `text-${color}-color`
}

export function snesBgClass(color: SnesColor) {
  return `has-${color}-bg`
}

export function snesCheckboxGroupClass(color: SnesColor) {
  return `snes-checkbox has-${color}-icons`
}

export function snesCheckboxItemClass(color: SnesColor) {
  return `snes-checkbox__item has-${color}-icon`
}

export function profileToSnesColor(profileId: string): SnesColor {
  const map: Record<string, SnesColor> = {
    honda: 'ocean',
    antunes: 'phantom',
    keiti: 'nature',
    rafael: 'plumber',
    leozin: 'sunshine',
  }
  return map[profileId] ?? 'galaxy'
}

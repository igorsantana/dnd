/**
 * One-off: bump party to level 6 in cloud, Geraldo → Bard 5 / Warlock 1 (Genie Air, 2014).
 * Run: bun scripts/cloud-level-up-party.mjs
 */
import { readFileSync } from 'fs'
import { PLAYER_PROFILES } from '../src/data/profiles.ts'
import { applyLevelUpToCharacter, buildLevelUpPreview } from '../src/lib/level-up.ts'
import { buildNoticePayload } from '../src/lib/level-up-store.ts'
import { spellSlotsForClassLevel, proficiencyBonusForLevel } from '../src/data/spell-slots.ts'
import { abilityModifier, parseLevel } from '../src/lib/class-features.ts'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, '')]
    }),
)

const passwords = [
  env.ADMIN_PASSWORD,
  env.VITE_ADMIN_PASSWORD,
  env.PLAYER_PASSWORD,
  env.VITE_PLAYER_PASSWORD,
].filter(Boolean)

const base = 'https://dnd-theta-eight.vercel.app'

async function authFetch(path, init = {}) {
  for (const pw of passwords) {
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        Authorization: `Bearer ${pw}`,
      },
    })
    if (res.status !== 401) return { res, pw }
  }
  throw new Error('Unauthorized with all passwords')
}

function geraldoAdditions() {
  return [
    'Multiclasse: Bardo 5 / Bruxo 1 (regras 2014) — em vez de Bardo 6',
    'Patrono: O Gênio (Ar / Djinni) — subclass de Bruxo no 1º nível (2014)',
    'Magia do Pacto — 2 truques de Bruxo, 2 magias de 1º nível conhecidas, 1 espaço de pacto de 1º nível (recarrega no descanso curto)',
    'Lista expandida do Gênio — Detectar o Bem e o Mal; Djinni: Onda Trovejante (Thunderwave)',
    'Recipiente do Gênio — objeto Minúsculo como foco de Bruxo; Ira do Gênio: +PB dano de trovão 1×/turno ao acertar um ataque',
    'Descanso Engarrafado — ação para entrar no recipiente (espaço extradimensional)',
    'HP — +1d8 + modificador de Constituição (dado de Bruxo)',
    'Proficiências de multiclasse — armadura leve e armas simples (leve já vinha do Bardo)',
    'Espaços de magia de Bardo — permanecem no nível 5 (4 / 3 / 2); sem o 3º espaço de 3º nível do Bardo 6',
    'Não recebe recursos de Bardo 6 — Contracanto, Inspiração Infalível, Fala Universal',
  ]
}

async function main() {
  const { res: listRes, pw } = await authFetch('/api/characters')
  if (!listRes.ok) throw new Error(`list failed ${listRes.status}`)
  const characters = await listRes.json()

  for (const raw of characters) {
    const profile =
      PLAYER_PROFILES.find((p) => p.id === raw.profileId) ??
      PLAYER_PROFILES.find(
        (p) =>
          p.characterName.toLowerCase() === String(raw.name ?? '').trim().toLowerCase(),
      )
    if (!profile) {
      console.log('skip unknown', raw.name)
      continue
    }

    let next = { ...raw, profileId: profile.id }
    const fromLevel = parseLevel(raw.level)

    if (profile.id === 'antunes') {
      const conMod = abilityModifier(raw.abilities?.constitution)
      const hpGain = 5 + conMod // average d8
      const hpMax = Number.parseInt(String(raw.hpMax ?? '0'), 10) || 0
      const hpCurrent = Number.parseInt(String(raw.hpCurrent ?? '0'), 10) || 0

      next = {
        ...next,
        level: '6',
        class: 'Bardo 5 / Bruxo 1',
        subclass: 'Eloquência · Gênio (Ar)',
        proficiencyBonus: proficiencyBonusForLevel(6),
        classLevels: { bard: 5, warlock: 1 },
        spellSlots: spellSlotsForClassLevel('bard', 5),
        hpMax: String(hpMax + hpGain),
        hpCurrent: String(hpCurrent + hpGain),
        classFeatures: {
          ...(raw.classFeatures ?? {}),
          warlockPatron: 'Gênio (Ar / Djinni)',
          pactMagicSlots: '1 espaço de 1º nível (descanso curto)',
          warlockNotes:
            'Recipiente do Gênio + Ira do Gênio (trovão). Lista: Detectar o Bem e o Mal, Onda Trovejante.',
        },
        levelUpNotice: buildNoticePayload(raw.name, fromLevel, 6, geraldoAdditions()),
        updatedAt: new Date().toISOString(),
      }
      console.log(`Geraldo: ${fromLevel} → B5/W1 (HP +${hpGain})`)
    } else if (fromLevel >= 6) {
      console.log(`${raw.name}: already ${fromLevel}, skip bump`)
      continue
    } else {
      const preview = buildLevelUpPreview(raw, profile.characterClass, profile.subclassId)
      next = applyLevelUpToCharacter(raw, profile.characterClass)
      next = {
        ...next,
        profileId: profile.id,
        levelUpNotice: buildNoticePayload(
          preview.characterName,
          preview.fromLevel,
          preview.toLevel,
          preview.additions,
        ),
      }
      console.log(`${raw.name}: ${preview.fromLevel} → ${preview.toLevel}`)
      for (const a of preview.additions) console.log('  -', a)
    }

    const save = await fetch(`${base}/api/characters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pw}`,
      },
      body: JSON.stringify(next),
    })
    if (!save.ok) {
      console.error(`save failed for ${raw.name}: ${save.status}`)
      continue
    }
    console.log(`saved ${raw.name}`)
  }
}

await main()

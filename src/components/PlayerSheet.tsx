import { useEffect, useState } from 'react'
import type { Attack, Character, InventoryItem, MagicItem } from '../types/character'
import { createEmptyCharacter, mergeCharacterDefaults } from '../types/character'
import { getProfileById, type PlayerProfile } from '../data/profiles'
import { loadAllCharacters, saveCharacter } from '../lib/storage'
import { pushCharacterToCloud } from '../lib/remote-storage'
import { getSessionProfile, setSessionProfile } from '../lib/auth'
import { isCasterClass } from '../lib/classes'
import { pt } from '../i18n/pt'
import { ProfilePicker } from './ProfilePicker'
import { ClassSections } from './ClassSections'
import { SaveCelebration } from './SaveCelebration'
import {
  SectionTitle,
  Field,
  TextArea,
  AddButton,
  PrimaryButton,
  CheckboxField,
  SheetRow,
} from './ui'
import { AvatarFrame } from './AvatarFrame'
import { SnesAccentProvider } from '../contexts/SnesAccentContext'
import { profileToSnesColor, snesTextClass } from '../lib/snes'

const ABILITY_LABELS: { key: keyof Character['abilities']; label: string }[] = [
  { key: 'strength', label: 'FOR' },
  { key: 'dexterity', label: 'DES' },
  { key: 'constitution', label: 'CON' },
  { key: 'intelligence', label: 'INT' },
  { key: 'wisdom', label: 'SAB' },
  { key: 'charisma', label: 'CAR' },
]

function createCharacterForProfile(profile: PlayerProfile): Character {
  return mergeCharacterDefaults(
    {
      ...createEmptyCharacter(),
      profileId: profile.id,
      playerName: profile.playerName,
      name: profile.characterName,
      class: profile.classLabel,
    },
    profile.characterClass,
    profile.classLabel,
  )
}

function findCharacterForProfile(characters: Character[], profileId: string): Character | undefined {
  const byId = characters.find((c) => c.profileId === profileId)
  if (byId) return byId

  const profile = getProfileById(profileId)
  if (!profile) return undefined

  return characters.find(
    (c) =>
      c.playerName.toLowerCase() === profile.playerName.toLowerCase() &&
      c.name.toLowerCase() === profile.characterName.toLowerCase(),
  )
}

function loadProfileData(id: string): { profile: PlayerProfile; character: Character } | null {
  const profile = getProfileById(id)
  if (!profile) return null

  const all = loadAllCharacters()
  const existing = findCharacterForProfile(all, id)
  const character = existing
    ? mergeCharacterDefaults(existing, profile.characterClass, profile.classLabel)
    : createCharacterForProfile(profile)

  return { profile, character }
}

export function PlayerSheet() {
  const [profileId, setProfileId] = useState<string | null>(() => getSessionProfile())
  const [character, setCharacter] = useState<Character>(createEmptyCharacter)
  const [showCelebration, setShowCelebration] = useState(false)
  const [ready, setReady] = useState(false)

  const profile = profileId ? getProfileById(profileId) : undefined
  const t = pt.sheet
  const snesColor = profile ? profileToSnesColor(profile.id) : 'galaxy'

  useEffect(() => {
    const savedId = getSessionProfile()
    if (savedId) {
      const data = loadProfileData(savedId)
      if (data) {
        setProfileId(savedId)
        setCharacter(data.character)
      }
    }
    setReady(true)
  }, [])

  function selectProfile(id: string) {
    const data = loadProfileData(id)
    if (!data) return
    setSessionProfile(id)
    setProfileId(id)
    setCharacter(data.character)
  }

  function update<K extends keyof Character>(key: K, value: Character[K]) {
    setCharacter((prev) => ({ ...prev, [key]: value }))
  }

  function updateAbility(key: keyof Character['abilities'], value: string) {
    setCharacter((prev) => ({
      ...prev,
      abilities: { ...prev.abilities, [key]: value },
    }))
  }

  function updateCurrency(key: keyof Character['currency'], value: string) {
    setCharacter((prev) => ({
      ...prev,
      currency: { ...prev.currency, [key]: value },
    }))
  }

  function addAttack() {
    const attack: Attack = {
      id: crypto.randomUUID(),
      name: '',
      bonus: '',
      damage: '',
      damageType: '',
      notes: '',
    }
    update('attacks', [...character.attacks, attack])
  }

  function updateAttack(id: string, patch: Partial<Attack>) {
    update(
      'attacks',
      character.attacks.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    )
  }

  function removeAttack(id: string) {
    update('attacks', character.attacks.filter((a) => a.id !== id))
  }

  function addMagicItem() {
    const item: MagicItem = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      attuned: false,
    }
    update('magicItems', [...character.magicItems, item])
  }

  function updateMagicItem(id: string, patch: Partial<MagicItem>) {
    update(
      'magicItems',
      character.magicItems.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    )
  }

  function removeMagicItem(id: string) {
    update('magicItems', character.magicItems.filter((m) => m.id !== id))
  }

  function addInventoryItem() {
    const item: InventoryItem = {
      id: crypto.randomUUID(),
      name: '',
      quantity: '1',
      notes: '',
    }
    update('inventory', [...character.inventory, item])
  }

  function updateInventoryItem(id: string, patch: Partial<InventoryItem>) {
    update(
      'inventory',
      character.inventory.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    )
  }

  function removeInventoryItem(id: string) {
    update('inventory', character.inventory.filter((i) => i.id !== id))
  }

  function handleSave() {
    if (!character.name.trim()) return

    const saved = saveCharacter({
      ...character,
      profileId: profileId ?? character.profileId,
    })
    setCharacter(saved)
    void pushCharacterToCloud(saved)
    setShowCelebration(true)
  }

  if (!ready) return null

  if (!profileId || !profile) {
    return <ProfilePicker onSelect={selectProfile} />
  }

  const isCaster = isCasterClass(profile.characterClass)

  return (
    <SnesAccentProvider color={snesColor}>
      <div className="app-shell app-sheet min-h-screen bg-black">
        {showCelebration && (
          <SaveCelebration
            accentColor={profile.accentColor}
            onDone={() => setShowCelebration(false)}
          />
        )}

        <div className="sheet-page">
          <div className="sheet-layout">
            <aside className="sheet-sidebar">
              <div className="sheet-header">
                <AvatarFrame src={profile.image} alt={profile.characterName} size="lg" />
                <div className="sheet-header-text">
                  <h1 className={snesTextClass(snesColor)}>{profile.characterName}</h1>
                  <p className="text-galaxy-color">{profile.playerName}</p>
                  <p className="text-galaxy-color opacity-80">
                    {profile.classLabel} · Nível {character.level}
                  </p>
                </div>
              </div>

              <div className="sheet-section">
                <SectionTitle>{t.identity}</SectionTitle>
                <div className="field-grid field-grid-2">
                  <Field label={t.fields.characterName} value={character.name} onChange={(v) => update('name', v)} />
                  <Field label={t.fields.playerName} value={character.playerName} onChange={(v) => update('playerName', v)} />
                  <Field label={t.fields.class} value={character.class} onChange={(v) => update('class', v)} />
                  <Field label={t.fields.subclass} value={character.subclass} onChange={(v) => update('subclass', v)} />
                  <Field label={t.fields.race} value={character.race} onChange={(v) => update('race', v)} />
                  <Field label={t.fields.background} value={character.background} onChange={(v) => update('background', v)} />
                  <Field label={t.fields.level} value={character.level} onChange={(v) => update('level', v)} type="number" />
                  <Field label={t.fields.alignment} value={character.alignment} onChange={(v) => update('alignment', v)} />
                </div>
              </div>

              <div className="sheet-section">
                <SectionTitle>{t.abilities}</SectionTitle>
                <div className="field-grid field-grid-3">
                  {ABILITY_LABELS.map(({ key, label }) => (
                    <Field
                      key={key}
                      label={label}
                      value={character.abilities[key]}
                      onChange={(v) => updateAbility(key, v)}
                      type="number"
                    />
                  ))}
                </div>
              </div>

              <div className="sheet-section">
                <SectionTitle>{t.combat}</SectionTitle>
                <div className="field-grid field-grid-2">
                  <Field label={t.fields.hpCurrent} value={character.hpCurrent} onChange={(v) => update('hpCurrent', v)} type="number" />
                  <Field label={t.fields.hpMax} value={character.hpMax} onChange={(v) => update('hpMax', v)} type="number" />
                  <Field label={t.fields.armorClass} value={character.armorClass} onChange={(v) => update('armorClass', v)} type="number" />
                  <Field label={t.fields.speed} value={character.speed} onChange={(v) => update('speed', v)} />
                  <Field label={t.fields.initiative} value={character.initiative} onChange={(v) => update('initiative', v)} />
                  <Field label={t.fields.proficiencyBonus} value={character.proficiencyBonus} onChange={(v) => update('proficiencyBonus', v)} />
                </div>
              </div>

              <div className="sheet-section">
                <SectionTitle>{t.currency}</SectionTitle>
                <div className="field-grid field-grid-2 field-grid-currency">
                  <Field label={t.fields.copper} value={character.currency.copper} onChange={(v) => updateCurrency('copper', v)} type="number" />
                  <Field label={t.fields.silver} value={character.currency.silver} onChange={(v) => updateCurrency('silver', v)} type="number" />
                  <Field label={t.fields.electrum} value={character.currency.electrum} onChange={(v) => updateCurrency('electrum', v)} type="number" />
                  <Field label={t.fields.gold} value={character.currency.gold} onChange={(v) => updateCurrency('gold', v)} type="number" />
                  <Field label={t.fields.platinum} value={character.currency.platinum} onChange={(v) => updateCurrency('platinum', v)} type="number" />
                </div>
              </div>

            </aside>

            <div className={`sheet-main ${isCaster ? 'sheet-main-caster' : ''}`}>
              {isCaster && (
                <div className="sheet-main-col">
                  <ClassSections
                    characterClass={profile.characterClass}
                    character={character}
                    onUpdateSpells={(spells) => update('spells', spells)}
                    onUpdateSpellSlots={(spellSlots) => update('spellSlots', spellSlots)}
                    onUpdateClassFeatures={(classFeatures) => update('classFeatures', classFeatures)}
                  />
                </div>
              )}

              <div className="sheet-main-col">
                {!isCaster && (
                  <ClassSections
                    characterClass={profile.characterClass}
                    character={character}
                    onUpdateSpells={(spells) => update('spells', spells)}
                    onUpdateSpellSlots={(spellSlots) => update('spellSlots', spellSlots)}
                    onUpdateClassFeatures={(classFeatures) => update('classFeatures', classFeatures)}
                  />
                )}
                <div className="sheet-section">
                  <SectionTitle>{t.attacks}</SectionTitle>
                  <div>
                    {character.attacks.map((attack) => (
                      <SheetRow key={attack.id} onRemove={() => removeAttack(attack.id)}>
                        <Field label={t.fields.attackName} value={attack.name} onChange={(v) => updateAttack(attack.id, { name: v })} className="col-span-2" />
                        <Field label={t.fields.attackBonus} value={attack.bonus} onChange={(v) => updateAttack(attack.id, { bonus: v })} placeholder="+5" />
                        <Field label={t.fields.attackDamage} value={attack.damage} onChange={(v) => updateAttack(attack.id, { damage: v })} placeholder="1d8+3" />
                        <Field label={t.fields.attackType} value={attack.damageType} onChange={(v) => updateAttack(attack.id, { damageType: v })} placeholder="cortante" />
                        <Field label={t.fields.attackNotes} value={attack.notes} onChange={(v) => updateAttack(attack.id, { notes: v })} className="col-span-2" />
                      </SheetRow>
                    ))}
                    <AddButton onClick={addAttack} label={t.addAttack} />
                  </div>
                </div>

                <div className="sheet-section">
                  <SectionTitle>{t.magicItems}</SectionTitle>
                  <div>
                    {character.magicItems.map((item) => (
                      <div key={item.id} className="sheet-row sheet-row-stack">
                        <div className="sheet-row-fields sheet-row-fields-wide">
                          <Field label={t.fields.itemName} value={item.name} onChange={(v) => updateMagicItem(item.id, { name: v })} />
                          <CheckboxField
                            label={t.fields.attuned}
                            checked={item.attuned}
                            onChange={(v) => updateMagicItem(item.id, { attuned: v })}
                          />
                          <TextArea
                            label={t.fields.description}
                            value={item.description}
                            onChange={(v) => updateMagicItem(item.id, { description: v })}
                            rows={2}
                          />
                        </div>
                        <div className="sheet-row-action">
                          <button
                            type="button"
                            onClick={() => removeMagicItem(item.id)}
                            className="snes-link text-plumber-color"
                            title="Remover"
                          >
                            [x]
                          </button>
                        </div>
                      </div>
                    ))}
                    <AddButton onClick={addMagicItem} label={t.addMagicItem} />
                  </div>
                </div>

                <div className="sheet-section">
                  <SectionTitle>{t.inventory}</SectionTitle>
                  <div>
                    {character.inventory.map((item) => (
                      <SheetRow key={item.id} onRemove={() => removeInventoryItem(item.id)}>
                        <Field label={t.fields.item} value={item.name} onChange={(v) => updateInventoryItem(item.id, { name: v })} className="col-span-2" />
                        <Field label={t.fields.quantity} value={item.quantity} onChange={(v) => updateInventoryItem(item.id, { quantity: v })} type="number" />
                        <Field label={t.fields.notes} value={item.notes} onChange={(v) => updateInventoryItem(item.id, { notes: v })} className="col-span-2" />
                      </SheetRow>
                    ))}
                    <AddButton onClick={addInventoryItem} label={t.addItem} />
                  </div>
                </div>

                <div className="sheet-section">
                  <SectionTitle>{t.notes}</SectionTitle>
                  <TextArea
                    label={t.fields.characterNotes}
                    value={character.notes}
                    onChange={(v) => update('notes', v)}
                    rows={5}
                    placeholder={t.fields.notesPlaceholder}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center lg:hidden mt-8">
            <PrimaryButton onClick={handleSave} className="w-full max-w-md text-center">
              {t.saveButton}
            </PrimaryButton>
          </div>
        </div>

        <PrimaryButton onClick={handleSave} className="sheet-save-desktop hidden lg:block text-center">
          {t.saveButton}
        </PrimaryButton>
      </div>
    </SnesAccentProvider>
  )
}

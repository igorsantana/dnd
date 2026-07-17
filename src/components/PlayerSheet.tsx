import { useEffect, useRef, useState } from 'react'
import type { Attack, Character, InventoryItem, MagicItem } from '../types/character'
import { createEmptyCharacter, mergeCharacterDefaults } from '../types/character'
import { getProfileById, type PlayerProfile } from '../data/profiles'
import { cacheCharacter, loadAllCharacters, saveCharacter } from '../lib/storage'
import {
  fetchCharacterFromCloud,
  pickNewerCharacter,
  pushCharacterToCloud,
} from '../lib/remote-storage'
import { getSessionProfile, setSessionProfile } from '../lib/auth'
import { isCasterClass } from '../lib/classes'
import { pt } from '../i18n/pt'
import { ProfilePicker } from './ProfilePicker'
import { ClassFeatureSection, SpellcastingSections } from './ClassSections'
import { SaveCelebration } from './SaveCelebration'
import {
  SectionTitle,
  Field,
  TextArea,
  AddButton,
  PrimaryButton,
  CheckboxField,
  SheetRow,
  CompactSheetItem,
  PixelScrollList,
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
    profile.subclassLabel,
    profile.subclassId,
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

function normalizeForProfile(profile: PlayerProfile, character: Character): Character {
  return mergeCharacterDefaults(
    { ...character, profileId: profile.id },
    profile.characterClass,
    profile.classLabel,
    profile.subclassLabel,
    profile.subclassId,
  )
}

export function PlayerSheet() {
  const [profileId, setProfileId] = useState<string | null>(() => getSessionProfile())
  const [character, setCharacter] = useState<Character>(createEmptyCharacter)
  const [showCelebration, setShowCelebration] = useState(false)
  const [ready, setReady] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [cloudHint, setCloudHint] = useState<string | null>(null)
  const [editingAttackId, setEditingAttackId] = useState<string | null>(null)
  const [editingMagicItemId, setEditingMagicItemId] = useState<string | null>(null)
  const loadGeneration = useRef(0)

  const profile = profileId ? getProfileById(profileId) : undefined
  const t = pt.sheet
  const snesColor = profile ? profileToSnesColor(profile.id) : 'galaxy'

  async function loadProfile(id: string) {
    const dataProfile = getProfileById(id)
    if (!dataProfile) return

    const generation = ++loadGeneration.current
    setLoadingProfile(true)
    setCloudHint(null)
    setSessionProfile(id)
    setProfileId(id)

    const local = findCharacterForProfile(loadAllCharacters(), id)
    const cloudResult = await fetchCharacterFromCloud(id)

    if (generation !== loadGeneration.current) return

    const cloud = cloudResult.character
      ? { ...cloudResult.character, profileId: id }
      : undefined
    const winner = pickNewerCharacter(local, cloud)

    const resolved = winner
      ? normalizeForProfile(dataProfile, winner)
      : createCharacterForProfile(dataProfile)

    cacheCharacter(resolved)
    setCharacter(resolved)

    if (!cloudResult.available) {
      setCloudHint(pt.admin.cloudOffline)
    } else {
      setCloudHint(null)
    }

    setLoadingProfile(false)
    setReady(true)
  }

  useEffect(() => {
    const savedId = getSessionProfile()
    if (savedId && getProfileById(savedId)) {
      void loadProfile(savedId)
      return
    }
    setReady(true)
  }, [])

  function selectProfile(id: string) {
    void loadProfile(id)
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
    setEditingAttackId(attack.id)
  }

  function updateAttack(id: string, patch: Partial<Attack>) {
    update(
      'attacks',
      character.attacks.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    )
  }

  function removeAttack(id: string) {
    update('attacks', character.attacks.filter((a) => a.id !== id))
    if (editingAttackId === id) setEditingAttackId(null)
  }

  function addMagicItem() {
    const item: MagicItem = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      attuned: false,
    }
    update('magicItems', [...character.magicItems, item])
    setEditingMagicItemId(item.id)
  }

  function updateMagicItem(id: string, patch: Partial<MagicItem>) {
    update(
      'magicItems',
      character.magicItems.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    )
  }

  function removeMagicItem(id: string) {
    update('magicItems', character.magicItems.filter((m) => m.id !== id))
    if (editingMagicItemId === id) setEditingMagicItemId(null)
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

  async function handleSave() {
    if (!character.name.trim()) return

    const savedLocal = saveCharacter({
      ...character,
      profileId: profileId ?? character.profileId,
    })
    setCharacter(savedLocal)

    const savedCloud = await pushCharacterToCloud(savedLocal)
    if (savedCloud) {
      const synced = cacheCharacter(savedCloud)
      setCharacter(synced)
      setCloudHint(null)
    } else {
      setCloudHint(pt.admin.cloudOffline)
    }
    setShowCelebration(true)
  }

  if (!ready && !profileId) return null

  if (!profileId || !profile) {
    return <ProfilePicker onSelect={selectProfile} />
  }

  if (loadingProfile) {
    return (
      <div className="app-shell min-h-screen bg-black flex items-center justify-center">
        <p className="text-galaxy-color">{pt.admin.cloudLoading}</p>
      </div>
    )
  }

  const isCaster = isCasterClass(profile.characterClass)
  const classSectionProps = {
    characterClass: profile.characterClass,
    subclassId: profile.subclassId,
    character,
    onUpdateSpells: (spells: Character['spells']) => update('spells', spells),
    onUpdateSpellSlots: (spellSlots: Character['spellSlots']) => update('spellSlots', spellSlots),
    onUpdateClassFeatures: (classFeatures: Character['classFeatures']) =>
      update('classFeatures', classFeatures),
    onUpdateSpellcasting: (field: 'spellAttackBonus' | 'spellSaveDC', value: string) =>
      update(field, value),
  }

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
          {cloudHint && (
            <p className="text-galaxy-color sheet-cloud-hint mb-4">{cloudHint}</p>
          )}
          <div className="sheet-layout">
            <aside className="sheet-sidebar">
              <div className="sheet-header">
                <AvatarFrame src={profile.image} alt={profile.characterName} size="lg" />
                <div className="sheet-header-text">
                  <h1 className={snesTextClass(snesColor)}>{profile.characterName}</h1>
                  <p className="text-galaxy-color">{profile.playerName}</p>
                  <p className="text-galaxy-color opacity-80">
                    {profile.classLabel}
                    {profile.subclassLabel ? ` · ${profile.subclassLabel}` : ''}
                    {` · ${t.fields.level} ${character.level}`}
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

            <div className="sheet-main">
              <div className="sheet-main-col">
                {isCaster && <SpellcastingSections {...classSectionProps} />}

                <div className="sheet-section">
                  <SectionTitle>{t.attacks}</SectionTitle>
                  <PixelScrollList count={character.attacks.length}>
                    {character.attacks.map((attack) => (
                      editingAttackId === attack.id ? (
                        <div key={attack.id} className="compact-edit-panel">
                          <SheetRow onRemove={() => removeAttack(attack.id)}>
                            <Field label={t.fields.attackName} value={attack.name} onChange={(v) => updateAttack(attack.id, { name: v })} className="col-span-2" />
                            <Field label={t.fields.attackBonus} value={attack.bonus} onChange={(v) => updateAttack(attack.id, { bonus: v })} placeholder="+5" />
                            <Field label={t.fields.attackDamage} value={attack.damage} onChange={(v) => updateAttack(attack.id, { damage: v })} placeholder="1d8+3" />
                            <Field label={t.fields.attackType} value={attack.damageType} onChange={(v) => updateAttack(attack.id, { damageType: v })} placeholder="cortante" />
                            <Field label={t.fields.attackNotes} value={attack.notes} onChange={(v) => updateAttack(attack.id, { notes: v })} className="col-span-2" />
                          </SheetRow>
                          <button type="button" className="snes-link text-nature-color compact-done" onClick={() => setEditingAttackId(null)}>
                            [✓] Concluir
                          </button>
                        </div>
                      ) : (
                        <CompactSheetItem
                          key={attack.id}
                          title={attack.name}
                          meta={[attack.bonus, attack.damage, attack.damageType].filter(Boolean).join(' · ')}
                          detail={attack.notes}
                          onEdit={() => setEditingAttackId(attack.id)}
                          onRemove={() => removeAttack(attack.id)}
                        />
                      )
                    ))}
                  </PixelScrollList>
                  <AddButton onClick={addAttack} label={t.addAttack} />
                </div>

                <div className="sheet-section">
                  <SectionTitle>{t.magicItems}</SectionTitle>
                  <PixelScrollList count={character.magicItems.length}>
                    {character.magicItems.map((item) => (
                      editingMagicItemId === item.id ? (
                        <div key={item.id} className="compact-edit-panel">
                          <div className="sheet-row sheet-row-stack">
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
                          <button type="button" className="snes-link text-nature-color compact-done" onClick={() => setEditingMagicItemId(null)}>
                            [✓] Concluir
                          </button>
                        </div>
                      ) : (
                        <CompactSheetItem
                          key={item.id}
                          title={item.name}
                          meta={item.attuned ? t.fields.attuned : undefined}
                          detail={item.description}
                          onEdit={() => setEditingMagicItemId(item.id)}
                          onRemove={() => removeMagicItem(item.id)}
                        />
                      )
                    ))}
                  </PixelScrollList>
                  <AddButton onClick={addMagicItem} label={t.addMagicItem} />
                </div>

                <div className="sheet-section">
                  <SectionTitle>{t.inventory}</SectionTitle>
                  <PixelScrollList count={character.inventory.length}>
                    {character.inventory.map((item) => (
                      <SheetRow key={item.id} onRemove={() => removeInventoryItem(item.id)}>
                        <Field label={t.fields.item} value={item.name} onChange={(v) => updateInventoryItem(item.id, { name: v })} className="col-span-2" />
                        <Field label={t.fields.quantity} value={item.quantity} onChange={(v) => updateInventoryItem(item.id, { quantity: v })} type="number" />
                        <Field label={t.fields.notes} value={item.notes} onChange={(v) => updateInventoryItem(item.id, { notes: v })} className="col-span-2" />
                      </SheetRow>
                    ))}
                  </PixelScrollList>
                  <AddButton onClick={addInventoryItem} label={t.addItem} />
                </div>
              </div>

              <div className="sheet-main-col">
                <ClassFeatureSection {...classSectionProps} />

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
            <PrimaryButton onClick={() => void handleSave()} className="w-full max-w-md text-center">
              {t.saveButton}
            </PrimaryButton>
          </div>
        </div>

        <PrimaryButton onClick={() => void handleSave()} className="sheet-save-desktop hidden lg:block text-center">
          {t.saveButton}
        </PrimaryButton>
      </div>
    </SnesAccentProvider>
  )
}

import type { CharacterClass } from '../data/profiles'
import type { Character, ClassFeatures } from '../types/character'
import { isCasterClass } from '../lib/classes'
import { pt } from '../i18n/pt'
import { SpellPicker } from './SpellPicker'
import { SectionTitle, Field, TextArea, CheckboxField } from './ui'

interface ClassSectionsProps {
  characterClass: CharacterClass
  character: Character
  onUpdateSpells: (spells: Character['spells']) => void
  onUpdateSpellSlots: (slots: Character['spellSlots']) => void
  onUpdateClassFeatures: (features: ClassFeatures) => void
  onUpdateSpellcasting: (
    field: 'spellAttackBonus' | 'spellSaveDC',
    value: string,
  ) => void
}

export function ClassSections({
  characterClass,
  character,
  onUpdateSpells,
  onUpdateSpellSlots,
  onUpdateClassFeatures,
  onUpdateSpellcasting,
}: ClassSectionsProps) {
  const t = pt.classes
  const isCaster = isCasterClass(characterClass)

  function updateFeature(key: keyof ClassFeatures, value: string | boolean) {
    onUpdateClassFeatures({ ...character.classFeatures, [key]: value })
  }

  function updateSlot(level: string, field: 'total' | 'used', value: string) {
    onUpdateSpellSlots({
      ...character.spellSlots,
      [level]: {
        ...character.spellSlots[level],
        [field]: value,
      },
    })
  }

  const cantrips = character.spells.filter((s) => s.isCantrip)
  const leveledSpells = character.spells.filter((s) => !s.isCantrip)

  return (
    <>
      {isCaster && (
        <>
          <div className="sheet-section">
            <SectionTitle>{t.spellcasting}</SectionTitle>
            <div className="field-grid field-grid-2">
              <Field
                label={t.spellAttackBonus}
                value={character.spellAttackBonus}
                onChange={(value) => onUpdateSpellcasting('spellAttackBonus', value)}
                placeholder="+7"
              />
              <Field
                label={t.spellSaveDC}
                value={character.spellSaveDC}
                onChange={(value) => onUpdateSpellcasting('spellSaveDC', value)}
                placeholder="15"
                type="number"
              />
            </div>
          </div>

          <div className="sheet-section">
            <SectionTitle>{t.spellSlots}</SectionTitle>
            <div className="spell-slots-row">
              {Object.entries(character.spellSlots).map(([level, slot]) => (
                <div key={level} className="spell-slot-group">
                  <p className="sheet-label">{t.slotLevel(Number(level))}</p>
                  <div className="field-grid field-grid-2">
                    <Field
                      label={t.slotsTotal}
                      value={slot.total}
                      onChange={(v) => updateSlot(level, 'total', v)}
                      type="number"
                    />
                    <Field
                      label={t.slotsUsed}
                      value={slot.used}
                      onChange={(v) => updateSlot(level, 'used', v)}
                      type="number"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sheet-section spell-columns">
            <div>
              <SectionTitle>{t.cantrips}</SectionTitle>
              <SpellPicker
                characterClass={characterClass}
                selected={cantrips}
                cantripsOnly
                showPrepared={false}
                onChange={(next) => onUpdateSpells([...next, ...leveledSpells])}
              />
            </div>

            <div>
              <SectionTitle>
                {characterClass === 'wizard' ? t.preparedSpells : t.knownSpells}
              </SectionTitle>
              <SpellPicker
                characterClass={characterClass}
                selected={leveledSpells}
                cantripsOnly={false}
                showPrepared={characterClass === 'wizard'}
                onChange={(next) => onUpdateSpells([...cantrips, ...next])}
              />
            </div>
          </div>
        </>
      )}

      {characterClass === 'wizard' && (
        <div className="sheet-section">
          <SectionTitle>{t.wizardFeatures}</SectionTitle>
          <div className="field-grid field-grid-2">
            <Field
              label={t.arcaneRecovery}
              value={character.classFeatures.arcaneRecovery ?? ''}
              onChange={(v) => updateFeature('arcaneRecovery', v)}
              placeholder={t.arcaneRecoveryPlaceholder}
            />
            <CheckboxField
              label={t.ritualCasting}
              checked={character.classFeatures.ritualCasting ?? false}
              onChange={(v) => updateFeature('ritualCasting', v)}
            />
          </div>
          <div className="mt-3">
            <TextArea
              label={t.spellbookNotes}
              value={character.classFeatures.spellbookNotes ?? ''}
              onChange={(v) => updateFeature('spellbookNotes', v)}
              rows={3}
            />
          </div>
        </div>
      )}

      {characterClass === 'bard' && (
        <div className="sheet-section">
          <SectionTitle>{t.bardFeatures}</SectionTitle>
          <div className="field-grid field-grid-2 field-grid-3-at-xl">
            <Field
              label={t.bardicInspiration}
              value={character.classFeatures.bardicInspirationDie ?? ''}
              onChange={(v) => updateFeature('bardicInspirationDie', v)}
              placeholder="d8"
            />
            <Field
              label={t.bardicInspirationUses}
              value={character.classFeatures.bardicInspirationUses ?? ''}
              onChange={(v) => updateFeature('bardicInspirationUses', v)}
              placeholder="Ex: 3"
            />
            <Field
              label={t.jackOfAllTrades}
              value={character.classFeatures.jackOfAllTrades ?? ''}
              onChange={(v) => updateFeature('jackOfAllTrades', v)}
              placeholder="+1"
            />
          </div>
        </div>
      )}

      {characterClass === 'ranger' && (
        <div className="sheet-section">
          <SectionTitle>{t.rangerFeatures}</SectionTitle>
          <div className="field-grid field-grid-2 field-grid-3-at-xl">
            <Field
              label={t.favoredEnemy}
              value={character.classFeatures.favoredEnemy ?? ''}
              onChange={(v) => updateFeature('favoredEnemy', v)}
              placeholder="Ex: Orcs, Goblins..."
            />
            <Field
              label={t.favoredTerrain}
              value={character.classFeatures.favoredTerrain ?? ''}
              onChange={(v) => updateFeature('favoredTerrain', v)}
              placeholder="Ex: Floresta, Montanha..."
            />
            <Field
              label={t.fightingStyle}
              value={character.classFeatures.fightingStyle ?? ''}
              onChange={(v) => updateFeature('fightingStyle', v)}
              placeholder={t.fightingStylePlaceholder}
            />
          </div>
        </div>
      )}

      {characterClass === 'fighter' && (
        <div className="sheet-section">
          <SectionTitle>{t.fighterFeatures}</SectionTitle>
          <div className="field-grid field-grid-2 field-grid-3-at-xl">
            <Field
              label={t.secondWind}
              value={character.classFeatures.secondWind ?? ''}
              onChange={(v) => updateFeature('secondWind', v)}
              placeholder={t.secondWindPlaceholder}
            />
            <Field
              label={t.actionSurge}
              value={character.classFeatures.actionSurgeUses ?? ''}
              onChange={(v) => updateFeature('actionSurgeUses', v)}
              placeholder={t.actionSurgePlaceholder}
            />
            <Field
              label={t.extraAttack}
              value={character.classFeatures.extraAttack ?? ''}
              onChange={(v) => updateFeature('extraAttack', v)}
              placeholder={t.extraAttackPlaceholder}
            />
            <Field
              label={t.fightingStyle}
              value={character.classFeatures.fightingStyle ?? ''}
              onChange={(v) => updateFeature('fightingStyle', v)}
              placeholder={t.fightingStylePlaceholder}
            />
          </div>
        </div>
      )}
    </>
  )
}

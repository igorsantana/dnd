import type { CharacterClass, SubclassId } from '../data/profiles'
import type { Character, ClassFeatures } from '../types/character'
import type { ClassFeatureDef } from '../data/class-features'
import { isCasterClass } from '../lib/classes'
import { getAttacksPerTurn, resolveFeatures } from '../lib/class-features'
import { pt } from '../i18n/pt'
import { SpellPicker } from './SpellPicker'
import { ChoicePicker } from './ChoicePicker'
import { SectionTitle, Field, TextArea, CheckboxField } from './ui'

interface ClassSectionsProps {
  characterClass: CharacterClass
  subclassId?: SubclassId
  character: Character
  onUpdateSpells: (spells: Character['spells']) => void
  onUpdateSpellSlots: (slots: Character['spellSlots']) => void
  onUpdateClassFeatures: (features: ClassFeatures) => void
  onUpdateSpellcasting: (
    field: 'spellAttackBonus' | 'spellSaveDC',
    value: string,
  ) => void
}

function featureLabel(feature: ClassFeatureDef): string {
  const labels = pt.features as Record<string, string>
  return labels[feature.labelKey] ?? feature.labelKey
}

function featureDetail(feature: ClassFeatureDef): string | undefined {
  if (!feature.detailKey) return undefined
  const labels = pt.features as Record<string, string>
  return labels[feature.detailKey]
}

export function ClassSections({
  characterClass,
  subclassId,
  character,
  onUpdateSpells,
  onUpdateSpellSlots,
  onUpdateClassFeatures,
  onUpdateSpellcasting,
}: ClassSectionsProps) {
  const t = pt.classes
  const isCaster = isCasterClass(characterClass)
  const features = resolveFeatures(characterClass, subclassId, character.level)
  const attacksPerTurn = getAttacksPerTurn(characterClass, character.level)
  const showAttacksPerTurn = characterClass === 'fighter' || characterClass === 'ranger'
  const choices = character.classFeatures.choices ?? {}

  function updateFeature(key: keyof ClassFeatures, value: string | boolean) {
    onUpdateClassFeatures({ ...character.classFeatures, [key]: value })
  }

  function updateChoices(choiceKey: string, next: string[]) {
    const updatedChoices = { ...choices, [choiceKey]: next }
    const patch: ClassFeatures = {
      ...character.classFeatures,
      choices: updatedChoices,
    }
    // Keep legacy fightingStyle scalar in sync for older summary code
    if (choiceKey === 'fightingStyle') {
      patch.fightingStyle = next[0] ?? ''
    }
    onUpdateClassFeatures(patch)
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

  const infoFeatures = features.filter(
    (f) => f.kind === 'info' && f.id !== 'ritualCasting',
  )
  const valueFeatures = features.filter((f) => f.kind === 'value')
  const choiceFeatures = features.filter((f) => f.kind === 'choice')

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

      {(showAttacksPerTurn || infoFeatures.length > 0 || valueFeatures.length > 0 || choiceFeatures.length > 0) && (
        <div className="sheet-section">
          <SectionTitle>{t.classFeatures}</SectionTitle>

          {showAttacksPerTurn && (
            <div className="feature-info-block">
              <p className="sheet-label">{t.attacksPerTurn}</p>
              <p className="text-white feature-info-value">{attacksPerTurn}</p>
            </div>
          )}

          {valueFeatures.map((feature) => {
            const key = feature.valueKey
            if (!key || key === 'choices' || key === 'ritualCasting') return null
            const value = String(character.classFeatures[key] ?? '')
            return (
              <div key={feature.id} className="mt-3">
                <Field
                  label={featureLabel(feature)}
                  value={value}
                  onChange={(v) => updateFeature(key, v)}
                  placeholder={featureDetail(feature)}
                />
                {featureDetail(feature) && (
                  <p className="text-galaxy-color feature-detail">{featureDetail(feature)}</p>
                )}
              </div>
            )
          })}

          {characterClass === 'wizard' && (
            <div className="mt-3 field-grid field-grid-2">
              <CheckboxField
                label={t.ritualCasting}
                checked={character.classFeatures.ritualCasting ?? false}
                onChange={(v) => updateFeature('ritualCasting', v)}
              />
              <TextArea
                label={t.spellbookNotes}
                value={character.classFeatures.spellbookNotes ?? ''}
                onChange={(v) => updateFeature('spellbookNotes', v)}
                rows={2}
              />
            </div>
          )}

          {infoFeatures.map((feature) => (
            <div key={feature.id} className="feature-info-block">
              <p className="text-white feature-info-title">{featureLabel(feature)}</p>
              {featureDetail(feature) && (
                <p className="text-galaxy-color feature-detail">{featureDetail(feature)}</p>
              )}
            </div>
          ))}

          {choiceFeatures.map((feature) => {
            if (!feature.choiceKey || !feature.options || !feature.maxChoices) return null
            return (
              <div key={feature.id} className="mt-4">
                <ChoicePicker
                  label={featureLabel(feature)}
                  options={feature.options}
                  selected={choices[feature.choiceKey] ?? []}
                  maxChoices={feature.maxChoices}
                  onChange={(next) => updateChoices(feature.choiceKey!, next)}
                />
                {featureDetail(feature) && (
                  <p className="text-galaxy-color feature-detail">{featureDetail(feature)}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

import { useId, useState } from 'react'
import { useSnesAccent } from '../contexts/SnesAccentContext'
import {
  snesButtonClass,
  snesCheckboxGroupClass,
  snesCheckboxItemClass,
  snesTextClass,
  snesTitleClass,
  type SnesColor,
} from '../lib/snes'

interface SectionTitleProps {
  children: React.ReactNode
  color?: SnesColor
}

export function SectionTitle({ children, color }: SectionTitleProps) {
  const accent = useSnesAccent()
  return <h2 className={`${snesTitleClass(color ?? accent)} sheet-section-title`}>{children}</h2>
}

interface FieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  className?: string
}

export function Field({ label, value, onChange, placeholder, type = 'text', className }: FieldProps) {
  const id = useId()

  return (
    <div className={`sheet-field ${className ?? ''}`}>
      <label className="sheet-label" htmlFor={id}>
        {label}
      </label>
      <div className="snes-input">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}

interface TextAreaProps {
  label: string
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
}

export function TextArea({ label, value, onChange, rows = 3, placeholder }: TextAreaProps) {
  const id = useId()

  return (
    <div className="sheet-field">
      <label className="sheet-label" htmlFor={id}>
        {label}
      </label>
      <div className="snes-input">
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}

interface CheckboxFieldProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
}

export function CheckboxField({ label, checked, onChange, className }: CheckboxFieldProps) {
  const accent = useSnesAccent()
  const id = useId()

  return (
    <div className={`sheet-field ${className ?? ''}`}>
      <div className={snesCheckboxGroupClass(accent)}>
        <label className={snesCheckboxItemClass(accent)}>
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span className="snes-checkbox__item__content">{label}</span>
        </label>
      </div>
    </div>
  )
}

interface AddButtonProps {
  onClick: () => void
  label: string
}

export function AddButton({ onClick, label }: AddButtonProps) {
  const accent = useSnesAccent()

  return (
    <button type="button" onClick={onClick} className={`snes-link ${snesTextClass(accent)}`}>
      + {label}
    </button>
  )
}

interface RemoveButtonProps {
  onClick: () => void
}

export function RemoveButton({ onClick }: RemoveButtonProps) {
  return (
    <button type="button" onClick={onClick} className="snes-link text-plumber-color" title="Remover">
      [x]
    </button>
  )
}

export function Divider() {
  return <hr className="app-divider" />
}

interface PrimaryButtonProps {
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
  color?: SnesColor
  children: React.ReactNode
}

export function PrimaryButton({
  onClick,
  type = 'button',
  disabled,
  className,
  color,
  children,
}: PrimaryButtonProps) {
  const accent = useSnesAccent()

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${snesButtonClass(color ?? accent)} sheet-primary-btn ${className ?? ''}`}
    >
      {children}
    </button>
  )
}

interface SheetRowProps {
  children: React.ReactNode
  onRemove: () => void
}

export function SheetRow({ children, onRemove }: SheetRowProps) {
  return (
    <div className="sheet-row">
      <div className="sheet-row-fields">{children}</div>
      <div className="sheet-row-action">
        <RemoveButton onClick={onRemove} />
      </div>
    </div>
  )
}

export function PixelScrollList({
  count,
  children,
  className,
  overflowAfter = 5,
}: {
  count: number
  children: React.ReactNode
  className?: string
  overflowAfter?: number
}) {
  const hasOverflow = count > overflowAfter

  return (
    <div className={`pixel-scroll-frame ${hasOverflow ? 'has-overflow' : ''} ${className ?? ''}`}>
      <div
        className="pixel-scroll-list"
        tabIndex={hasOverflow ? 0 : undefined}
        aria-label={hasOverflow ? 'Lista rolável' : undefined}
      >
        {children}
      </div>
      {hasOverflow && <span className="pixel-scroll-cue">▼</span>}
    </div>
  )
}

export function CompactSheetItem({
  title,
  meta,
  detail,
  onEdit,
  onRemove,
}: {
  title: string
  meta?: string
  detail?: string
  onEdit: () => void
  onRemove: () => void
}) {
  return (
    <div className="compact-sheet-item">
      <button type="button" className="compact-sheet-edit" onClick={onEdit}>
        <span className="compact-sheet-title">{title || 'Novo item'}</span>
        {meta && <span className="compact-sheet-meta">{meta}</span>}
        {detail && <span className="compact-sheet-detail">{detail}</span>}
      </button>
      <RemoveButton onClick={onRemove} />
    </div>
  )
}

interface EditableValueProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  className?: string
}

/** Read-only display that turns into an input when clicked. */
export function EditableValue({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  className,
}: EditableValueProps) {
  const [editing, setEditing] = useState(false)
  const id = useId()

  if (editing) {
    return (
      <div className={`sheet-field ${className ?? ''}`}>
        <label className="sheet-label" htmlFor={id}>
          {label}
        </label>
        <div className="snes-input">
          <input
            id={id}
            type={type}
            value={value}
            autoFocus
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Escape') {
                e.currentTarget.blur()
              }
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      className={`editable-value ${className ?? ''}`}
      onClick={() => setEditing(true)}
    >
      <span className="sheet-label">{label}</span>
      <span className="editable-value-text">{value.trim() || '—'}</span>
    </button>
  )
}

/** Read-only stat box matching EditableValue / spellcasting fields. */
export function StatDisplay({
  label,
  value,
  detail,
  className,
}: {
  label: string
  value: string
  detail?: string
  className?: string
}) {
  return (
    <div className={`stat-display ${className ?? ''}`}>
      <span className="sheet-label">{label}</span>
      <span className="editable-value-text">{value.trim() || '—'}</span>
      {detail && <p className="text-galaxy-color feature-detail">{detail}</p>}
    </div>
  )
}

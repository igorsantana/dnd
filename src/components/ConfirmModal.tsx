import { useEffect } from 'react'
import { PrimaryButton } from './ui'

interface ConfirmModalProps {
  title: string
  body: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="snes-modal-overlay" role="presentation" onClick={onCancel}>
      <div
        className="snes-container snes-panel has-grey-bg snes-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="snes-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="snes-modal-title" className="snes-container-title has-galaxy-underline">
          {title}
        </h2>
        <p className="text-galaxy-color snes-modal-body">{body}</p>
        <div className="snes-modal-actions">
          <button type="button" className="snes-link text-galaxy-color" onClick={onCancel}>
            {cancelLabel}
          </button>
          <PrimaryButton type="button" color="galaxy" onClick={onConfirm}>
            {confirmLabel}
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}

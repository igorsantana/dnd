import { useEffect } from 'react'
import { PixelScrollList, PrimaryButton } from './ui'
import { pt } from '../i18n/pt'

interface LevelUpNoticeModalProps {
  characterName: string
  fromLevel: number
  toLevel: number
  additions: string[]
  onContinue: () => void
}

export function LevelUpNoticeModal({
  characterName,
  fromLevel,
  toLevel,
  additions,
  onContinue,
}: LevelUpNoticeModalProps) {
  const t = pt.levelUp
  const formattedAdditions = additions.map((line) => {
    const [title, ...detailParts] = line.split(' — ')
    return {
      title,
      detail: detailParts.join(' — '),
    }
  })

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' || e.key === 'Enter') onContinue()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onContinue])

  return (
    <div className="snes-modal-overlay" role="presentation">
      <div
        className="snes-container snes-panel has-grey-bg snes-modal level-up-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="level-up-notice-title"
      >
        <h2
          id="level-up-notice-title"
          className="snes-container-title has-galaxy-underline level-up-modal-title"
        >
          {t.noticeTitle(characterName)}
        </h2>
        <div className="level-up-transition" aria-label={t.noticeSubtitle(fromLevel, toLevel)}>
          <span className="level-up-old">Nível {fromLevel}</span>
          <span className="level-up-arrow" aria-hidden="true">→</span>
          <span className="level-up-new">Nível {toLevel}</span>
        </div>
        <p className="sheet-label">{t.noticeAdditions}</p>
        <PixelScrollList
          count={formattedAdditions.length}
          overflowAfter={4}
          className="level-up-scroll"
        >
          <ul className="level-up-additions">
            {formattedAdditions.map((item, index) => (
              <li key={`${item.title}-${index}`} className="level-up-addition">
                <span className="level-up-addition-title">{item.title}</span>
                {item.detail && (
                  <span className="text-galaxy-color level-up-addition-detail">
                    {item.detail}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </PixelScrollList>
        <div className="snes-modal-actions">
          <PrimaryButton type="button" color="galaxy" onClick={onContinue}>
            {t.noticeContinue}
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}

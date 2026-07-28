import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Character, Currency, InventoryItem } from '../types/character'
import { PLAYER_PROFILES, getProfileById } from '../data/profiles'
import { fetchCharactersFromCloud } from '../lib/remote-storage'
import { fetchPartyBag, pushPartyBag } from '../lib/party-storage'
import { pt } from '../i18n/pt'
import {
  AddButton,
  Field,
  PixelScrollList,
  PrimaryButton,
  SectionTitle,
  TextArea,
} from './ui'

interface BagPageProps {
  onBack: () => void
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline'

interface OwnerRef {
  profileId: string
  name: string
  image: string
}

interface AggregatedInventoryRow {
  key: string
  name: string
  quantity: number
  owners: OwnerRef[]
}

interface AggregatedMagicRow {
  key: string
  name: string
  attuned: boolean
  description: string
  owners: OwnerRef[]
}

type CoinKey = keyof Currency

const SAVE_DEBOUNCE_MS = 1000
const POLL_MS = 4000

const COIN_ORDER: { key: CoinKey; label: string; className: string }[] = [
  { key: 'copper', label: 'pc', className: 'bag-coin--copper' },
  { key: 'silver', label: 'pp', className: 'bag-coin--silver' },
  { key: 'electrum', label: 'pe', className: 'bag-coin--electrum' },
  { key: 'gold', label: 'po', className: 'bag-coin--gold' },
  { key: 'platinum', label: 'pl', className: 'bag-coin--platinum' },
]

function normalizeItemName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

function parseQty(value: string | undefined): number {
  const n = Number.parseFloat(String(value ?? '1').replace(',', '.'))
  return Number.isFinite(n) ? n : 1
}

function formatQty(n: number): string {
  if (!Number.isFinite(n)) return '1'
  if (Math.abs(n - Math.round(n)) < 0.001) return String(Math.round(n))
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

function parseCoin(value: string | undefined): number {
  const n = Number.parseInt(String(value ?? '0').replace(/\D/g, ''), 10)
  return Number.isFinite(n) ? n : 0
}

function aggregateCurrency(characters: Character[]): Record<CoinKey, number> {
  const totals: Record<CoinKey, number> = {
    copper: 0,
    silver: 0,
    electrum: 0,
    gold: 0,
    platinum: 0,
  }
  for (const character of characters) {
    const c = character.currency
    if (!c) continue
    totals.copper += parseCoin(c.copper)
    totals.silver += parseCoin(c.silver)
    totals.electrum += parseCoin(c.electrum)
    totals.gold += parseCoin(c.gold)
    totals.platinum += parseCoin(c.platinum)
  }
  return totals
}

function MarioCoin({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      <path
        fill="currentColor"
        d="M5 1h6v1H5V1zm-2 2h2V2H4v1H3v2H2v6h1v2h1v1h2v1h6v-1h2v-1h1v-2h1V5h-1V3h-1V2h-2v1H5V3H3zm1 1h1V3H4v1zm8 0h1V3h-1v1zM3 5h1V4H3v1zm10 0h1V4h-1v1zM2 6h1V5H2v1zm12 0h1V5h-1v1zm0 5h1V7h-1v4zM2 11h1V7H2v4zm1 2h1v-1H3v1zm10 0h1v-1h-1v1zM5 14h1v-1H5v1zm5 0h1v-1h-1v1z"
      />
      <path fill="#000" fillOpacity="0.22" d="M6 3h4v1H6V3zM4 5h1V4H4v1zm7 0h1V4h-1v1zM5 12h6v1H5v-1z" />
      <path fill="#fff" fillOpacity="0.35" d="M5 4h1v5H5V4zm1-1h3v1H6V3z" />
      <rect x="7" y="5" width="2" height="5" fill="#000" fillOpacity="0.28" />
    </svg>
  )
}

function ownerFromCharacter(character: Character): OwnerRef | null {
  const profileId = character.profileId
  const profile = profileId ? getProfileById(profileId) : undefined
  const fallback = PLAYER_PROFILES.find(
    (p) =>
      p.characterName.toLowerCase() === character.name.trim().toLowerCase() ||
      p.id === character.profileId,
  )
  const resolved = profile ?? fallback
  if (!resolved) return null
  return {
    profileId: resolved.id,
    name: resolved.characterName,
    image: resolved.image,
  }
}

function aggregateInventory(characters: Character[]): AggregatedInventoryRow[] {
  const map = new Map<string, AggregatedInventoryRow>()
  for (const character of characters) {
    const owner = ownerFromCharacter(character)
    if (!owner) continue
    for (const item of character.inventory ?? []) {
      const name = item.name?.trim()
      if (!name) continue
      const key = normalizeItemName(name)
      const existing = map.get(key)
      const qty = parseQty(item.quantity)
      if (existing) {
        existing.quantity += qty
        if (!existing.owners.some((o) => o.profileId === owner.profileId)) {
          existing.owners.push(owner)
        }
      } else {
        map.set(key, { key, name, quantity: qty, owners: [owner] })
      }
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

function aggregateMagic(characters: Character[]): AggregatedMagicRow[] {
  const map = new Map<string, AggregatedMagicRow>()
  for (const character of characters) {
    const owner = ownerFromCharacter(character)
    if (!owner) continue
    for (const item of character.magicItems ?? []) {
      if (item.equipped) continue
      const name = item.name?.trim()
      if (!name) continue
      const key = `${normalizeItemName(name)}::${item.attuned ? '1' : '0'}`
      const existing = map.get(key)
      if (existing) {
        if (!existing.owners.some((o) => o.profileId === owner.profileId)) {
          existing.owners.push(owner)
        }
      } else {
        map.set(key, {
          key,
          name,
          attuned: Boolean(item.attuned),
          description: item.description?.trim() ?? '',
          owners: [owner],
        })
      }
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

function OwnerAvatars({ owners }: { owners: OwnerRef[] }) {
  return (
    <span className="bag-owner-row" aria-label={owners.map((o) => o.name).join(', ')}>
      {owners.map((owner) => (
        <img
          key={owner.profileId}
          src={owner.image}
          alt={owner.name}
          title={owner.name}
          className="bag-owner-avatar"
        />
      ))}
    </span>
  )
}

function MagicItemModal({
  item,
  onClose,
}: {
  item: AggregatedMagicRow
  onClose: () => void
}) {
  const t = pt.partyBag

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="snes-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="snes-container snes-panel has-grey-bg snes-modal bag-magic-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bag-magic-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="bag-magic-modal-title"
          className="snes-container-title has-galaxy-underline"
        >
          {item.name}
        </h2>
        {item.attuned && (
          <p className="text-galaxy-color bag-magic-modal-meta">{t.attuned}</p>
        )}
        <p className="text-galaxy-color snes-modal-body bag-magic-modal-body">
          {item.description || t.noDescription}
        </p>
        <div className="bag-magic-modal-owners">
          <span className="bag-panel-hint text-galaxy-color">{t.ownersLabel}</span>
          <OwnerAvatars owners={item.owners} />
        </div>
        <div className="snes-modal-actions">
          <PrimaryButton type="button" color="galaxy" onClick={onClose}>
            {t.close}
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}

export function BagPage({ onBack }: BagPageProps) {
  const t = pt.partyBag
  const [characters, setCharacters] = useState<Character[]>([])
  const [bagItems, setBagItems] = useState<InventoryItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedMagic, setSelectedMagic] = useState<AggregatedMagicRow | null>(null)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [cloudHint, setCloudHint] = useState<string | null>(null)
  const remoteUpdatedAtRef = useRef('')
  const dirtyRef = useRef(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const commonRows = useMemo(() => aggregateInventory(characters), [characters])
  const magicRows = useMemo(() => aggregateMagic(characters), [characters])
  const partyCoins = useMemo(() => aggregateCurrency(characters), [characters])

  const persistBag = useCallback(async (items: InventoryItem[]) => {
    setStatus('saving')
    const saved = await pushPartyBag(items)
    if (!saved) {
      setStatus('error')
      return
    }
    remoteUpdatedAtRef.current = saved.updatedAt
    dirtyRef.current = false
    setBagItems(saved.items)
    setStatus('saved')
  }, [])

  const scheduleSave = useCallback(
    (items: InventoryItem[]) => {
      dirtyRef.current = true
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        void persistBag(items)
      }, SAVE_DEBOUNCE_MS)
    },
    [persistBag],
  )

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const [{ characters: remote, available }, bag] = await Promise.all([
        fetchCharactersFromCloud(),
        fetchPartyBag(),
      ])
      if (cancelled) return
      if (!available) {
        setCloudHint(pt.admin.cloudOffline)
      }
      setCharacters(remote)
      if (!bag.available) {
        setStatus('offline')
        return
      }
      setBagItems(bag.doc?.items ?? [])
      remoteUpdatedAtRef.current = bag.doc?.updatedAt ?? ''
      setStatus('saved')
    })()
    return () => {
      cancelled = true
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      void fetchCharactersFromCloud().then(({ characters: remote, available }) => {
        if (available) setCharacters(remote)
      })
      if (dirtyRef.current) return
      void fetchPartyBag().then(({ doc, available }) => {
        if (!available || !doc) return
        if (!doc.updatedAt || doc.updatedAt === remoteUpdatedAtRef.current) return
        remoteUpdatedAtRef.current = doc.updatedAt
        setBagItems(doc.items)
        setStatus('saved')
      })
    }, POLL_MS)
    return () => window.clearInterval(timer)
  }, [])

  function updateBagItems(next: InventoryItem[]) {
    setBagItems(next)
    scheduleSave(next)
  }

  function addBagItem() {
    const item: InventoryItem = {
      id: crypto.randomUUID(),
      name: '',
      quantity: '1',
      notes: '',
    }
    updateBagItems([...bagItems, item])
    setEditingId(item.id)
  }

  function updateBagItem(id: string, patch: Partial<InventoryItem>) {
    updateBagItems(bagItems.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  function removeBagItem(id: string) {
    updateBagItems(bagItems.filter((item) => item.id !== id))
    if (editingId === id) setEditingId(null)
  }

  const statusLabel =
    status === 'saving'
      ? t.saving
      : status === 'saved'
        ? t.saved
        : status === 'error'
          ? t.error
          : status === 'offline'
            ? t.offline
            : ''

  return (
    <div className="app-shell party-page bag-page bg-black">
      <header className="party-page-header">
        <div>
          <h1 className="snes-container-title has-galaxy-underline">{t.title}</h1>
          {cloudHint && <p className="text-plumber-color party-page-subtitle">{cloudHint}</p>}
        </div>

        <div className="bag-party-coins" aria-label={t.partyCoins}>
          {COIN_ORDER.map((coin) => (
            <span key={coin.key} className={`bag-coin-chip ${coin.className}`} title={coin.label}>
              <MarioCoin className="bag-coin-icon" />
              <span className="bag-coin-amount">{partyCoins[coin.key]}</span>
              <span className="bag-coin-label">{coin.label}</span>
            </span>
          ))}
        </div>

        <div className="party-page-actions">
          {statusLabel && (
            <span className="text-galaxy-color party-sync-status" role="status">
              {statusLabel}
            </span>
          )}
          <PrimaryButton type="button" color="plumber" onClick={onBack}>
            {pt.partyShared.back}
          </PrimaryButton>
        </div>
      </header>

      <div className="bag-layout">
        <section className="bag-panel bag-panel-common snes-container snes-panel has-grey-bg">
          <SectionTitle>{t.commonTitle}</SectionTitle>
          <p className="text-galaxy-color bag-panel-hint">{t.commonHint}</p>
          <PixelScrollList
            count={Math.max(commonRows.length, 1)}
            overflowAfter={0}
            className="bag-scroll-fill"
          >
            <ul className="bag-list">
              {commonRows.map((row) => (
                <li key={row.key} className="bag-list-row">
                  <span className="bag-list-line">
                    <span className="bag-list-qty">{formatQty(row.quantity)} x</span> {row.name}
                  </span>
                  <OwnerAvatars owners={row.owners} />
                </li>
              ))}
              {commonRows.length === 0 && (
                <li className="text-galaxy-color bag-empty">{t.empty}</li>
              )}
            </ul>
          </PixelScrollList>
        </section>

        <div className="bag-right-stack">
          <section className="bag-panel bag-panel-magic snes-container snes-panel has-grey-bg">
            <SectionTitle>{t.magicTitle}</SectionTitle>
            <PixelScrollList
              count={Math.max(magicRows.length, 1)}
              overflowAfter={0}
              className="bag-scroll-fill"
            >
              <ul className="bag-list">
                {magicRows.map((row) => (
                  <li key={row.key} className="bag-list-row">
                    <button
                      type="button"
                      className="bag-list-button"
                      onClick={() => setSelectedMagic(row)}
                    >
                      <span className="bag-list-line">
                        <span className="bag-list-qty">1 x</span>{' '}
                        {row.attuned && <span className="bag-attuned-flag">[A]</span>}{' '}
                        {row.name}
                      </span>
                      <OwnerAvatars owners={row.owners} />
                    </button>
                  </li>
                ))}
                {magicRows.length === 0 && (
                  <li className="text-galaxy-color bag-empty">{t.empty}</li>
                )}
              </ul>
            </PixelScrollList>
          </section>

          <section className="bag-panel bag-panel-boi snes-container snes-panel has-grey-bg">
            <SectionTitle>{t.boiTitle}</SectionTitle>
            <p className="text-galaxy-color bag-panel-hint">{t.boiHint}</p>
            <PixelScrollList
              count={Math.max(bagItems.length, 1)}
              overflowAfter={0}
              className="bag-scroll-fill"
            >
              {bagItems.map((item) =>
                editingId === item.id ? (
                  <div key={item.id} className="sheet-row-fields bag-edit-row">
                    <Field
                      label={pt.sheet.fields.itemName}
                      value={item.name}
                      onChange={(v) => updateBagItem(item.id, { name: v })}
                    />
                    <Field
                      label={pt.sheet.fields.quantity}
                      value={item.quantity}
                      onChange={(v) => updateBagItem(item.id, { quantity: v })}
                    />
                    <TextArea
                      label={pt.sheet.fields.notes}
                      value={item.notes}
                      onChange={(v) => updateBagItem(item.id, { notes: v })}
                      rows={2}
                    />
                    <button
                      type="button"
                      className="snes-link text-galaxy-color"
                      onClick={() => setEditingId(null)}
                    >
                      {t.doneEditing}
                    </button>
                    <button
                      type="button"
                      className="snes-link text-plumber-color"
                      onClick={() => removeBagItem(item.id)}
                    >
                      {t.remove}
                    </button>
                  </div>
                ) : (
                  <div key={item.id} className="bag-list-row bag-list-row-editable">
                    <button
                      type="button"
                      className="bag-list-button"
                      onClick={() => setEditingId(item.id)}
                    >
                      <span className="bag-list-line">
                        <span className="bag-list-qty">{item.quantity || '1'} x</span>{' '}
                        {item.name || t.empty}
                      </span>
                      <img
                        src="/sprites/boi-bag-backpack.png"
                        alt={t.boiTitle}
                        className="bag-owner-avatar"
                      />
                    </button>
                    <button
                      type="button"
                      className="snes-link text-plumber-color bag-inline-remove"
                      onClick={() => removeBagItem(item.id)}
                    >
                      {t.remove}
                    </button>
                  </div>
                ),
              )}
              {bagItems.length === 0 && (
                <p className="text-galaxy-color bag-empty">{t.empty}</p>
              )}
            </PixelScrollList>
            <AddButton onClick={addBagItem} label={t.addItem} />
          </section>
        </div>
      </div>

      {selectedMagic && (
        <MagicItemModal item={selectedMagic} onClose={() => setSelectedMagic(null)} />
      )}
    </div>
  )
}

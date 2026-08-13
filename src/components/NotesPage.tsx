import { useCallback, useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import { pt } from '../i18n/pt'
import {
  fetchPartyNotes,
  pushPartyNotes,
  uploadPartyNoteImage,
  type DiaryPage,
  type PartyNotesDoc,
} from '../lib/party-storage'
import { PrimaryButton } from './ui'

interface NotesPageProps {
  onBack: () => void
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline'

const SAVE_DEBOUNCE_MS = 1000
const POLL_MS = 3500

function emptyDoc(): PartyNotesDoc {
  return { v: 2, pages: [], updatedAt: '' }
}

function makePage(title: string): DiaryPage {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    title,
    html: '',
    createdAt: now,
    updatedAt: now,
    updatedBy: 'player',
  }
}

export function NotesPage({ onBack }: NotesPageProps) {
  const t = pt.partyNotes
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [ready, setReady] = useState(false)
  const [doc, setDoc] = useState<PartyNotesDoc | null>(null)
  const [activePageId, setActivePageId] = useState<string | null>(null)

  const docRef = useRef<PartyNotesDoc | null>(null)
  const activePageIdRef = useRef<string | null>(null)
  const remoteUpdatedAtRef = useRef('')
  const dirtyRef = useRef(false)
  const applyingRef = useRef(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  activePageIdRef.current = activePageId

  useEffect(() => {
    docRef.current = doc
  }, [doc])

  const persist = useCallback(async () => {
    setStatus('saving')
    const current = docRef.current ?? emptyDoc()
    const saved = await pushPartyNotes(current.pages, 'player')
    if (!saved) {
      setStatus('error')
      return
    }
    remoteUpdatedAtRef.current = saved.updatedAt
    dirtyRef.current = false
    setStatus('saved')
  }, [])

  const scheduleSave = useCallback(() => {
    dirtyRef.current = true
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      void persist()
    }, SAVE_DEBOUNCE_MS)
  }, [persist])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'notes-link' },
      }),
      Image.configure({
        HTMLAttributes: { class: 'notes-image' },
      }),
      Placeholder.configure({
        placeholder: t.placeholder,
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'notes-prose',
      },
    },
    onUpdate: ({ editor: current }) => {
      if (applyingRef.current) return
      const id = activePageIdRef.current
      if (!id) return
      const html = current.getHTML()
      setDoc((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          pages: prev.pages.map((p) => (p.id === id ? { ...p, html } : p)),
        }
      })
      scheduleSave()
    },
    onBlur: () => {
      if (!dirtyRef.current) return
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      void persist()
    },
  })

  useEffect(() => {
    if (!editor) return
    let cancelled = false

    void (async () => {
      const { doc: remote, available } = await fetchPartyNotes()
      if (cancelled) return
      if (!available || !remote) {
        setStatus('offline')
        setReady(true)
        return
      }
      remoteUpdatedAtRef.current = remote.updatedAt
      const first = remote.pages[0] ?? null
      setDoc(remote)
      setActivePageId(first?.id ?? null)
      applyingRef.current = true
      editor.commands.setContent(first?.html ?? '', { emitUpdate: false })
      applyingRef.current = false
      setReady(true)
      setStatus('saved')
    })()

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
      cancelled = true
      window.removeEventListener('beforeunload', onBeforeUnload)
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [editor])

  useEffect(() => {
    if (!editor) return
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      if (dirtyRef.current) return

      void fetchPartyNotes().then(({ doc: remote, available }) => {
        if (!available || !remote) return
        if (!remote.updatedAt || remote.updatedAt === remoteUpdatedAtRef.current) return
        remoteUpdatedAtRef.current = remote.updatedAt
        const currentId = activePageIdRef.current
        const nextId = remote.pages.some((p) => p.id === currentId)
          ? currentId
          : (remote.pages[0]?.id ?? null)
        const page = nextId ? remote.pages.find((p) => p.id === nextId) : undefined
        applyingRef.current = true
        setDoc(remote)
        setActivePageId(nextId)
        editor.commands.setContent(page?.html ?? '', { emitUpdate: false })
        applyingRef.current = false
        setStatus('saved')
      })
    }, POLL_MS)

    return () => window.clearInterval(timer)
  }, [editor])

  async function handleImagePick(file: File | undefined) {
    if (!file || !editor) return
    const url = await uploadPartyNoteImage(file)
    if (!url) {
      setStatus('error')
      return
    }
    editor.chain().focus().setImage({ src: url }).run()
  }

  function promptLink() {
    if (!editor) return
    const previous = editor.getAttributes('link').href as string | undefined
    const url = window.prompt(t.linkPrompt, previous ?? 'https://')
    if (url === null) return
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
  }

  function openPage(id: string) {
    const page = docRef.current?.pages.find((p) => p.id === id) ?? null
    setActivePageId(id)
    if (editor) {
      applyingRef.current = true
      editor.commands.setContent(page?.html ?? '', { emitUpdate: false })
      applyingRef.current = false
    }
  }

  function addPage() {
    const n = (docRef.current?.pages.length ?? 0) + 1
    const page = makePage(`Página ${n}`)
    setDoc((prev) => ({ v: 2, pages: [...(prev?.pages ?? []), page], updatedAt: prev?.updatedAt ?? '' }))
    setActivePageId(page.id)
    if (editor) {
      applyingRef.current = true
      editor.commands.setContent('', { emitUpdate: false })
      applyingRef.current = false
      editor.chain().focus().run()
    }
    scheduleSave()
  }

  function deletePage(id: string) {
    if (!window.confirm(t.deletePageConfirm)) return
    const prev = docRef.current ?? emptyDoc()
    const remaining = prev.pages.filter((p) => p.id !== id)
    setDoc((d) => (d ? { ...d, pages: remaining } : d))
    if (id === activePageIdRef.current) {
      const next = remaining[remaining.length - 1] ?? null
      setActivePageId(next?.id ?? null)
      if (editor) {
        applyingRef.current = true
        editor.commands.setContent(next?.html ?? '', { emitUpdate: false })
        applyingRef.current = false
      }
    }
    scheduleSave()
  }

  function renameActivePage(title: string) {
    const id = activePageIdRef.current
    if (!id) return
    setDoc((prev) =>
      prev
        ? {
            ...prev,
            pages: prev.pages.map((p) => (p.id === id ? { ...p, title } : p)),
          }
        : prev,
    )
    scheduleSave()
  }

  const activePage = doc?.pages.find((p) => p.id === activePageId) ?? null

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
    <div className="app-shell party-page notes-page min-h-screen bg-black">
      <header className="party-page-header">
        <div>
          <h1 className="snes-container-title has-galaxy-underline">{t.title}</h1>
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

      <div className="notes-layout">
        <aside className="notes-sidebar">
          <div className="notes-page-list">
            {doc?.pages.map((page) => (
              <div
                key={page.id}
                className={`note-page-row ${page.id === activePageId ? 'is-active' : ''}`}
              >
                <button
                  type="button"
                  className="note-page-open"
                  onClick={() => openPage(page.id)}
                >
                  <span className="note-page-title">{page.title || '…'}</span>
                </button>
                <button
                  type="button"
                  className="note-page-delete"
                  aria-label={t.deletePage}
                  onClick={() => deletePage(page.id)}
                >
                  ✕
                </button>
              </div>
            ))}
            <button type="button" className="note-page-new" onClick={addPage}>
              ＋ {t.newPage}
            </button>
          </div>
        </aside>

        <div className={`notes-editor-shell ${ready ? '' : 'notes-editor-loading'}`}>
          <div className="notes-page-titlebar">
            <input
              type="text"
              value={activePage?.title ?? ''}
              onChange={(e) => renameActivePage(e.target.value)}
              placeholder={t.pageTitlePlaceholder}
              className="notes-page-title-input"
              disabled={!activePage}
            />
          </div>

          <div className="notes-toolbar" role="toolbar" aria-label={t.toolbarLabel}>
            <button
              type="button"
              className={`notes-tool ${editor?.isActive('bold') ? 'is-active' : ''}`}
              onClick={() => editor?.chain().focus().toggleBold().run()}
              disabled={!editor}
            >
              {t.tools.bold}
            </button>
            <button
              type="button"
              className={`notes-tool ${editor?.isActive('italic') ? 'is-active' : ''}`}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              disabled={!editor}
            >
              {t.tools.italic}
            </button>
            <button
              type="button"
              className={`notes-tool ${editor?.isActive('underline') ? 'is-active' : ''}`}
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              disabled={!editor}
            >
              {t.tools.underline}
            </button>
            <button
              type="button"
              className={`notes-tool ${editor?.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              disabled={!editor}
            >
              {t.tools.heading}
            </button>
            <button
              type="button"
              className={`notes-tool ${editor?.isActive('bulletList') ? 'is-active' : ''}`}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              disabled={!editor}
            >
              {t.tools.list}
            </button>
            <button
              type="button"
              className={`notes-tool ${editor?.isActive('orderedList') ? 'is-active' : ''}`}
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              disabled={!editor}
            >
              {t.tools.ordered}
            </button>
            <button
              type="button"
              className={`notes-tool ${editor?.isActive('blockquote') ? 'is-active' : ''}`}
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              disabled={!editor}
            >
              {t.tools.quote}
            </button>
            <button
              type="button"
              className={`notes-tool ${editor?.isActive('link') ? 'is-active' : ''}`}
              onClick={promptLink}
              disabled={!editor}
            >
              {t.tools.link}
            </button>
            <button
              type="button"
              className="notes-tool"
              onClick={() => fileInputRef.current?.click()}
              disabled={!editor}
            >
              {t.tools.image}
            </button>
            <button
              type="button"
              className="notes-tool"
              onClick={() => editor?.chain().focus().undo().run()}
              disabled={!editor?.can().undo()}
            >
              {t.tools.undo}
            </button>
            <button
              type="button"
              className="notes-tool"
              onClick={() => editor?.chain().focus().redo().run()}
              disabled={!editor?.can().redo()}
            >
              {t.tools.redo}
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              void handleImagePick(file)
            }}
          />

          <div className="notes-editor-surface">
            <EditorContent editor={editor} className="notes-editor-scroll" />
            {!activePage && (
              <div className="notes-empty-hint">
                <p>{t.emptyPages}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
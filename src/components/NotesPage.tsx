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
} from '../lib/party-storage'
import { PrimaryButton } from './ui'

interface NotesPageProps {
  onBack: () => void
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline'

const SAVE_DEBOUNCE_MS = 1000
const POLL_MS = 3500

export function NotesPage({ onBack }: NotesPageProps) {
  const t = pt.partyNotes
  const remoteUpdatedAtRef = useRef('')
  const dirtyRef = useRef(false)
  const applyingRemoteRef = useRef(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [ready, setReady] = useState(false)

  const persist = useCallback(async (html: string) => {
    setStatus('saving')
    const saved = await pushPartyNotes(html, 'player')
    if (!saved) {
      setStatus('error')
      return false
    }
    remoteUpdatedAtRef.current = saved.updatedAt
    dirtyRef.current = false
    setStatus('saved')
    return true
  }, [])

  const scheduleSave = useCallback(
    (html: string) => {
      dirtyRef.current = true
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        void persist(html)
      }, SAVE_DEBOUNCE_MS)
    },
    [persist],
  )

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
      if (applyingRemoteRef.current) return
      scheduleSave(current.getHTML())
    },
    onBlur: ({ editor: current }) => {
      if (!dirtyRef.current) return
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      void persist(current.getHTML())
    },
  })

  useEffect(() => {
    if (!editor) return
    let cancelled = false

    void (async () => {
      const { doc, available } = await fetchPartyNotes()
      if (cancelled) return
      if (!available) {
        setStatus('offline')
        setReady(true)
        return
      }
      remoteUpdatedAtRef.current = doc?.updatedAt ?? ''
      applyingRemoteRef.current = true
      editor.commands.setContent(doc?.html ?? '', { emitUpdate: false })
      applyingRemoteRef.current = false
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

      void fetchPartyNotes().then(({ doc, available }) => {
        if (!available || !doc) return
        if (!doc.updatedAt || doc.updatedAt === remoteUpdatedAtRef.current) return
        if (dirtyRef.current) return
        remoteUpdatedAtRef.current = doc.updatedAt
        applyingRemoteRef.current = true
        editor.commands.setContent(doc.html ?? '', { emitUpdate: false })
        applyingRemoteRef.current = false
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

      <div className={`notes-editor-shell ${ready ? '' : 'notes-editor-loading'}`}>
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

        <EditorContent editor={editor} className="notes-editor-surface" />
      </div>
    </div>
  )
}

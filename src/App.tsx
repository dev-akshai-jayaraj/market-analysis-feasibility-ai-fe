'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ApiError,
  checkHealth,
  listDocuments,
  listRuns,
  setApiKey,
  type RunSummary,
} from './api'
import { AdminView } from './components/AdminView'
import { ApiKeyDialog } from './components/ApiKeyDialog'
import { BriefForm } from './components/BriefForm'
import { DocumentsView } from './components/DocumentsView'
import { ChartIcon, DocumentIcon, KeyIcon, PlusIcon } from './components/Icons'
import { ThemeToggle } from './components/ThemeToggle'
import { RunList } from './components/RunList'
import { RunView } from './components/RunView'

const HEALTH_POLL_MS = 15_000
const RUNS_POLL_MS = 10_000
const TITLES_STORAGE = 'mra.titles'
const TITLE_LENGTH = 120

type View = { name: 'new' } | { name: 'run'; id: string } | { name: 'documents' } | { name: 'admin' }

// The view lives in the query string so a reload or a shared link reopens it.
function readView(): View {
  const params = new URLSearchParams(window.location.search)
  const run = params.get('run')
  if (run) return { name: 'run', id: run }
  const view = params.get('view')
  return view === 'documents' || view === 'admin' ? { name: view } : { name: 'new' }
}

function viewUrl(view: View): string {
  if (view.name === 'run') return `?run=${encodeURIComponent(view.id)}`
  return view.name === 'new' ? window.location.pathname : `?view=${view.name}`
}

function loadTitles(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(TITLES_STORAGE) ?? '{}')
  } catch {
    return {}
  }
}

export default function App() {
  const [view, setView] = useState<View>({ name: 'new' })
  const [runs, setRuns] = useState<RunSummary[] | null>(null)
  const [runsError, setRunsError] = useState<string | null>(null)
  const [titles, setTitles] = useState<Record<string, string>>({})
  const [documentCount, setDocumentCount] = useState<number | null>(null)
  const [healthy, setHealthy] = useState<boolean | null>(null)
  const [keyDialog, setKeyDialog] = useState<'closed' | 'open' | 'rejected'>('closed')
  // Bumped when the key changes, to refetch everything with the new key.
  const [session, setSession] = useState(0)
  // The key dialog opens by itself once per key, not on every failed poll.
  const promptedFor = useRef(-1)

  // The URL and localStorage don't exist during server rendering, so both are
  // read after mount; reading them in the initial state would break hydration.
  useEffect(() => {
    setView(readView())
    setTitles(loadTitles())
    const onPop = () => setView(readView())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = useCallback((next: View) => {
    window.history.pushState(null, '', viewUrl(next))
    setView(next)
  }, [])

  const rememberTitle = useCallback((id: string, project: string) => {
    const title = project.trim().slice(0, TITLE_LENGTH)
    setTitles((current) => {
      if (current[id] === title) return current
      const next = { ...current, [id]: title }
      try {
        localStorage.setItem(TITLES_STORAGE, JSON.stringify(next))
      } catch {
        // Titles just won't survive a reload.
      }
      return next
    })
  }, [])

  const refreshRuns = useCallback(async (signal?: AbortSignal) => {
    try {
      setRuns(await listRuns(signal))
      setRunsError(null)
    } catch (caught) {
      if (signal?.aborted) return
      if (caught instanceof ApiError && caught.status === 401) {
        setRunsError('Enter a valid API key to see analyses.')
        if (promptedFor.current !== session) {
          promptedFor.current = session
          setKeyDialog('rejected')
        }
      } else {
        setRunsError(caught instanceof Error ? caught.message : 'Could not load analyses.')
      }
    }
  }, [session])

  const refreshDocuments = useCallback(() => {
    listDocuments()
      .then((documents) => setDocumentCount(documents.length))
      .catch(() => setDocumentCount(null))
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    refreshRuns(controller.signal)
    refreshDocuments()
    const timer = setInterval(() => refreshRuns(controller.signal), RUNS_POLL_MS)
    return () => {
      controller.abort()
      clearInterval(timer)
    }
  }, [refreshRuns, refreshDocuments, session])

  useEffect(() => {
    const controller = new AbortController()
    const poll = () => checkHealth(controller.signal).then((ok) => !controller.signal.aborted && setHealthy(ok))
    poll()
    const timer = setInterval(poll, HEALTH_POLL_MS)
    return () => {
      controller.abort()
      clearInterval(timer)
    }
  }, [])

  function saveKey(key: string) {
    setApiKey(key)
    setKeyDialog('closed')
    setRuns(null)
    setSession((count) => count + 1)
  }

  const onRunChanged = useCallback(() => {
    refreshRuns()
  }, [refreshRuns])

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <div className="brand-text">
            <h1>Market Research Analysis</h1>
            <p>Cited feasibility reports with a scored, human-reviewed recommendation</p>
          </div>
        </div>
        <div className="topbar-actions">
          <span
            className={`status status-${healthy === null ? 'checking' : healthy ? 'up' : 'down'}`}
            role="status"
          >
            <span className="status-dot" />
            {healthy === null ? 'Checking API…' : healthy ? 'API online' : 'API offline'}
          </span>
          <ThemeToggle />
          <span className="topbar-divider" aria-hidden="true" />
          <button type="button" className="button" onClick={() => setKeyDialog('open')}>
            <KeyIcon />
            API key
          </button>
          <button type="button" className="button primary" onClick={() => navigate({ name: 'new' })}>
            <PlusIcon />
            New analysis
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <RunList
            runs={runs}
            titles={titles}
            activeId={view.name === 'run' ? view.id : null}
            onSelect={(id) => navigate({ name: 'run', id })}
          />
          {runsError && <p className="sidebar-error small">{runsError}</p>}
          <nav className="side-links" aria-label="Workspace">
            <p className="sidebar-label">Workspace</p>
            <button
              type="button"
              className={view.name === 'documents' ? 'is-active' : ''}
              aria-current={view.name === 'documents' ? 'page' : undefined}
              onClick={() => navigate({ name: 'documents' })}
            >
              <DocumentIcon />
              <span className="side-link-label">Internal documents</span>
              {documentCount !== null && <span className="count">{documentCount}</span>}
            </button>
            <button
              type="button"
              className={view.name === 'admin' ? 'is-active' : ''}
              aria-current={view.name === 'admin' ? 'page' : undefined}
              onClick={() => navigate({ name: 'admin' })}
            >
              <ChartIcon />
              <span className="side-link-label">Usage and audit</span>
            </button>
          </nav>
        </aside>

        {/* Keyed on the session so every view refetches after the API key changes. */}
        <main className="main" key={session}>
          {healthy === false && (
            <div className="alert alert-warn" role="status">
              The analysis API isn&apos;t reachable. Start it with <code>uv run python main.py</code> in the
              Market_Research_Analysis project.
            </div>
          )}

          {view.name === 'new' && (
            <BriefForm
              documentCount={documentCount}
              onManageDocuments={() => navigate({ name: 'documents' })}
              onStarted={(id, project) => {
                rememberTitle(id, project)
                refreshRuns()
                navigate({ name: 'run', id })
              }}
            />
          )}

          {view.name === 'run' && (
            <RunView
              key={view.id}
              id={view.id}
              onChanged={onRunChanged}
              onLoaded={rememberTitle}
              onDeleted={() => {
                refreshRuns()
                navigate({ name: 'new' })
              }}
            />
          )}

          {view.name === 'documents' && <DocumentsView onChanged={refreshDocuments} />}
          {view.name === 'admin' && <AdminView />}
        </main>
      </div>

      {keyDialog !== 'closed' && (
        <ApiKeyDialog
          rejected={keyDialog === 'rejected'}
          onSave={saveKey}
          onClose={() => setKeyDialog('closed')}
        />
      )}
    </div>
  )
}

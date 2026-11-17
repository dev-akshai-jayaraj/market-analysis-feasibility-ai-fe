import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ApiError,
  deleteRun,
  downloadReport,
  errorMessage,
  getRun,
  REPORT_FORMATS,
  resumeRun,
  type ReportFormat,
  type Run,
} from '../api'
import { dateTime } from '../format'
import { STATUS_LABELS } from '../labels'
import { Details } from './Details'
import { Financials } from './Financials'
import { Overview } from './Overview'
import { ProgressCard } from './ProgressCard'
import { ReviewPanel } from './ReviewPanel'
import { Risks } from './Risks'
import { Sections } from './Sections'

const POLL_MS = 3000

const TABS = ['Overview', 'Financials', 'Risks', 'Sections', 'Details'] as const
type Tab = (typeof TABS)[number]

const FORMAT_LABELS: Record<ReportFormat, string> = {
  pdf: 'PDF',
  docx: 'Word',
  pptx: 'Slides',
  html: 'HTML',
  md: 'Markdown',
}

interface Props {
  id: string
  /** Called when the run's status changes, so the list can refresh. */
  onChanged: () => void
  onLoaded: (id: string, project: string) => void
  onDeleted: () => void
}

export function RunView({ id, onChanged, onLoaded, onDeleted }: Props) {
  const [run, setRun] = useState<Run | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('Overview')
  const [exporting, setExporting] = useState<ReportFormat | null>(null)
  const [reload, setReload] = useState(0)
  const lastStatus = useRef<string | null>(null)
  const exportMenu = useRef<HTMLDetailsElement>(null)

  const refresh = useCallback(() => setReload((count) => count + 1), [])

  // Load the run, and keep polling while it is running.
  useEffect(() => {
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout>

    async function load() {
      try {
        const loaded = await getRun(id, controller.signal)
        setRun(loaded)
        setError(null)
        if (loaded.results.brief?.project) onLoaded(id, loaded.results.brief.project)
        if (lastStatus.current !== loaded.status) {
          if (lastStatus.current !== null) onChanged()
          lastStatus.current = loaded.status
        }
        if (loaded.status === 'running') timer = setTimeout(load, POLL_MS)
      } catch (caught) {
        if (controller.signal.aborted) return
        setError(errorMessage(caught))
        // Keep trying through a brief outage, but not after "not found" or "not allowed".
        const status = caught instanceof ApiError ? caught.status : undefined
        if (!status || status >= 500) timer = setTimeout(load, POLL_MS * 2)
      }
    }

    load()
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
    // onChanged and onLoaded are stable callbacks from App.
  }, [id, reload])

  async function act(action: () => Promise<unknown>) {
    setActionError(null)
    try {
      await action()
      refresh()
      onChanged()
    } catch (caught) {
      setActionError(errorMessage(caught))
    }
  }

  async function exportReport(format: ReportFormat) {
    if (exportMenu.current) exportMenu.current.open = false
    setExporting(format)
    setActionError(null)
    try {
      await downloadReport(id, format)
    } catch (caught) {
      setActionError(errorMessage(caught))
    } finally {
      setExporting(null)
    }
  }

  async function remove() {
    if (!window.confirm('Delete this analysis and its saved state? This cannot be undone.')) return
    setActionError(null)
    try {
      await deleteRun(id)
      onDeleted()
    } catch (caught) {
      setActionError(errorMessage(caught))
    }
  }

  if (!run) {
    return error ? (
      <div className="alert" role="alert">
        {error}
      </div>
    ) : (
      <p className="muted">Loading analysis…</p>
    )
  }

  const { results, status } = run
  const stopped = status === 'failed' || status === 'interrupted'
  const company = results.brief?.company?.name

  return (
    <article className="run">
      <header className="run-head">
        <div className="run-heading">
          <p className="run-status">
            <span className={`dot dot-${status}`} /> {STATUS_LABELS[status] ?? status}
            <span className="muted">
              {' '}
              · started {dateTime(run.created_at)} by {run.created_by}
            </span>
          </p>
          <h2>{company ? `Feasibility: ${company}` : 'Feasibility analysis'}</h2>
          {results.brief?.project && <p className="run-project">{results.brief.project}</p>}
        </div>
        <div className="button-row">
          <details className="menu" ref={exportMenu}>
            <summary className="button">{exporting ? 'Preparing…' : 'Export report'}</summary>
            <div className="menu-items card">
              {REPORT_FORMATS.map((format) => (
                <button key={format} type="button" onClick={() => exportReport(format)} disabled={exporting !== null}>
                  {FORMAT_LABELS[format]}
                </button>
              ))}
              {!results.decision && <p className="muted small">Marked DRAFT until the analysis is approved.</p>}
            </div>
          </details>
          <button type="button" className="button danger" onClick={remove} disabled={status === 'running'}>
            Delete
          </button>
        </div>
      </header>

      {error && (
        <div className="alert alert-warn" role="alert">
          Could not refresh: {error}
        </div>
      )}
      {actionError && (
        <div className="alert" role="alert">
          {actionError}
        </div>
      )}

      {stopped && (
        <div className="alert" role="alert">
          <strong>{status === 'failed' ? 'This analysis failed.' : 'This analysis was interrupted.'}</strong>{' '}
          {run.error}
          <div className="alert-actions">
            <button type="button" className="button" onClick={() => act(() => resumeRun(id))}>
              Resume from the last saved step
            </button>
          </div>
        </div>
      )}

      {(status === 'running' || stopped) && <ProgressCard run={run} />}

      {status === 'awaiting_review' && <ReviewPanel key={run.updated_at} run={run} onSubmitted={() => act(async () => {})} />}

      <div className="tabs" role="tablist" aria-label="Results">
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={name === tab}
            className={`tab${name === tab ? ' is-active' : ''}`}
            onClick={() => setTab(name)}
          >
            {name}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="tab-panel">
        {tab === 'Overview' && <Overview run={run} />}
        {tab === 'Financials' && <Financials financial={results.financial} />}
        {tab === 'Risks' && <Risks risks={results.risks} />}
        {tab === 'Sections' && <Sections findings={results.findings} />}
        {tab === 'Details' && <Details run={run} />}
      </div>
    </article>
  )
}

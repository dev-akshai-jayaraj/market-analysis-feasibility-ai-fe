import type { RunSummary } from '../api'
import { dateTime } from '../format'
import { STATUS_LABELS } from '../labels'

interface Props {
  runs: RunSummary[] | null
  /** Project text by run id, remembered in this browser; the list endpoint does not return it. */
  titles: Record<string, string>
  activeId: string | null
  onSelect: (id: string) => void
}

export function RunList({ runs, titles, activeId, onSelect }: Props) {
  const awaiting = runs?.filter((run) => run.status === 'awaiting_review').length ?? 0

  return (
    <nav className="runs" aria-label="Analyses">
      <div className="runs-head">
        <h2 className="sidebar-label">Analyses</h2>
        {runs !== null && runs.length > 0 && <span className="count">{runs.length}</span>}
        {awaiting > 0 && (
          <span className="count count-warn" title="Waiting for a reviewer">
            {awaiting} to review
          </span>
        )}
      </div>
      {runs === null ? (
        <ul aria-busy="true" aria-label="Loading analyses">
          {[0, 1, 2, 3].map((index) => (
            <li key={index} className="run-skeleton">
              <span className="skeleton" style={{ width: '85%' }} />
              <span className="skeleton" style={{ width: '45%' }} />
            </li>
          ))}
        </ul>
      ) : runs.length === 0 ? (
        <p className="sidebar-empty">Analyses started in your organisation are listed here.</p>
      ) : (
        <ul>
          {runs.map((run) => (
            <li key={run.id}>
              <button
                type="button"
                className={`run-item${run.id === activeId ? ' is-active' : ''}`}
                aria-current={run.id === activeId ? 'page' : undefined}
                onClick={() => onSelect(run.id)}
              >
                <span className="run-title">{titles[run.id] ?? `Analysis ${run.id.slice(0, 8)}`}</span>
                <span className="run-meta">
                  <span className={`dot dot-${run.status}`} />
                  {STATUS_LABELS[run.status] ?? run.status}
                </span>
                <span className="run-meta">
                  {dateTime(run.created_at)} · {run.created_by}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </nav>
  )
}

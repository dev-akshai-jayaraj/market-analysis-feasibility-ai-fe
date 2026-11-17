import { useState } from 'react'
import type { Evidence, SectionReport } from '../api'
import { percent } from '../format'
import { SECTION_TITLES, sectionTitle, TIER_LABELS, VERIFICATION_LABELS } from '../labels'
import { Markdown } from './Markdown'

function Source({ url }: { url: string }) {
  // internal:// URLs point at uploaded documents and cannot be opened from here.
  if (!/^https?:\/\//.test(url)) return <code className="break">{url}</code>
  return (
    <a href={url} target="_blank" rel="noreferrer noopener" className="break">
      {url}
    </a>
  )
}

function EvidenceItem({ item }: { item: Evidence }) {
  return (
    <li className="evidence">
      <p>
        <span className={`badge badge-check-${item.verification}`}>{VERIFICATION_LABELS[item.verification]}</span>{' '}
        {item.claim}
      </p>
      <blockquote>{item.excerpt}</blockquote>
      <p className="muted small">
        <Source url={item.source_url} /> · {TIER_LABELS[item.source_tier] ?? item.source_tier}
        {item.published_date && ` · published ${item.published_date}`} · agent confidence {percent(item.confidence)}
      </p>
    </li>
  )
}

function StringList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null
  return (
    <>
      <h4>{title}</h4>
      <ul className="list">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </>
  )
}

export function Sections({ findings }: { findings?: Record<string, SectionReport> }) {
  // Report order first, then any section this UI does not know by name.
  const keys = [
    ...Object.keys(SECTION_TITLES).filter((key) => findings && key in findings),
    ...Object.keys(findings ?? {}).filter((key) => !(key in SECTION_TITLES)),
  ]
  const [selected, setSelected] = useState<string | null>(null)

  if (!findings || keys.length === 0) return <p className="empty">No section has finished yet.</p>

  const active = selected && keys.includes(selected) ? selected : keys[0]
  const report = findings[active]
  const verified = report.evidence.filter((item) => item.verification === 'verified').length

  return (
    <section className="card sections">
      <div className="section-nav" role="tablist" aria-label="Sections" aria-orientation="vertical">
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={key === active}
            className={`section-link${key === active ? ' is-active' : ''}`}
            onClick={() => setSelected(key)}
          >
            {sectionTitle(key)}
          </button>
        ))}
      </div>

      <div className="section-body" role="tabpanel">
        <h3>{sectionTitle(active)}</h3>
        <Markdown>{report.analysis}</Markdown>

        <h4>Evidence</h4>
        {report.evidence.length === 0 ? (
          <p className="muted">This section cites no sources.</p>
        ) : (
          <>
            <p className="muted small">
              {verified} of {report.evidence.length} claims verified. Each quote is checked against the text of its
              source by matching, not by a model; “figure not found” can be a false alarm when a number is written in a
              different format.
            </p>
            <ul className="evidence-list">
              {report.evidence.map((item, index) => (
                <EvidenceItem key={index} item={item} />
              ))}
            </ul>
          </>
        )}

        <StringList title="Assumptions" items={report.assumptions} />
        <StringList title="Research gaps" items={report.research_gaps} />
      </div>
    </section>
  )
}

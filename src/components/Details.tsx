import type { ReactNode } from 'react'
import type { Brief, Run } from '../api'
import { dateTime, number, percent } from '../format'
import { sectionTitle, TIER_LABELS, VERIFICATION_LABELS } from '../labels'

function Row({ label, children }: { label: string; children: ReactNode }) {
  if (children == null || children === '' || (Array.isArray(children) && children.length === 0)) return null
  return (
    <>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </>
  )
}

const joined = (items?: string[]) => (items?.length ? items.join('; ') : null)

function counts(values: Record<string, number> | undefined, labels: Record<string, string>): string | null {
  const entries = Object.entries(values ?? {})
  return entries.length ? entries.map(([key, count]) => `${labels[key] ?? key}: ${count}`).join(' · ') : null
}

function BriefCard({ brief }: { brief: Brief }) {
  const clarifications = Object.entries(brief.clarifications ?? {})
  return (
    <section className="card panel">
      <h3>Brief</h3>
      <p className="pre-wrap">{brief.project}</p>
      <dl className="facts">
        <Row label="Company">{brief.company?.name}</Row>
        <Row label="Industry">{brief.company?.industry}</Row>
        <Row label="Company size">{brief.company?.size}</Row>
        <Row label="Existing capabilities">{joined(brief.company?.capabilities)}</Row>
        <Row label="Target geography">{joined(brief.geography)}</Row>
        <Row label="Target customers">{brief.target_customers}</Row>
        <Row label="Budget">{brief.budget}</Row>
        <Row label="Timeline">{brief.timeline}</Row>
        <Row label="Constraints">{joined(brief.constraints)}</Row>
        <Row label="Strategic goals">{joined(brief.strategic_goals)}</Row>
      </dl>
      {clarifications.length > 0 && (
        <>
          <h4>Clarifications</h4>
          <dl className="facts">
            {clarifications.map(([question, answer]) => (
              <Row key={question} label={question}>
                {answer}
              </Row>
            ))}
          </dl>
        </>
      )}
    </section>
  )
}

export function Details({ run }: { run: Run }) {
  const { usage, quality, results } = run
  const models = Object.entries(usage.models ?? {})
  const flagged = quality.sources_flagged_for_injection ?? []
  const unverified = quality.sections_without_verified_evidence ?? []

  return (
    <>
      {results.brief && <BriefCard brief={results.brief} />}

      <section className="card panel">
        <h3>Evidence quality</h3>
        {quality.evidence_items == null ? (
          <p className="muted">Calculated when the run pauses for review.</p>
        ) : (
          <dl className="facts">
            <Row label="Evidence items">{number(quality.evidence_items)}</Row>
            <Row label="Verified against source">{percent(quality.verified_rate)}</Row>
            <Row label="By check">{counts(quality.by_verification, VERIFICATION_LABELS)}</Row>
            <Row label="By source type">{counts(quality.by_source_tier, TIER_LABELS)}</Row>
            <Row label="Sections with no verified evidence">
              {unverified.length ? unverified.map(sectionTitle).join(', ') : 'None'}
            </Row>
            <Row label="Financial inputs that are estimates">
              {quality.financial_inputs_total
                ? `${quality.financial_inputs_estimated} of ${quality.financial_inputs_total}`
                : null}
            </Row>
            <Row label="Sources flagged for embedded instructions">
              {flagged.length === 0 ? (
                'None'
              ) : (
                <ul className="list">
                  {flagged.map((url) => (
                    <li key={url} className="break">
                      {url}
                    </li>
                  ))}
                </ul>
              )}
            </Row>
          </dl>
        )}
      </section>

      <section className="card panel">
        <h3>About this run</h3>
        <dl className="facts">
          <Row label="Analysis ID">
            <code>{run.id}</code>
          </Row>
          <Row label="Started">
            {dateTime(run.created_at)} by {run.created_by}
          </Row>
          <Row label="Last updated">{dateTime(run.updated_at)}</Row>
          <Row label="Prompt version">
            <code>{run.prompt_version}</code>
          </Row>
          <Row label="Models used">
            {models.length ? models.map(([name, calls]) => `${name} (${calls} calls)`).join(', ') : 'n/a'}
          </Row>
          <Row label="Tokens">
            {number(usage.input_tokens ?? 0)} in · {number(usage.output_tokens ?? 0)} out
          </Row>
          <Row label="Model calls">{number(usage.llm_calls ?? 0)}</Row>
          <Row label="Searches and page fetches">{number(usage.tool_calls ?? 0)}</Row>
        </dl>
        {models.length > 1 && (
          <p className="muted small">More than one model means a fallback provider answered some calls.</p>
        )}
      </section>
    </>
  )
}

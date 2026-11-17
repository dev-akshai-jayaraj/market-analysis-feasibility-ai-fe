import { useState } from 'react'
import { errorMessage, reviewRun, type Run } from '../api'
import { plain } from '../format'
import { DRIVERS, driverLabel, RECOMMENDATION_COPY, SECTION_TITLES } from '../labels'
import { figures } from './Financials'

interface Props {
  run: Run
  onSubmitted: () => void
}

export function ReviewPanel({ run, onSubmitted }: Props) {
  const [sendingBack, setSendingBack] = useState(false)
  const [comments, setComments] = useState<Record<string, string>>({})
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { scorecard, financial } = run.results
  const drivers = financial ? figures(financial.inputs) : []

  const filledComments = Object.fromEntries(
    Object.entries(comments)
      .map(([section, text]) => [section, text.trim()])
      .filter(([, text]) => text),
  )
  const filledOverrides = Object.fromEntries(
    Object.entries(overrides)
      .filter(([, text]) => text.trim() !== '')
      .map(([name, text]) => [name, Number(text)]),
  )
  const invalidNumber = Object.values(filledOverrides).some((value) => !Number.isFinite(value))
  const emptyComment = Object.keys(comments).some((section) => !(section in filledComments))
  const changes = Object.keys(filledComments).length + Object.keys(filledOverrides).length
  const canSendBack = changes > 0 && !invalidNumber && !emptyComment

  async function submit(approved: boolean) {
    if (approved && !window.confirm('Approve this analysis? The recommendation is issued and cannot be reviewed again.')) {
      return
    }
    setBusy(true)
    setError(null)
    try {
      await reviewRun(
        run.id,
        approved
          ? { approved: true }
          : { approved: false, comments: filledComments, financial_overrides: filledOverrides },
      )
      onSubmitted()
    } catch (caught) {
      setError(errorMessage(caught))
      setBusy(false)
    }
  }

  function toggleSection(section: string, checked: boolean) {
    const next = { ...comments }
    if (checked) next[section] = ''
    else delete next[section]
    setComments(next)
  }

  return (
    <section className="card panel review">
      <div className="panel-head">
        <div>
          <h2>Your review is needed</h2>
          <p className="muted">
            {scorecard && (
              <>
                The scorecard points to <strong>{RECOMMENDATION_COPY[scorecard.recommendation].label}</strong>.{' '}
              </>
            )}
            Check the findings below. Approve to issue the recommendation and write the report, or send parts back to
            be redone.
          </p>
        </div>
        {!sendingBack && (
          <div className="button-row">
            <button type="button" className="button" disabled={busy} onClick={() => setSendingBack(true)}>
              Send back…
            </button>
            <button type="button" className="button primary" disabled={busy} onClick={() => submit(true)}>
              {busy ? 'Submitting…' : 'Approve'}
            </button>
          </div>
        )}
      </div>

      {sendingBack && (
        <>
          <h4>Sections to redo</h4>
          <p className="muted small">
            Tick a section and say what to fix. Only those sections are researched again; risk and scoring are then
            redone and the analysis returns here.
          </p>
          <div className="check-grid">
            {Object.entries(SECTION_TITLES).map(([section, title]) => (
              <div key={section} className="check-item">
                <label className="check">
                  <input
                    type="checkbox"
                    checked={section in comments}
                    disabled={busy}
                    onChange={(event) => toggleSection(section, event.target.checked)}
                  />
                  {title}
                </label>
                {section in comments && (
                  <textarea
                    rows={2}
                    value={comments[section]}
                    disabled={busy}
                    aria-label={`What to fix in ${title}`}
                    placeholder="What should be fixed or covered?"
                    onChange={(event) => setComments({ ...comments, [section]: event.target.value })}
                  />
                )}
              </div>
            ))}
          </div>

          {drivers.length > 0 && (
            <>
              <h4>Financial inputs to change</h4>
              <p className="muted small">
                Fill in only the ones you want to change. Shares and rates are fractions: 0.15 means 15%. The model is
                recalculated with your values.
              </p>
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Input</th>
                      <th className="num">Current</th>
                      <th>New value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...drivers.map(([name, figure]) => [name, figure.value] as const), ['horizon_years', financial!.inputs.horizon_years] as const].map(
                      ([name, current]) => (
                        <tr key={name}>
                          <td>
                            <label htmlFor={`override-${name}`}>
                              {name === 'horizon_years' ? 'Horizon in years' : driverLabel(name)}
                            </label>
                          </td>
                          <td className="num">{plain(current)}</td>
                          <td>
                            <input
                              id={`override-${name}`}
                              type="number"
                              step="any"
                              inputMode="decimal"
                              className="input-narrow"
                              value={overrides[name] ?? ''}
                              disabled={busy}
                              placeholder={DRIVERS[name]?.kind === 'rate' ? '0 to 1' : ''}
                              onChange={(event) => setOverrides({ ...overrides, [name]: event.target.value })}
                            />
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="form-footer">
            <span className="muted small">
              {emptyComment
                ? 'Add a comment for each ticked section, or untick it.'
                : changes === 0
                  ? 'Pick at least one section or financial input.'
                  : `${changes} change${changes === 1 ? '' : 's'} to send back.`}
            </span>
            <div className="button-row">
              <button type="button" className="button" disabled={busy} onClick={() => setSendingBack(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="button primary"
                disabled={busy || !canSendBack}
                onClick={() => submit(false)}
              >
                {busy ? 'Submitting…' : 'Send back'}
              </button>
            </div>
          </div>
        </>
      )}

      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}
    </section>
  )
}

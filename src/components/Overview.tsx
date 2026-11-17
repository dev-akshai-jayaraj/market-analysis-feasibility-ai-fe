import type { Run, Scorecard } from '../api'
import { percent } from '../format'
import { humanize, RECOMMENDATION_COPY } from '../labels'
import { Markdown } from './Markdown'

// Thresholds from the backend's src/scoring.py, shown as marks on the score bar.
const NO_GO_AT = 40
const GO_AT = 65

function BulletList({ title, items }: { title: string; items: string[] }) {
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

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="scorebar">
      <div className="scorebar-track" role="img" aria-label={`Weighted score ${score.toFixed(0)} of 100`}>
        <div className="scorebar-fill" style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
        <span className="scorebar-mark" style={{ left: `${NO_GO_AT}%` }} />
        <span className="scorebar-mark" style={{ left: `${GO_AT}%` }} />
      </div>
      <div className="scorebar-scale">
        <span style={{ left: `${NO_GO_AT}%` }}>No go ≤ {NO_GO_AT}</span>
        <span style={{ left: `${GO_AT}%` }}>Go ≥ {GO_AT}</span>
      </div>
    </div>
  )
}

function ScorecardTable({ scorecard }: { scorecard: Scorecard }) {
  return (
    <section className="card panel">
      <div className="panel-head">
        <div>
          <h3>Scorecard</h3>
          <p className="muted">
            An agent scores each dimension from 1 to 5. The weighted score and the recommendation are calculated from
            those scores, not written by an agent.
          </p>
        </div>
        <div className="figure">
          <span className="figure-value">{scorecard.weighted_score.toFixed(0)}</span>
          <span className="figure-label">of 100</span>
        </div>
      </div>

      <ScoreBar score={scorecard.weighted_score} />

      <ul className="list">
        {scorecard.reasons.map((reason, index) => (
          <li key={index}>{reason}</li>
        ))}
      </ul>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Dimension</th>
              <th>Score</th>
              <th className="num">Weight</th>
              <th>Rationale</th>
            </tr>
          </thead>
          <tbody>
            {scorecard.dimensions.map((dimension) => (
              <tr key={dimension.dimension}>
                <td className="nowrap">{humanize(dimension.dimension)}</td>
                <td className="nowrap">
                  <span className="pips" aria-hidden="true">
                    {[1, 2, 3, 4, 5].map((pip) => (
                      <span key={pip} className={pip <= dimension.score ? 'pip is-on' : 'pip'} />
                    ))}
                  </span>{' '}
                  {dimension.score} / 5
                </td>
                <td className="num">{percent(dimension.weight)}</td>
                <td>{dimension.rationale}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function Overview({ run }: { run: Run }) {
  const { decision, scorecard, summary } = run.results

  return (
    <>
      {decision ? (
        <header className={`verdict verdict-${decision.recommendation}`}>
          <span className="verdict-eyebrow">Recommendation</span>
          <h2 className="verdict-label">{RECOMMENDATION_COPY[decision.recommendation].label}</h2>
          <p>{RECOMMENDATION_COPY[decision.recommendation].blurb}</p>
          <p className="muted small">
            Weighted score {decision.weighted_score.toFixed(0)} of 100 ·{' '}
            {decision.reviewed_by ? `reviewed by ${decision.reviewed_by}` : 'not reviewed by a person'}
          </p>
        </header>
      ) : scorecard ? (
        <header className="verdict verdict-draft">
          <span className="verdict-eyebrow">Draft · no recommendation issued</span>
          <p>
            The scorecard currently points to{' '}
            <strong>{RECOMMENDATION_COPY[scorecard.recommendation].label}</strong>. A recommendation is only issued
            once a reviewer approves the analysis.
          </p>
        </header>
      ) : (
        <p className="empty">Nothing to show yet. Results appear here as the agents finish.</p>
      )}

      {summary && (
        <section className="card panel">
          <h3>Executive summary</h3>
          <p className="lead">{summary.headline}</p>
          {summary.summary.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
          <BulletList title="Next steps" items={summary.next_steps} />
        </section>
      )}

      {decision && (
        <section className="card panel">
          <h3>Why this recommendation</h3>
          <Markdown>{decision.rationale}</Markdown>
          <BulletList title="Key evidence" items={decision.key_evidence} />
          <BulletList title="Conflicting evidence" items={decision.conflicts} />
          <BulletList title="Open questions" items={decision.open_questions} />
        </section>
      )}

      {scorecard && <ScorecardTable scorecard={scorecard} />}
    </>
  )
}

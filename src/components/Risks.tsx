import type { Risk } from '../api'
import { humanize } from '../labels'

const LEVELS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const

export function Risks({ risks }: { risks?: Risk[] }) {
  if (!risks) return <p className="empty">The risk agent has not finished yet.</p>
  if (risks.length === 0) return <p className="empty">No risks were recorded.</p>

  return (
    <section className="card panel">
      <h3>Risk matrix</h3>
      <p className="muted">
        Each risk is scored as probability × impact, both from 1 to 5. 15 or more is critical, 10 or more high, 5 or
        more medium.
      </p>
      <p className="level-counts">
        {LEVELS.map((level) => {
          const count = risks.filter((risk) => risk.level === level).length
          return (
            <span key={level}>
              <span className={`badge badge-level-${level}`}>{humanize(level.toLowerCase())}</span> {count}
            </span>
          )
        })}
      </p>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Risk</th>
              <th>Level</th>
              <th className="num nowrap">P × I</th>
              <th>Mitigation</th>
            </tr>
          </thead>
          <tbody>
            {risks.map((risk, index) => (
              <tr key={index}>
                <td>
                  <strong>{risk.title}</strong>
                  <span className="muted small"> · {humanize(risk.category)}</span>
                  <br />
                  {risk.description}
                </td>
                <td>
                  <span className={`badge badge-level-${risk.level}`}>{humanize(risk.level.toLowerCase())}</span>
                </td>
                <td className="num nowrap">
                  {risk.probability} × {risk.impact} = {risk.score}
                </td>
                <td>{risk.mitigation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

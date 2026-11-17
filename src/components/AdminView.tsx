import { useEffect, useState } from 'react'
import { ApiError, errorMessage, getAudit, getUsage, type AuditEntry, type UsageMonth } from '../api'
import { dateTime, number } from '../format'

export function AdminView() {
  const [usage, setUsage] = useState<UsageMonth[] | null>(null)
  const [audit, setAudit] = useState<AuditEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([getUsage(controller.signal), getAudit(controller.signal)])
      .then(([usageRows, auditRows]) => {
        setUsage(usageRows)
        setAudit(auditRows)
      })
      .catch((caught) => {
        if (controller.signal.aborted) return
        setError(
          caught instanceof ApiError && caught.status === 403
            ? 'Usage and the audit log are only available to admin keys.'
            : errorMessage(caught),
        )
      })
    return () => controller.abort()
  }, [])

  if (error) {
    return (
      <div className="card panel">
        <h2>Usage and audit</h2>
        <div className="alert alert-warn" role="alert">
          {error}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="card panel">
        <h2>Usage by month</h2>
        {usage === null ? (
          <p className="muted">Loading…</p>
        ) : usage.length === 0 ? (
          <p className="empty">No analyses yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Month</th>
                  <th className="num">Analyses</th>
                  <th className="num">Completed</th>
                  <th className="num">Tokens</th>
                </tr>
              </thead>
              <tbody>
                {usage.map((row) => (
                  <tr key={`${row.tenant_id}-${row.month}`}>
                    <td>{row.month}</td>
                    <td className="num">{row.analyses}</td>
                    <td className="num">{row.completed}</td>
                    <td className="num">{number(row.tokens)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card panel">
        <h2>Audit log</h2>
        <p className="muted">The latest 200 actions in your organisation.</p>
        {audit === null ? (
          <p className="muted">Loading…</p>
        ) : audit.length === 0 ? (
          <p className="empty">Nothing recorded yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>When</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((entry, index) => (
                  <tr key={index}>
                    <td className="nowrap">{dateTime(entry.at)}</td>
                    <td>{entry.user}</td>
                    <td>
                      <code>{entry.action}</code>
                    </td>
                    <td className="break">{entry.target}</td>
                    <td className="break">{entry.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

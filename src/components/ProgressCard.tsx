import type { Run } from '../api'
import { number } from '../format'
import { currentStages } from '../progress'

const STATE_LABELS = { done: 'Done', active: 'In progress', pending: 'Waiting' }

export function ProgressCard({ run }: { run: Run }) {
  const stages = currentStages(run)
  const tokens = (run.usage.input_tokens ?? 0) + (run.usage.output_tokens ?? 0)

  return (
    <div className="card panel" aria-live="polite">
      <div className="panel-head">
        <div>
          <h2>{run.status === 'running' ? 'Working…' : 'Progress so far'}</h2>
          {run.status === 'running' && (
            <p className="muted">
              This usually takes several minutes. You can leave this page; the analysis keeps running on the server.
            </p>
          )}
        </div>
        <p className="muted small nowrap">
          {number(tokens)} tokens · {number(run.usage.tool_calls ?? 0)} searches
        </p>
      </div>

      {run.status === 'running' && <div className="progress" role="progressbar" aria-label="Analysis in progress" />}

      <div className="stages">
        {stages.map((stage) => {
          const done = stage.steps.filter((step) => step.state === 'done').length
          return (
            <section key={stage.title} className="stage">
              <h3 className="stage-title">
                {stage.title}
                {stage.steps.length > 1 && (
                  <span className="muted">
                    {' '}
                    · {done} of {stage.steps.length} done
                  </span>
                )}
              </h3>
              <ul className={`steps${stage.steps.length > 1 ? ' steps-grid' : ''}`}>
                {stage.steps.map((step) => (
                  <li key={step.key} className={`step step-${step.state}`}>
                    <span className="step-mark" aria-hidden="true" />
                    <span className="step-label">{step.label}</span>
                    <span className="step-state">{STATE_LABELS[step.state]}</span>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}

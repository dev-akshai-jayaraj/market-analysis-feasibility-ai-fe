import type { Run } from './api'
import { RESEARCH_SECTIONS, sectionTitle } from './labels'

export type StepState = 'done' | 'active' | 'pending'

export interface Stage {
  title: string
  steps: { key: string; label: string; state: StepState }[]
}

const RISK = { key: 'risk_agent', label: 'Challenge the findings and score each risk' }
const SCORE = { key: 'opportunity_agent', label: 'Score twelve dimensions' }

/**
 * The stages of the pass the run is in now, read from `progress` (the graph
 * nodes that have finished, in order).
 *
 * A run pauses at the "review" node. That node only finishes once a reviewer
 * answers, so everything after the last "review" entry belongs to the current
 * pass: either the decision (approved) or a rework of the rejected sections.
 */
export function currentStages(run: Run): Stage[] {
  const lastReview = run.progress.lastIndexOf('review')
  const done = new Set(run.progress.slice(lastReview + 1))
  const review = run.results.review

  let plan: { title: string; steps: { key: string; label: string }[] }[]
  if (lastReview === -1) {
    plan = [
      {
        title: 'Research, in parallel',
        steps: Object.entries(RESEARCH_SECTIONS).map(([key, label]) => ({ key, label })),
      },
      { title: 'Risk review', steps: [RISK] },
      { title: 'Scorecard', steps: [SCORE] },
    ]
  } else if (review?.approved) {
    plan = [
      { title: 'Decision', steps: [{ key: 'decision_agent', label: 'Explain the recommendation' }] },
      { title: 'Report', steps: [{ key: 'report_agent', label: 'Write the executive summary' }] },
    ]
  } else {
    const sections = Object.keys(review?.comments ?? {}).filter((key) => key in RESEARCH_SECTIONS)
    const changes = [
      ...sections.map(sectionTitle),
      ...(Object.keys(review?.financial_overrides ?? {}).length ? ['financial inputs'] : []),
    ]
    plan = [
      {
        title: 'Rework',
        steps: [{ key: 'rework', label: changes.length ? `Redo: ${changes.join(', ')}` : 'Apply the review' }],
      },
      { title: 'Risk review', steps: [RISK] },
      { title: 'Scorecard', steps: [SCORE] },
    ]
  }

  // Stages run one after another; steps inside a stage run together.
  let reached = run.status === 'running'
  return plan.map((stage) => {
    const active = reached
    const steps = stage.steps.map((step) => ({
      ...step,
      state: (done.has(step.key) ? 'done' : active ? 'active' : 'pending') as StepState,
    }))
    reached = reached && steps.every((step) => step.state === 'done')
    return { title: stage.title, steps }
  })
}

import { useState, type FormEvent } from 'react'
import {
  errorMessage,
  MIN_PROJECT_LENGTH,
  runIntake,
  startRun,
  type Brief,
  type IntakeResponse,
} from '../api'
import { humanize } from '../labels'

const EXAMPLE = {
  project:
    'An AI-powered attendance module for our payroll product. It automates attendance capture, detects anomalies and gives managers attendance analytics.',
  companyName: 'Acme HR',
  industry: 'HR software',
  geography: 'India',
  targetCustomers: 'Small and medium businesses with 50 to 500 staff',
  budget: 'INR 3.5 crore',
}

const EMPTY = {
  project: '',
  companyName: '',
  industry: '',
  size: '',
  capabilities: '',
  geography: '',
  targetCustomers: '',
  budget: '',
  timeline: '',
  constraints: '',
  strategicGoals: '',
}

type Form = typeof EMPTY

const lines = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

const commaList = (text: string) =>
  text
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)

function toBrief(form: Form, answers: Record<string, string>): Brief {
  const company = {
    name: form.companyName.trim() || null,
    industry: form.industry.trim() || null,
    size: form.size.trim() || null,
    capabilities: lines(form.capabilities),
  }
  const hasCompany = company.name || company.industry || company.size || company.capabilities.length
  return {
    project: form.project.trim(),
    company: hasCompany ? company : null,
    geography: commaList(form.geography),
    target_customers: form.targetCustomers.trim() || null,
    budget: form.budget.trim() || null,
    timeline: form.timeline.trim() || null,
    constraints: lines(form.constraints),
    strategic_goals: lines(form.strategicGoals),
    clarifications: Object.fromEntries(
      Object.entries(answers)
        .map(([question, answer]) => [question, answer.trim()])
        .filter(([, answer]) => answer),
    ),
  }
}

interface Props {
  documentCount: number | null
  onStarted: (id: string, project: string) => void
  onManageDocuments: () => void
}

export function BriefForm({ documentCount, onStarted, onManageDocuments }: Props) {
  const [form, setForm] = useState<Form>(EMPTY)
  const [intake, setIntake] = useState<IntakeResponse | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<'intake' | 'start' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const tooShort = form.project.trim().length < MIN_PROJECT_LENGTH

  const field = (name: keyof Form) => ({
    id: name,
    value: form[name],
    disabled: busy !== null,
    onChange: (event: { target: { value: string } }) => setForm({ ...form, [name]: event.target.value }),
  })

  async function checkBrief() {
    setBusy('intake')
    setError(null)
    try {
      setIntake(await runIntake(toBrief(form, answers)))
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(null)
    }
  }

  async function start(event: FormEvent) {
    event.preventDefault()
    if (tooShort || busy) return
    setBusy('start')
    setError(null)
    try {
      const brief = toBrief(form, answers)
      const { id } = await startRun(brief)
      onStarted(id, brief.project)
    } catch (caught) {
      setError(errorMessage(caught))
      setBusy(null)
    }
  }

  return (
    <form className="card form" onSubmit={start}>
      <div className="form-head">
        <div>
          <h2>New analysis</h2>
          <p className="muted">
            Only the project description is required. Anything you leave out is reported as a research gap, not
            guessed.
          </p>
        </div>
        <button
          type="button"
          className="chip"
          disabled={busy !== null}
          onClick={() => setForm({ ...EMPTY, ...EXAMPLE })}
        >
          Fill an example
        </button>
      </div>

      <label htmlFor="project">Project</label>
      <textarea
        {...field('project')}
        rows={5}
        placeholder="What it is, who it is for and what problem it solves…"
        autoFocus
      />

      <fieldset>
        <legend>Company</legend>
        <div className="grid-2">
          <div>
            <label htmlFor="companyName">Name</label>
            <input type="text" {...field('companyName')} />
          </div>
          <div>
            <label htmlFor="industry">Industry</label>
            <input type="text" {...field('industry')} />
          </div>
          <div>
            <label htmlFor="size">Size</label>
            <input type="text" {...field('size')} placeholder="e.g. 2,000 employees" />
          </div>
          <div>
            <label htmlFor="capabilities">Existing capabilities</label>
            <textarea {...field('capabilities')} rows={2} placeholder="One per line: products, channels, customer base…" />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Project scope</legend>
        <div className="grid-2">
          <div>
            <label htmlFor="geography">Target geography</label>
            <input type="text" {...field('geography')} placeholder="Countries or regions, comma separated" />
          </div>
          <div>
            <label htmlFor="targetCustomers">Target customers</label>
            <input type="text" {...field('targetCustomers')} />
          </div>
          <div>
            <label htmlFor="budget">Budget</label>
            <input type="text" {...field('budget')} placeholder="Amount with currency, e.g. USD 2 million" />
          </div>
          <div>
            <label htmlFor="timeline">Timeline</label>
            <input type="text" {...field('timeline')} placeholder="When it must launch or pay back" />
          </div>
          <div>
            <label htmlFor="constraints">Constraints</label>
            <textarea {...field('constraints')} rows={2} placeholder="One per line" />
          </div>
          <div>
            <label htmlFor="strategicGoals">Strategic goals</label>
            <textarea {...field('strategicGoals')} rows={2} placeholder="One per line" />
          </div>
        </div>
      </fieldset>

      {intake && (
        <section className="intake">
          <h3>Brief check</h3>
          {intake.missing_fields.length > 0 && (
            <p className="muted small">Not filled in: {intake.missing_fields.map(humanize).join(', ')}.</p>
          )}
          {intake.questions.length === 0 ? (
            <p>No clarifying questions. The brief is clear enough to analyse.</p>
          ) : (
            <>
              <p className="muted small">Answering these is optional. Answers are sent with the brief.</p>
              {intake.questions.map(({ question, why_it_matters }, index) => (
                <div key={question} className="question">
                  <label htmlFor={`answer-${index}`}>{question}</label>
                  <p className="muted small">{why_it_matters}</p>
                  <input
                    id={`answer-${index}`}
                    type="text"
                    value={answers[question] ?? ''}
                    disabled={busy !== null}
                    onChange={(event) => setAnswers({ ...answers, [question]: event.target.value })}
                  />
                </div>
              ))}
            </>
          )}
        </section>
      )}

      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}

      <div className="form-footer">
        <span className="muted small">
          {documentCount === null
            ? 'Agents also search the documents you upload.'
            : `${documentCount} internal document${documentCount === 1 ? '' : 's'} available to the agents.`}{' '}
          <button type="button" className="link-button" onClick={onManageDocuments}>
            Manage documents
          </button>
        </span>
        <div className="button-row">
          <button type="button" className="button" disabled={tooShort || busy !== null} onClick={checkBrief}>
            {busy === 'intake' ? 'Checking…' : intake ? 'Check again' : 'Check brief'}
          </button>
          <button type="submit" className="button primary" disabled={tooShort || busy !== null}>
            {busy === 'start' ? 'Starting…' : 'Start analysis'}
          </button>
        </div>
      </div>
    </form>
  )
}

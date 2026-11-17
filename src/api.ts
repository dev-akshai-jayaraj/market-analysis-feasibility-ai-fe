const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || '/api'

/** Mirrors ProjectBrief.project's `min_length=10` in the FastAPI app. */
export const MIN_PROJECT_LENGTH = 10

// ---------- Types (mirror the backend's Pydantic models) ----------

export type RunStatus = 'running' | 'awaiting_review' | 'completed' | 'failed' | 'interrupted'
export type Recommendation = 'GO' | 'NO_GO' | 'VALIDATE_FURTHER'
export type Verification = 'verified' | 'figures_not_found' | 'excerpt_not_found' | 'source_unreachable'

export interface CompanyProfile {
  name?: string | null
  industry?: string | null
  size?: string | null
  capabilities?: string[]
}

export interface Brief {
  project: string
  company?: CompanyProfile | null
  geography?: string[]
  target_customers?: string | null
  budget?: string | null
  timeline?: string | null
  constraints?: string[]
  strategic_goals?: string[]
  clarifications?: Record<string, string>
}

export interface Evidence {
  claim: string
  source_url: string
  excerpt: string
  published_date: string | null
  source_tier: 'internal' | 'primary' | 'secondary' | 'unvetted'
  confidence: number
  verification: Verification
}

export interface SectionReport {
  analysis: string
  evidence: Evidence[]
  assumptions: string[]
  research_gaps: string[]
}

export interface Figure {
  value: number
  basis: 'internal' | 'sourced' | 'estimate' | 'user'
  source_url: string | null
  note: string
}

/** `currency` and `horizon_years`, plus one Figure per model driver. */
export type FinancialInputs = { currency: string; horizon_years: number } & Record<string, Figure | string | number>

export interface Outcome {
  npv: number
  irr: number | null
  payback_years: number | null
  break_even_year: number | null
}

export interface YearProjection {
  year: number
  new_customers: number
  customers: number
  revenue: number
  gross_profit: number
  acquisition_cost: number
  fixed_costs: number
  net_cash: number
  cumulative_cash: number
}

export interface FinancialModel {
  currency: string
  tam: number
  sam: number
  som: number
  bottom_up_sam: number
  sizing_ratio: number | null
  ltv: number
  ltv_to_cac: number | null
  cac_payback_months: number | null
  projection: YearProjection[]
  base: Outcome
  scenarios: Record<string, Outcome>
  sensitivity: { driver: string; npv_low: number; npv_high: number; swing: number }[]
  warnings: string[]
}

export interface Financial {
  inputs: FinancialInputs
  model: FinancialModel | null
  error: string | null
}

export interface Risk {
  title: string
  category: string
  description: string
  probability: number
  impact: number
  mitigation: string
  score: number
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export interface Scorecard {
  dimensions: { dimension: string; score: number; weight: number; rationale: string }[]
  weighted_score: number
  verified_rate: number | null
  recommendation: Recommendation
  reasons: string[]
}

export interface Decision {
  recommendation: Recommendation
  weighted_score: number
  reviewed_by: string | null
  rationale: string
  key_evidence: string[]
  conflicts: string[]
  open_questions: string[]
}

export interface ExecutiveSummary {
  headline: string
  summary: string[]
  next_steps: string[]
}

export interface Review {
  approved: boolean
  reviewer?: string | null
  comments?: Record<string, string>
  financial_overrides?: Record<string, number>
}

/** Whatever the graph has produced so far; every part can be missing mid-run. */
export interface Results {
  brief?: Brief
  findings?: Record<string, SectionReport>
  financial?: Financial
  risks?: Risk[]
  scorecard?: Scorecard
  review?: Review
  decision?: Decision
  summary?: ExecutiveSummary
}

export interface Usage {
  input_tokens?: number
  output_tokens?: number
  llm_calls?: number
  tool_calls?: number
  models?: Record<string, number>
}

export interface Quality {
  sections?: number
  evidence_items?: number
  verified_rate?: number | null
  by_verification?: Record<string, number>
  by_source_tier?: Record<string, number>
  sections_without_verified_evidence?: string[]
  financial_inputs_estimated?: number
  financial_inputs_total?: number
  sources_flagged_for_injection?: string[]
}

export interface RunSummary {
  id: string
  created_by: string
  status: RunStatus
  created_at: string
  updated_at: string
  error: string | null
}

export interface Run extends RunSummary {
  /** Graph nodes that have finished, in order. A node repeats after a rework. */
  progress: string[]
  usage: Usage
  quality: Quality
  prompt_version: string
  results: Results
}

export interface DocumentInfo {
  name: string
  chunks: number
  uploaded_at: string
}

export interface IntakeResponse {
  missing_fields: string[]
  questions: { question: string; why_it_matters: string }[]
}

export interface ReviewRequest {
  approved: boolean
  comments?: Record<string, string>
  financial_overrides?: Record<string, number>
}

export interface UsageMonth {
  tenant_id: string
  month: string
  analyses: number
  completed: number
  tokens: number
}

export interface AuditEntry {
  at: string
  user: string
  action: string
  target: string
  detail: string
}

export const REPORT_FORMATS = ['pdf', 'docx', 'pptx', 'html', 'md'] as const
export type ReportFormat = (typeof REPORT_FORMATS)[number]

// ---------- API key ----------

const KEY_STORAGE = 'mra.apiKey'

// The key is kept in this browser only. Storage can be unavailable (private
// windows); then the key lasts until the tab is reloaded.
let memoryKey = ''

export function getApiKey(): string {
  try {
    return localStorage.getItem(KEY_STORAGE) ?? memoryKey
  } catch {
    return memoryKey
  }
}

export function setApiKey(key: string): void {
  memoryKey = key
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key)
    else localStorage.removeItem(KEY_STORAGE)
  } catch {
    // Kept in memory only.
  }
}

// ---------- Requests ----------

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.'
}

// FastAPI sends `detail` as a string (HTTPException) or a list of
// validation errors (422).
function describeDetail(detail: unknown): string | null {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => (item && typeof item === 'object' && 'msg' in item ? String(item.msg) : null))
      .filter(Boolean)
    if (messages.length) return messages.join('; ')
  }
  return null
}

async function readError(response: Response): Promise<ApiError> {
  let detail: string | null = null
  try {
    detail = describeDetail((await response.json()).detail)
  } catch {
    // Not JSON: the /api rewrite answers with a plain 500 when the API is down.
  }
  if (!detail) {
    detail =
      response.status >= 500
        ? 'The analysis API did not respond. Check that it is running on port 8001.'
        : `Request failed (${response.status} ${response.statusText})`
  }
  return new ApiError(detail, response.status)
}

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  const key = getApiKey()
  if (key) headers.set('Authorization', `Bearer ${key}`)
  if (typeof init.body === 'string') headers.set('Content-Type', 'application/json')

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...init, headers })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError('Could not reach the analysis API. Check that it is running.')
  }
  if (!response.ok) throw await readError(response)
  return response
}

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  return (await request(path, init)).json()
}

const post = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) })

export async function checkHealth(signal?: AbortSignal): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/health`, { signal })
    return response.ok && (await response.json()).status === 'ok'
  } catch {
    return false
  }
}

export const listRuns = (signal?: AbortSignal) => json<RunSummary[]>('/analyses', { signal })
export const getRun = (id: string, signal?: AbortSignal) => json<Run>(`/analyses/${id}`, { signal })
export const startRun = (brief: Brief) => json<{ id: string; status: string }>('/analyses', post(brief))
export const reviewRun = (id: string, review: ReviewRequest) => json(`/analyses/${id}/review`, post(review))
export const resumeRun = (id: string) => json(`/analyses/${id}/resume`, { method: 'POST' })
export const deleteRun = (id: string) => request(`/analyses/${id}`, { method: 'DELETE' })

export const runIntake = (brief: Brief) => json<IntakeResponse>('/intake', post(brief))

export const listDocuments = (signal?: AbortSignal) => json<DocumentInfo[]>('/documents', { signal })
export const deleteDocument = (name: string) =>
  request(`/documents/${encodeURIComponent(name)}`, { method: 'DELETE' })

export function uploadDocument(file: File): Promise<DocumentInfo> {
  const body = new FormData()
  body.append('file', file)
  return json<DocumentInfo>('/documents', { method: 'POST', body })
}

export const getUsage = (signal?: AbortSignal) => json<UsageMonth[]>('/usage', { signal })
export const getAudit = (signal?: AbortSignal) => json<AuditEntry[]>('/audit', { signal })

/** The report needs the Authorization header, so it is fetched and then saved, not linked. */
export async function downloadReport(id: string, format: ReportFormat): Promise<void> {
  const response = await request(`/analyses/${id}/report?format=${format}`)
  const url = URL.createObjectURL(await response.blob())
  const link = document.createElement('a')
  link.href = url
  link.download = `feasibility-report-${id.slice(0, 8)}.${format}`
  link.click()
  URL.revokeObjectURL(url)
}

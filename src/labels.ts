import type { Recommendation, RunStatus, Verification } from './api'

/** Research agents, in the order the report lists them. All run in parallel. */
export const RESEARCH_SECTIONS: Record<string, string> = {
  market_research_agent: 'Market',
  customer_agent: 'Customers',
  competitor_agent: 'Competitors',
  trend_agent: 'Trends',
  financial_agent: 'Financial analysis',
  technical_agent: 'Technical feasibility',
  operational_agent: 'Operational feasibility',
  legal_agent: 'Legal and compliance',
  schedule_agent: 'Schedule and resources',
  strategy_agent: 'Strategic fit',
  gtm_agent: 'Go-to-market',
}

/** Sections with written findings. These are also the ones a reviewer can send back. */
export const SECTION_TITLES: Record<string, string> = { ...RESEARCH_SECTIONS, risk_agent: 'Risk analysis' }

export function humanize(name: string): string {
  const text = name.replace(/_agent$/, '').replace(/[_.]/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export const sectionTitle = (key: string) => SECTION_TITLES[key] ?? humanize(key)

export const STATUS_LABELS: Record<RunStatus, string> = {
  running: 'Running',
  awaiting_review: 'Awaiting review',
  completed: 'Completed',
  failed: 'Failed',
  interrupted: 'Interrupted',
}

export const RECOMMENDATION_COPY: Record<Recommendation, { label: string; blurb: string }> = {
  GO: { label: 'Go', blurb: 'The evidence supports pursuing this opportunity.' },
  NO_GO: { label: 'No go', blurb: 'The evidence points against pursuing this project.' },
  VALIDATE_FURTHER: {
    label: 'Validate further',
    blurb: 'Promising, but something material is still unresolved.',
  },
}

export const VERIFICATION_LABELS: Record<Verification, string> = {
  verified: 'Verified',
  figures_not_found: 'Quote found, figure not found',
  excerpt_not_found: 'Quote not found in source',
  source_unreachable: 'Source could not be read',
}

export const TIER_LABELS: Record<string, string> = {
  internal: 'Internal document',
  primary: 'Primary source',
  secondary: 'Secondary source',
  unvetted: 'Unvetted source',
}

export const BASIS_LABELS: Record<string, string> = {
  internal: 'Company data',
  sourced: 'Sourced',
  estimate: 'Estimate',
  user: 'Reviewer edit',
}

/** Financial model inputs. `rate` ones are fractions (0.15 = 15%). */
export const DRIVERS: Record<string, { label: string; kind: 'money' | 'rate' | 'count' }> = {
  total_market_value: { label: 'Total market value per year (TAM)', kind: 'money' },
  serviceable_share: { label: 'Serviceable share of the market', kind: 'rate' },
  obtainable_share: { label: 'Obtainable share of the serviceable market', kind: 'rate' },
  serviceable_customers: { label: 'Customers that could buy', kind: 'count' },
  price_per_customer_year: { label: 'Revenue per customer per year', kind: 'money' },
  year1_new_customers: { label: 'New customers in year 1', kind: 'count' },
  new_customer_growth: { label: 'Yearly growth in new customers', kind: 'rate' },
  annual_churn: { label: 'Customers lost per year', kind: 'rate' },
  gross_margin: { label: 'Gross margin', kind: 'rate' },
  customer_acquisition_cost: { label: 'Cost to win one customer', kind: 'money' },
  fixed_costs_per_year: { label: 'Fixed costs per year', kind: 'money' },
  initial_investment: { label: 'Initial investment', kind: 'money' },
  discount_rate: { label: 'Discount rate', kind: 'rate' },
}

export const driverLabel = (name: string) => DRIVERS[name]?.label ?? humanize(name)

const NA = 'n/a'

const whole = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 })
const compact = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 })

export const number = (value: number | null | undefined) => (value == null ? NA : whole.format(value))

/** Short form for headline figures, e.g. "1.2M". */
export const short = (value: number | null | undefined) => (value == null ? NA : compact.format(value))

export const percent = (value: number | null | undefined, digits = 0) =>
  value == null ? NA : `${(value * 100).toFixed(digits)}%`

export const ratio = (value: number | null | undefined) => (value == null ? NA : value.toFixed(1))

export const years = (value: number | null | undefined) =>
  value == null ? 'Not within horizon' : `${value.toFixed(1)} years`

export function dateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

/** Raw model input, shown the way a reviewer would type it. */
export const plain = (value: number) => String(Number(value.toPrecision(10)))

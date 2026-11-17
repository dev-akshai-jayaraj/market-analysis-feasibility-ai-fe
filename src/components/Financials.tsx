import type { Figure, Financial, FinancialInputs } from '../api'
import { number, percent, plain, ratio, short, years } from '../format'
import { BASIS_LABELS, DRIVERS, driverLabel } from '../labels'

/** The model drivers: every input that is a Figure (not `currency` or `horizon_years`). */
export function figures(inputs: FinancialInputs): [string, Figure][] {
  return Object.entries(inputs).filter(
    (entry): entry is [string, Figure] => typeof entry[1] === 'object' && entry[1] !== null,
  )
}

function inputValue(name: string, value: number): string {
  return DRIVERS[name]?.kind === 'rate' ? percent(value, 1) : number(value)
}

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="tile">
      <span className="tile-label">{label}</span>
      <span className="tile-value">{value}</span>
      {note && <span className="tile-note">{note}</span>}
    </div>
  )
}

function InputsTable({ inputs }: { inputs: FinancialInputs }) {
  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            <th>Input</th>
            <th className="num">Value</th>
            <th>Basis</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {figures(inputs).map(([name, figure]) => (
            <tr key={name}>
              <td>{driverLabel(name)}</td>
              <td className="num" title={plain(figure.value)}>
                {inputValue(name, figure.value)}
              </td>
              <td className="nowrap">
                <span className={`badge badge-basis-${figure.basis}`}>{BASIS_LABELS[figure.basis] ?? figure.basis}</span>
              </td>
              <td className="break">
                {figure.note}{' '}
                {figure.source_url &&
                  (/^https?:/.test(figure.source_url) ? (
                    <a href={figure.source_url} target="_blank" rel="noreferrer noopener">
                      Source
                    </a>
                  ) : (
                    <code>{figure.source_url}</code>
                  ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Financials({ financial }: { financial?: Financial }) {
  if (!financial) return <p className="empty">The financial agent has not finished yet.</p>

  const { model, inputs } = financial
  if (!model) {
    return (
      <section className="card panel">
        <h3>Financial model</h3>
        <div className="alert" role="alert">
          The financial model could not be calculated: {financial.error}
        </div>
        <h4>Inputs</h4>
        <InputsTable inputs={inputs} />
      </section>
    )
  }

  const scenarios = { base: model.base, ...model.scenarios }

  return (
    <>
      <section className="card panel">
        <h3>Financial model</h3>
        <p className="muted">
          All figures are in {model.currency}, over {inputs.horizon_years} years. An agent proposes the inputs; every
          figure here is calculated from them.
        </p>

        <div className="tiles">
          <Tile label="Net present value" value={short(model.base.npv)} note="Base case" />
          <Tile label="Internal rate of return" value={percent(model.base.irr, 1)} note="Base case" />
          <Tile label="Payback" value={years(model.base.payback_years)} note="Base case" />
          <Tile label="Lifetime value ÷ acquisition cost" value={ratio(model.ltv_to_cac)} />
          <Tile
            label="Acquisition cost payback"
            value={model.cac_payback_months == null ? 'n/a' : `${model.cac_payback_months.toFixed(0)} months`}
          />
          <Tile label="Customer lifetime value" value={short(model.ltv)} />
        </div>

        {model.warnings.length > 0 && (
          <div className="alert alert-warn">
            <ul className="list">
              {model.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        <h4>Market size</h4>
        <div className="tiles">
          <Tile label="Total market (TAM)" value={short(model.tam)} />
          <Tile label="Serviceable market (SAM)" value={short(model.sam)} note="Top-down" />
          <Tile label="Serviceable market" value={short(model.bottom_up_sam)} note="Bottom-up: customers × price" />
          <Tile label="Obtainable market (SOM)" value={short(model.som)} />
        </div>

        <h4>Scenarios</h4>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Scenario</th>
                <th className="num">NPV</th>
                <th className="num">IRR</th>
                <th className="num">Payback</th>
                <th className="num">Break-even year</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(scenarios).map(([name, outcome]) => (
                <tr key={name}>
                  <td className="capitalize">{name}</td>
                  <td className="num">{number(outcome.npv)}</td>
                  <td className="num">{percent(outcome.irr, 1)}</td>
                  <td className="num">{years(outcome.payback_years)}</td>
                  <td className="num">{outcome.break_even_year ?? 'None'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h4>Projection</h4>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Year</th>
                <th className="num">Customers</th>
                <th className="num">Revenue</th>
                <th className="num">Gross profit</th>
                <th className="num">Acquisition cost</th>
                <th className="num">Fixed costs</th>
                <th className="num">Net cash</th>
                <th className="num">Cumulative cash</th>
              </tr>
            </thead>
            <tbody>
              {model.projection.map((row) => (
                <tr key={row.year}>
                  <td>{row.year}</td>
                  <td className="num">{number(row.customers)}</td>
                  <td className="num">{number(row.revenue)}</td>
                  <td className="num">{number(row.gross_profit)}</td>
                  <td className="num">{number(row.acquisition_cost)}</td>
                  <td className="num">{number(row.fixed_costs)}</td>
                  <td className="num">{number(row.net_cash)}</td>
                  <td className="num">{number(row.cumulative_cash)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h4>Sensitivity</h4>
        <p className="muted small">NPV when one input is 20% lower or higher, largest effect first.</p>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Input</th>
                <th className="num">NPV at −20%</th>
                <th className="num">NPV at +20%</th>
                <th className="num">Swing</th>
              </tr>
            </thead>
            <tbody>
              {model.sensitivity.map((row) => (
                <tr key={row.driver}>
                  <td>{driverLabel(row.driver)}</td>
                  <td className="num">{number(row.npv_low)}</td>
                  <td className="num">{number(row.npv_high)}</td>
                  <td className="num">{number(row.swing)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card panel">
        <h3>Inputs to the model</h3>
        <InputsTable inputs={inputs} />
      </section>
    </>
  )
}

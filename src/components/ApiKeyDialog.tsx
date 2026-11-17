import { useState, type FormEvent } from 'react'
import { getApiKey } from '../api'

interface Props {
  /** Set when the API has just rejected the current key (or the lack of one). */
  rejected: boolean
  onSave: (key: string) => void
  onClose: () => void
}

export function ApiKeyDialog({ rejected, onSave, onClose }: Props) {
  const [key, setKey] = useState(getApiKey)

  function submit(event: FormEvent) {
    event.preventDefault()
    onSave(key.trim())
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="key-title">
      <form className="card dialog" onSubmit={submit}>
        <h2 id="key-title">API key</h2>
        {rejected && (
          <div className="alert alert-warn" role="alert">
            The API rejected this request: the key is missing, wrong or revoked.
          </div>
        )}
        <p className="muted">
          Every request to the analysis API needs a key. An administrator creates one with:
        </p>
        <pre className="command">
          uv run python -m src.service.admin create-key --user you --tenant acme --role analyst
        </pre>
        <label htmlFor="api-key">Key</label>
        <input
          id="api-key"
          type="password"
          value={key}
          onChange={(event) => setKey(event.target.value)}
          placeholder="mra_…"
          autoComplete="off"
          spellCheck={false}
          autoFocus
        />
        <p className="muted small">
          Stored in this browser only and sent with each request. Leave it empty if the API runs with{' '}
          <code>AUTH_DISABLED=1</code>.
        </p>
        <div className="button-row end">
          <button type="button" className="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="button primary">
            Save
          </button>
        </div>
      </form>
    </div>
  )
}

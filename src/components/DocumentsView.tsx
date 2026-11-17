import { useEffect, useRef, useState } from 'react'
import { deleteDocument, errorMessage, listDocuments, uploadDocument, type DocumentInfo } from '../api'
import { dateTime } from '../format'

const ACCEPT = '.pdf,.xlsx,.docx,.csv,.txt,.md'
const MAX_BYTES = 20 * 1024 * 1024

export function DocumentsView({ onChanged }: { onChanged: () => void }) {
  const [documents, setDocuments] = useState<DocumentInfo[] | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)

  async function refresh() {
    try {
      setDocuments(await listDocuments())
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function upload(files: FileList | null) {
    if (!files?.length) return
    setError(null)
    const failures: string[] = []
    for (const file of Array.from(files)) {
      if (file.size > MAX_BYTES) {
        failures.push(`${file.name}: larger than 20 MB`)
        continue
      }
      setUploading(file.name)
      try {
        await uploadDocument(file)
      } catch (caught) {
        failures.push(`${file.name}: ${errorMessage(caught)}`)
      }
    }
    setUploading(null)
    if (input.current) input.current.value = ''
    if (failures.length) setError(failures.join(' · '))
    await refresh()
    onChanged()
  }

  async function remove(name: string) {
    if (!window.confirm(`Delete "${name}"? Agents will no longer be able to search it.`)) return
    setError(null)
    try {
      await deleteDocument(name)
    } catch (caught) {
      setError(errorMessage(caught))
    }
    await refresh()
    onChanged()
  }

  return (
    <div className="card panel">
      <div className="panel-head">
        <div>
          <h2>Internal documents</h2>
          <p className="muted">
            Agents search these alongside the web and cite them as internal sources. PDF, Excel, Word, CSV, text or
            Markdown, up to 20 MB each. Scanned PDFs without a text layer cannot be read.
          </p>
        </div>
        <div>
          <input
            ref={input}
            type="file"
            accept={ACCEPT}
            multiple
            hidden
            onChange={(event) => upload(event.target.files)}
          />
          <button
            type="button"
            className="button primary"
            disabled={uploading !== null}
            onClick={() => input.current?.click()}
          >
            {uploading ? 'Uploading…' : 'Upload documents'}
          </button>
        </div>
      </div>

      {uploading && <p className="muted small">Uploading {uploading}…</p>}
      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}

      {documents === null ? (
        !error && <p className="muted">Loading…</p>
      ) : documents.length === 0 ? (
        <p className="empty">No documents uploaded yet.</p>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th className="num">Passages</th>
                <th>Uploaded</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.name}>
                  <td>{document.name}</td>
                  <td className="num">{document.chunks}</td>
                  <td>{dateTime(document.uploaded_at)}</td>
                  <td className="num">
                    <button type="button" className="link-button" onClick={() => remove(document.name)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

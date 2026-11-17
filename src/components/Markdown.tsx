import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/** Renders an agent's Markdown answer. Raw HTML in the text is not rendered. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noreferrer noopener" />,
          // Agents like wide tables; let them scroll instead of breaking the layout.
          table: ({ node: _node, ...props }) => (
            <div className="table-wrap">
              <table {...props} />
            </div>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}

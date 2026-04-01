import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownMessageProps {
  content: string
  className?: string
}

/**
 * Beautiful markdown renderer for AI chat messages.
 * Renders headings, tables, lists, bold, code blocks, etc.
 * with proper styling for the dark theme.
 */
export default function MarkdownMessage({ content, className = '' }: MarkdownMessageProps) {
  return (
    <div className={`markdown-prose ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className="text-lg font-bold text-text-primary mt-4 mb-2 pb-1.5 border-b border-border-default">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold text-text-primary mt-4 mb-2 pb-1 border-b border-border-subtle">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-bold text-accent-cyan mt-3 mb-1.5">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold text-text-primary mt-2 mb-1">{children}</h4>
          ),

          // Paragraphs
          p: ({ children }) => (
            <p className="text-text-secondary text-sm leading-relaxed mb-2 last:mb-0">{children}</p>
          ),

          // Bold / italic
          strong: ({ children }) => (
            <strong className="text-text-primary font-semibold">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="text-text-secondary italic">{children}</em>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 mb-2 ml-1 text-sm text-text-secondary">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 mb-2 ml-1 text-sm text-text-secondary">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),

          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto mb-3 rounded-lg border border-border-default">
              <table className="w-full text-xs">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-bg-card">{children}</thead>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr className="border-b border-border-subtle last:border-0">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="text-left px-3 py-2 text-accent-cyan font-semibold text-[11px] uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-text-secondary">{children}</td>
          ),

          // Code
          code: ({ className, children, ...props }) => {
            const isBlock = className?.includes('language-')
            if (isBlock) {
              return (
                <div className="rounded-lg overflow-hidden mb-2 border border-border-default">
                  <div className="bg-bg-card px-3 py-1 text-[10px] text-text-muted font-mono">
                    {className?.replace('language-', '') || 'code'}
                  </div>
                  <pre className="bg-[rgba(0,0,0,0.3)] px-4 py-3 overflow-x-auto">
                    <code className="text-xs text-green-300 font-mono" {...props}>
                      {children}
                    </code>
                  </pre>
                </div>
              )
            }
            return (
              <code className="text-accent-cyan bg-bg-card px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                {children}
              </code>
            )
          },
          pre: ({ children }) => <>{children}</>,

          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-accent-cyan/40 pl-3 my-2 text-text-muted italic text-sm">
              {children}
            </blockquote>
          ),

          // Horizontal rule
          hr: () => <hr className="border-border-default my-3" />,

          // Links
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent-cyan hover:underline">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

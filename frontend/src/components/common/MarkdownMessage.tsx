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
            <h1 className="text-lg font-bold text-white mt-4 mb-2 pb-1.5 border-b border-[rgba(255,255,255,0.08)]">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold text-white mt-4 mb-2 pb-1 border-b border-[rgba(255,255,255,0.06)]">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-bold text-accent-cyan mt-3 mb-1.5">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold text-white/90 mt-2 mb-1">{children}</h4>
          ),

          // Paragraphs
          p: ({ children }) => (
            <p className="text-white/85 text-sm leading-relaxed mb-2 last:mb-0">{children}</p>
          ),

          // Bold / italic
          strong: ({ children }) => (
            <strong className="text-white font-semibold">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="text-white/70 italic">{children}</em>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 mb-2 ml-1 text-sm text-white/85">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 mb-2 ml-1 text-sm text-white/85">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),

          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto mb-3 rounded-lg border border-[rgba(255,255,255,0.08)]">
              <table className="w-full text-xs">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[rgba(255,255,255,0.06)]">{children}</thead>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr className="border-b border-[rgba(255,255,255,0.06)] last:border-0">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="text-left px-3 py-2 text-accent-cyan font-semibold text-[11px] uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-white/80">{children}</td>
          ),

          // Code
          code: ({ className, children, ...props }) => {
            const isBlock = className?.includes('language-')
            if (isBlock) {
              return (
                <div className="rounded-lg overflow-hidden mb-2 border border-[rgba(255,255,255,0.08)]">
                  <div className="bg-[rgba(255,255,255,0.04)] px-3 py-1 text-[10px] text-text-muted font-mono">
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
              <code className="text-accent-cyan bg-[rgba(255,255,255,0.06)] px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                {children}
              </code>
            )
          },
          pre: ({ children }) => <>{children}</>,

          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-accent-cyan/40 pl-3 my-2 text-white/60 italic text-sm">
              {children}
            </blockquote>
          ),

          // Horizontal rule
          hr: () => <hr className="border-[rgba(255,255,255,0.08)] my-3" />,

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

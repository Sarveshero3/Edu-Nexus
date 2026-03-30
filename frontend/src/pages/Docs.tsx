import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Copy, ChevronRight, ExternalLink } from 'lucide-react'
import PublicNavbar from '@/components/layout/PublicNavbar'
import PageTransition from '@/components/common/PageTransition'
import GlassCard from '@/components/common/GlassCard'
import { cn } from '@/lib/utils'

const sections = [
  {
    title: 'Getting Started',
    items: ['Introduction', 'Quick Start', 'Installation'],
  },
  {
    title: 'Upload Documents',
    items: ['Supported Formats', 'Drag & Drop', 'URL Import'],
  },
  {
    title: 'Chat Assistant',
    items: ['Asking Questions', 'Context Awareness', 'Citations'],
  },
  {
    title: 'Graph Explorer',
    items: ['Node Navigation', 'Filters', 'Export'],
  },
  {
    title: 'API Reference',
    items: ['Authentication', 'Endpoints', 'Rate Limits'],
  },
  {
    title: 'FAQs',
    items: ['Common Issues', 'Troubleshooting'],
  },
]

export default function Docs() {
  const [activeSection, setActiveSection] = useState('Getting Started')
  const [activeItem, setActiveItem] = useState('Introduction')
  const [openSections, setOpenSections] = useState<string[]>(['Getting Started'])

  const toggleSection = (title: string) => {
    setOpenSections((prev) =>
      prev.includes(title) ? prev.filter((s) => s !== title) : [...prev, title]
    )
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-bg-app">
        <PublicNavbar />

        <div className="flex pt-20">
          {/* Sidebar */}
          <aside className="hidden md:block w-[260px] h-[calc(100vh-80px)] sticky top-20 bg-bg-sidebar p-4 overflow-y-auto border-r border-border-subtle">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input placeholder="Search docs..." className="input-field pl-9 text-sm" />
            </div>

            <nav className="flex flex-col gap-1">
              {sections.map((sec) => (
                <div key={sec.title}>
                  <button
                    onClick={() => toggleSection(sec.title)}
                    className="w-full text-left px-3 py-2 text-sm font-semibold text-text-muted hover:text-text-primary flex items-center gap-2"
                  >
                    <ChevronRight
                      size={14}
                      className={cn('transition-transform', openSections.includes(sec.title) && 'rotate-90')}
                    />
                    {sec.title}
                  </button>
                  {openSections.includes(sec.title) && (
                    <div className="ml-6 flex flex-col gap-0.5">
                      {sec.items.map((item) => (
                        <button
                          key={item}
                          onClick={() => { setActiveSection(sec.title); setActiveItem(item) }}
                          className={cn(
                            'text-left px-3 py-1.5 text-sm rounded-md transition-colors',
                            activeItem === item
                              ? 'text-accent-cyan border-l-2 border-accent-cyan bg-accent-cyan/5'
                              : 'text-text-muted hover:text-text-primary'
                          )}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-1 max-w-3xl mx-auto px-8 py-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">{activeSection}</h1>
            <p className="text-text-muted text-sm mb-8">Learn how to get the most out of Edu Nexus.</p>

            <div className="prose prose-invert max-w-none">
              <h2 className="text-xl font-bold text-text-primary mb-4">{activeItem}</h2>

              <p className="text-text-muted leading-relaxed mb-6">
                Edu Nexus is an academic AI platform powered by a tri-hybrid RAG (Retrieval-Augmented
                Generation) engine. It combines BM25 keyword search, FAISS vector similarity, and
                Neo4j knowledge graph traversal to deliver comprehensive answers from your uploaded
                research documents.
              </p>

              {/* Code block */}
              <div className="relative bg-bg-sidebar rounded-[12px] p-4 mb-6 border border-border-subtle">
                <button className="absolute top-3 right-3 text-text-muted hover:text-text-primary">
                  <Copy size={14} />
                </button>
                <pre className="text-sm font-mono text-accent-cyan overflow-x-auto">
{`pip install edu-nexus
edu-nexus init --project my-research`}
                </pre>
              </div>

              {/* Tip callout */}
              <div className="border-l-4 border-accent-cyan bg-accent-cyan/5 rounded-r-[12px] p-4 mb-6">
                <p className="text-sm text-text-primary">
                  <strong>💡 Tip:</strong> Use the tri-hybrid mode for best results across all document types.
                  The engine automatically weights each retrieval method based on your query type.
                </p>
              </div>

              {/* Warning callout */}
              <div className="border-l-4 border-amber-500 bg-amber-500/5 rounded-r-[12px] p-4 mb-6">
                <p className="text-sm text-text-primary">
                  <strong>⚠️ Warning:</strong> Neo4j requires a running instance for graph features.
                  Make sure to configure the connection string in your environment variables.
                </p>
              </div>

              <p className="text-text-muted leading-relaxed mb-6">
                Once initialized, you can start uploading documents through the web interface or CLI.
                Supported formats include PDF, DOCX, TXT, PPTX, XLSX, and CSV.
              </p>

              <Link
                to="/sign-up"
                className="inline-flex items-center gap-2 text-accent-cyan text-sm font-medium hover:underline"
              >
                Try it → <ExternalLink size={14} />
              </Link>
            </div>
          </main>
        </div>
      </div>
    </PageTransition>
  )
}

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, FileText, Upload, X, CheckCircle, AlertCircle, Loader2, Trash2, FolderPlus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PageTransition from '@/components/common/PageTransition'
import GlassCard from '@/components/common/GlassCard'
import PillButton from '@/components/common/PillButton'
import { getSources, uploadSourcesBatch, deleteSource, type Source } from '@/lib/api'
import { useWorkspace } from '@/stores/workspaceStore'

const typeColors: Record<string, string> = {
  pdf: 'text-red-400',
  docx: 'text-blue-400',
  txt: 'text-gray-400',
  pptx: 'text-orange-400',
  xlsx: 'text-green-400',
  csv: 'text-emerald-400',
  md: 'text-indigo-400',
}

interface UploadJob {
  file: File
  status: 'pending' | 'uploading' | 'done' | 'error'
  message?: string
  chunksCount?: number
}

export default function Sources() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [uploadJobs, setUploadJobs] = useState<UploadJob[]>([])
  const [isUploading, setIsUploading] = useState(false)

  // Workspace integration
  const activeWorkspaceId = useWorkspace((s) => s.activeWorkspaceId)
  const activeWs = useWorkspace((s) => s.getActiveWorkspace())
  const addSourceToWorkspace = useWorkspace((s) => s.addSourceToWorkspace)
  const removeSourceFromWorkspace = useWorkspace((s) => s.removeSourceFromWorkspace)

  // Fetch all sources from backend
  const { data: allSources = [], isLoading, error } = useQuery({
    queryKey: ['sources'],
    queryFn: getSources,
  })

  // Filter to show only workspace sources (or all if no workspace)
  const workspaceSources = activeWorkspaceId && activeWs
    ? allSources.filter((s: Source) => activeWs.sourceNames.includes(s.name))
    : allSources

  // Sources NOT in this workspace (for adding)
  const availableSources = activeWorkspaceId && activeWs
    ? allSources.filter((s: Source) => !activeWs.sourceNames.includes(s.name))
    : []

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] })
    },
  })

  // Batch upload handler
  const startUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return
    setIsUploading(true)

    const jobs: UploadJob[] = files.map((f) => ({ file: f, status: 'pending' as const }))
    setUploadJobs(jobs)

    // Mark all as uploading
    setUploadJobs(jobs.map((j) => ({
      ...j,
      status: 'uploading' as const,
      message: `${j.file.name} is being processed...`,
    })))

    try {
      const result = await uploadSourcesBatch(files)

      // Update each job status from batch result
      setUploadJobs(
        jobs.map((j) => {
          const r = result.results.find((res) => res.filename === j.file.name)
          if (!r) return { ...j, status: 'error' as const, message: 'Not found in results' }
          if (r.status === 'ok') {
            // Auto-add to workspace
            if (activeWorkspaceId) {
              addSourceToWorkspace(activeWorkspaceId, r.filename)
            }
            return { ...j, status: 'done' as const, message: `Done — ${r.chunks_count} chunks`, chunksCount: r.chunks_count }
          }
          return { ...j, status: 'error' as const, message: r.message || 'Failed' }
        })
      )
    } catch (err: any) {
      setUploadJobs(
        jobs.map((j) => ({ ...j, status: 'error' as const, message: err.message || 'Batch upload failed' }))
      )
    }

    setIsUploading(false)
    queryClient.invalidateQueries({ queryKey: ['sources'] })
    queryClient.invalidateQueries({ queryKey: ['suggestions'] })
  }, [queryClient, activeWorkspaceId, addSourceToWorkspace])

  const handleFileSelect = useCallback((fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    startUpload(Array.from(fileList))
  }, [startUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const filtered = workspaceSources.filter((d: Source) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) navigate(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`)
  }

  const closeUploadPanel = () => {
    if (!isUploading) {
      setShowUpload(false)
      setUploadJobs([])
    }
  }

  const [showAddExisting, setShowAddExisting] = useState(false)

  return (
    <PageTransition className="p-6 lg:p-8">
      {/* Top bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Source Documents</h1>
          {activeWs && (
            <p className="text-text-muted text-sm mt-1">
              Workspace: <span className="text-accent-cyan">{activeWs.name}</span> · {workspaceSources.length} documents
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="input-field pl-9 text-sm"
            />
          </form>
          {/* Add existing source to workspace */}
          {activeWorkspaceId && availableSources.length > 0 && (
            <PillButton onClick={() => setShowAddExisting(!showAddExisting)}>
              <FolderPlus size={16} /> Add Existing
            </PillButton>
          )}
          <PillButton onClick={() => setShowUpload(true)}>
            <Plus size={16} /> Upload
          </PillButton>
        </div>
      </div>

      {/* Add existing sources dropdown */}
      {showAddExisting && (
        <GlassCard hover={false} className="p-4 mb-6">
          <h3 className="text-white text-sm font-semibold mb-3">Add existing documents to workspace</h3>
          <div className="flex flex-wrap gap-2">
            {availableSources.map((s: Source) => (
              <button
                key={s.id}
                onClick={() => {
                  if (activeWorkspaceId) addSourceToWorkspace(activeWorkspaceId, s.name)
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.04)] hover:bg-accent-cyan/10 border border-[rgba(255,255,255,0.08)] hover:border-accent-cyan/30 text-sm text-white transition-all"
              >
                <FileText className={typeColors[s.type] || 'text-gray-400'} size={14} />
                {s.name}
              </button>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Network error */}
      {error && (
        <GlassCard hover={false} className="p-4 mb-6 border border-red-500/30">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-400" size={20} />
            <p className="text-red-400 text-sm">Cannot connect to Edu Nexus backend. Is the server running?</p>
          </div>
        </GlassCard>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="text-accent-cyan animate-spin" size={32} />
        </div>
      )}

      {/* Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc: Source, i: number) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassCard
                className="p-5 cursor-pointer group relative"
                onClick={() => navigate(`/dashboard/viewer/${encodeURIComponent(doc.name)}`)}
              >
                <div className="flex items-start gap-3">
                  <FileText className={typeColors[doc.type] || 'text-gray-400'} size={24} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{doc.name}</p>
                    <p className="text-text-muted text-xs mt-1">Type: {doc.type.toUpperCase()}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {activeWorkspaceId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (activeWorkspaceId) removeSourceFromWorkspace(activeWorkspaceId, doc.name)
                        }}
                        className="text-text-muted hover:text-orange-400 p-1"
                        title="Remove from workspace"
                      >
                        <X size={14} />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(doc.name) }}
                      className="text-text-muted hover:text-red-400 p-1"
                      title="Delete source"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="badge-cyan text-xs">{doc.chunks} chunks</span>
                </div>
              </GlassCard>
            </motion.div>
          ))}

          {/* Upload card */}
          <GlassCard
            className="p-5 border-2 border-dashed border-[rgba(255,255,255,0.15)] flex flex-col items-center justify-center min-h-[120px] cursor-pointer"
            onClick={() => setShowUpload(true)}
          >
            <Plus className="text-text-muted mb-2" size={24} />
            <p className="text-text-muted text-sm">Upload more documents</p>
          </GlassCard>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && workspaceSources.length === 0 && (
        <div className="text-center py-16">
          <Upload className="text-text-muted mx-auto mb-4" size={40} />
          <p className="text-text-muted text-lg">
            {activeWs
              ? `No documents in "${activeWs.name}" yet. Upload or add existing sources.`
              : 'No documents yet. Upload your first source to get started.'}
          </p>
        </div>
      )}

      {/* Upload panel overlay */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex justify-end"
            onClick={closeUploadPanel}
          >
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full max-w-md bg-bg-sidebar h-full p-6 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">Upload Sources</h2>
                <button onClick={closeUploadPanel} className="text-text-muted hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="px-4 py-2 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20 mb-4">
                <p className="text-accent-cyan text-xs">
                  📦 Batch mode — All files are processed in parallel for faster ingestion
                </p>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-[rgba(255,255,255,0.2)] rounded-[16px] p-8 flex flex-col items-center cursor-pointer"
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.multiple = true
                  input.accept = '.pdf,.docx,.txt,.md,.pptx,.xlsx,.csv'
                  input.onchange = (e) => handleFileSelect((e.target as HTMLInputElement).files)
                  input.click()
                }}
              >
                <Upload className="text-accent-cyan mb-4" size={40} />
                <p className="text-white font-medium">Drop files here or click to browse</p>
                <p className="text-text-muted text-sm mt-1">Select multiple files at once</p>
                <p className="text-text-muted text-xs mt-1">PDF, DOCX, TXT, PPTX, XLSX, CSV, MD</p>
              </div>

              {/* Upload jobs */}
              {uploadJobs.length > 0 && (
                <div className="mt-6 flex flex-col gap-2">
                  {uploadJobs.map((job, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-[12px] bg-[rgba(255,255,255,0.04)]">
                      {job.status === 'pending' && <div className="w-4 h-4 rounded-full bg-text-muted/30 shrink-0" />}
                      {job.status === 'uploading' && <Loader2 className="text-accent-cyan animate-spin shrink-0" size={16} />}
                      {job.status === 'done' && <CheckCircle className="text-green-400 shrink-0" size={16} />}
                      {job.status === 'error' && <AlertCircle className="text-red-400 shrink-0" size={16} />}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${job.status === 'error' ? 'text-red-400' : 'text-white'}`}>{job.file.name}</p>
                        {job.message && <p className="text-text-muted text-xs mt-0.5">{job.message}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}

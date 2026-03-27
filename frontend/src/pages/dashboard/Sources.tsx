import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, FileText, Upload, X, CheckCircle, AlertCircle, Loader2, Trash2, FolderPlus, Info, Shield, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PageTransition from '@/components/common/PageTransition'
import GlassCard from '@/components/common/GlassCard'
import PillButton from '@/components/common/PillButton'
import { getSources, uploadSourcesBatch, deleteSource, getJobStatus, type Source } from '@/lib/api'
import { useWorkspace, MAX_WORKSPACES } from '@/stores/workspaceStore'

const typeColors: Record<string, string> = {
  pdf: 'text-red-400',
  docx: 'text-blue-400',
  txt: 'text-gray-400',
  pptx: 'text-orange-400',
  xlsx: 'text-green-400',
  csv: 'text-emerald-400',
  md: 'text-indigo-400',
}

// ── Limits (mirrors backend config.py) ──────────────────────────────
const MAX_DOCS_PER_WORKSPACE = 20
const MAX_FILE_SIZE_MB = 50
const RATE_LIMIT_UPLOADS = 5 // per minute
const RATE_LIMIT_WINDOW_MS = 60_000

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
  const [uploadStartTime, setUploadStartTime] = useState<number | null>(null)
  const [uploadElapsed, setUploadElapsed] = useState(0)

  // Rate limit state
  const [uploadCount, setUploadCount] = useState(0)
  const [rateLimitEnd, setRateLimitEnd] = useState<number | null>(null)
  const [rateLimitProgress, setRateLimitProgress] = useState(0)

  // Workspace integration
  const workspaces = useWorkspace((s) => s.workspaces)
  const activeWorkspaceId = useWorkspace((s) => s.activeWorkspaceId)
  const activeWs = useWorkspace((s) => s.getActiveWorkspace())
  const addSourceToWorkspace = useWorkspace((s) => s.addSourceToWorkspace)
  const removeSourceFromWorkspace = useWorkspace((s) => s.removeSourceFromWorkspace)
  const syncSourceNames = useWorkspace((s) => s.syncSourceNames)
  const createWorkspace = useWorkspace((s) => s.createWorkspace)
  const setActiveWorkspace = useWorkspace((s) => s.setActiveWorkspace)

  // Quick-create workspace
  const [showCreateWs, setShowCreateWs] = useState(false)
  const [newWsName, setNewWsName] = useState('')

  const noWorkspace = !activeWorkspaceId

  // Upload stopwatch — resilient to sleep/backgrounding
  useEffect(() => {
    if (!isUploading || !uploadStartTime) { setUploadElapsed(0); return }
    const update = () => setUploadElapsed(Math.floor((Date.now() - uploadStartTime) / 1000))
    const interval = setInterval(update, 1000)
    const onVisible = () => { if (document.visibilityState === 'visible') update() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVisible) }
  }, [isUploading, uploadStartTime])

  // Rate limit timer
  useEffect(() => {
    if (!rateLimitEnd) return
    const interval = setInterval(() => {
      const now = Date.now()
      if (now >= rateLimitEnd) {
        setRateLimitEnd(null)
        setRateLimitProgress(0)
        setUploadCount(0)
        clearInterval(interval)
      } else {
        const total = RATE_LIMIT_WINDOW_MS
        const elapsed = total - (rateLimitEnd - now)
        setRateLimitProgress(Math.min(100, (elapsed / total) * 100))
      }
    }, 200)
    return () => clearInterval(interval)
  }, [rateLimitEnd])

  // Fetch all sources from backend
  const { data: allSources = [], isLoading, error } = useQuery<Source[]>({
    queryKey: ['sources', activeWorkspaceId],
    queryFn: () => getSources(activeWorkspaceId || 'default'),
  })

  // Sync workspace sourceNames with backend on every fetch
  useEffect(() => {
    if (allSources.length >= 0 && !isLoading) {
      const backendNames = allSources.map((s: Source) => s.name)
      syncSourceNames(backendNames)
    }
  }, [allSources, isLoading, syncSourceNames])

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
    mutationFn: (name: string) => deleteSource(name, activeWorkspaceId || 'default'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources', activeWorkspaceId] })
    },
  })

  // Batch upload handler
  const startUpload = useCallback(async (files: File[]) => {
    if (files.length === 0 || noWorkspace) return

    // Check rate limit
    if (rateLimitEnd && Date.now() < rateLimitEnd) return

    // Check workspace doc limit
    const currentCount = workspaceSources.length
    if (currentCount + files.length > MAX_DOCS_PER_WORKSPACE) {
      setUploadJobs(files.map((f) => ({
        file: f,
        status: 'error' as const,
        message: `Workspace limit reached (${MAX_DOCS_PER_WORKSPACE} docs max, currently ${currentCount})`
      })))
      return
    }

    // Check individual file sizes
    for (const f of files) {
      if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setUploadJobs(files.map((file) => ({
          file,
          status: file === f ? 'error' as const : 'pending' as const,
          message: file === f ? `File exceeds ${MAX_FILE_SIZE_MB}MB limit` : undefined
        })))
        return
      }
    }

    setIsUploading(true)
    setUploadStartTime(Date.now())
    const jobs: UploadJob[] = files.map((f) => ({ file: f, status: 'pending' as const }))
    setUploadJobs(jobs)

    // Mark all as uploading
    setUploadJobs(jobs.map((j) => ({
      ...j,
      status: 'uploading' as const,
      message: `${j.file.name} is being processed...`,
    })))

    try {
      const wsId = activeWorkspaceId || 'default'
      const result = await uploadSourcesBatch(files, wsId)

      // Track upload count for rate limiting
      const newCount = uploadCount + 1
      setUploadCount(newCount)
      if (newCount >= RATE_LIMIT_UPLOADS) {
        setRateLimitEnd(Date.now() + RATE_LIMIT_WINDOW_MS)
      }

      // If we got a job_id, poll for completion to get real chunk counts
      if (result.job_id) {
        const jobId = result.job_id
        // Add all files to workspace immediately
        for (const r of result.results) {
          if (activeWorkspaceId) {
            addSourceToWorkspace(activeWorkspaceId, r.filename)
          }
        }
        setUploadJobs(jobs.map((j) => ({
          ...j,
          status: 'uploading' as const,
          message: 'Processing...',
        })))

        // Poll job status every 2 seconds
        const pollInterval = setInterval(async () => {
          try {
            const jobStatus = await getJobStatus(jobId)
            const fileStatuses = jobStatus.files || {}

            setUploadJobs(jobs.map((j) => {
              const fStatus = fileStatuses[j.file.name]
              if (!fStatus) return { ...j, status: 'uploading' as const, message: 'Waiting...' }
              if (fStatus.status === 'done') {
                return {
                  ...j,
                  status: 'done' as const,
                  message: fStatus.warning
                    ? `Done — ${fStatus.chunks} chunks (${fStatus.warning})`
                    : `Done — ${fStatus.chunks} chunks`,
                  chunksCount: fStatus.chunks,
                }
              }
              if (fStatus.status === 'error') {
                return { ...j, status: 'error' as const, message: fStatus.error || 'Failed' }
              }
              return { ...j, status: 'uploading' as const, message: `${fStatus.stage || 'Processing'}...` }
            }))

            if (jobStatus.status === 'done' || jobStatus.status === 'error') {
              clearInterval(pollInterval)
              setIsUploading(false)
              queryClient.invalidateQueries({ queryKey: ['sources', activeWorkspaceId] })
              queryClient.invalidateQueries({ queryKey: ['suggestions'] })
              queryClient.invalidateQueries({ queryKey: ['engineStatus'] })
              queryClient.invalidateQueries({ queryKey: ['graph-nodes'] })
              queryClient.invalidateQueries({ queryKey: ['graph-edges'] })
            }
          } catch {
            clearInterval(pollInterval)
            setIsUploading(false)
            queryClient.invalidateQueries({ queryKey: ['sources', activeWorkspaceId] })
          }
        }, 2000)

        // Safety timeout after 5 minutes
        setTimeout(() => {
          clearInterval(pollInterval)
          setIsUploading(false)
          queryClient.invalidateQueries({ queryKey: ['sources', activeWorkspaceId] })
          queryClient.invalidateQueries({ queryKey: ['graph-nodes'] })
          queryClient.invalidateQueries({ queryKey: ['graph-edges'] })
        }, 300_000)

        return // Polling handles isUploading
      }

      // Non-job response (sync upload)
      setUploadJobs(
        jobs.map((j) => {
          const r = result.results.find((res) => res.filename === j.file.name)
          if (!r) return { ...j, status: 'error' as const, message: 'Not found in results' }
          if (r.status === 'ok') {
            if (activeWorkspaceId) {
              addSourceToWorkspace(activeWorkspaceId, r.filename)
            }
            return { ...j, status: 'done' as const, message: `Done — ${r.chunks_count} chunks`, chunksCount: r.chunks_count }
          }
          return { ...j, status: 'error' as const, message: r.message || 'Failed' }
        })
      )
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setRateLimitEnd(Date.now() + RATE_LIMIT_WINDOW_MS)
        setUploadJobs(
          jobs.map((j) => ({ ...j, status: 'error' as const, message: 'Rate limited — please wait before uploading again' }))
        )
      } else {
        setUploadJobs(
          jobs.map((j) => ({ ...j, status: 'error' as const, message: err.message || 'Batch upload failed' }))
        )
      }
    }

    setIsUploading(false)
    queryClient.invalidateQueries({ queryKey: ['sources', activeWorkspaceId] })
    queryClient.invalidateQueries({ queryKey: ['suggestions'] })
  }, [queryClient, activeWorkspaceId, addSourceToWorkspace, noWorkspace, rateLimitEnd, uploadCount, workspaceSources.length])

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

  const handleQuickCreateWorkspace = () => {
    if (workspaces.length >= MAX_WORKSPACES) return
    const name = newWsName.trim() || `Workspace ${workspaces.length + 1}`
    const id = createWorkspace(name)
    setActiveWorkspace(id)
    setNewWsName('')
    setShowCreateWs(false)
  }

  const workspaceLimitReached = workspaces.length >= MAX_WORKSPACES

  const [showAddExisting, setShowAddExisting] = useState(false)

  const isRateLimited = rateLimitEnd !== null && Date.now() < rateLimitEnd

  return (
    <PageTransition className="p-6 lg:p-8">
      {/* Persistent upload progress toast — visible when uploading with sidebar closed */}
      <AnimatePresence>
        {isUploading && !showUpload && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-[100] w-80"
          >
            <div
              className="rounded-xl bg-[#1e2030]/95 backdrop-blur-md border border-cyan-500/20 shadow-2xl p-4 cursor-pointer"
              onClick={() => setShowUpload(true)}
            >
              <div className="flex items-center gap-3 mb-2">
                <Loader2 className="text-cyan-400 animate-spin" size={16} />
                <span className="text-white text-sm font-semibold">Processing documents...</span>
                <span className="text-cyan-400 text-xs font-mono ml-auto">
                  {Math.floor(uploadElapsed / 60)}:{String(uploadElapsed % 60).padStart(2, '0')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span>{uploadJobs.filter(j => j.status === 'done').length}/{uploadJobs.length} files done</span>
                <span className="text-cyan-400/50">• Click to view details</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
                  animate={{ width: `${uploadJobs.length > 0 ? (uploadJobs.filter(j => j.status === 'done').length / uploadJobs.length) * 100 : 0}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Rate limit bar — shown at top when active */}
      <AnimatePresence>
        {isRateLimited && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4"
          >
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="text-amber-400" size={16} />
                <span className="text-amber-400 text-sm font-medium">Rate limit active — please wait</span>
              </div>
              <div className="w-full h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-500 to-green-400 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${rateLimitProgress}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
              <p className="text-text-muted text-xs mt-1">Upload limit resets shortly</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No workspace gate */}
      {noWorkspace && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <GlassCard hover={false} className="p-6 border border-accent-cyan/20">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-accent-cyan/10 flex items-center justify-center shrink-0">
                <FolderPlus className="text-accent-cyan" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-lg">Create a workspace first</h3>
                <p className="text-text-muted text-sm mt-1">
                  Workspaces isolate your documents and chat sessions. Create one to start uploading.
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                  <span>🏠 {workspaces.length}/{MAX_WORKSPACES} workspaces</span>
                  <span>📄 Max {MAX_DOCS_PER_WORKSPACE} docs per workspace</span>
                  <span>📦 Max {MAX_FILE_SIZE_MB}MB per file</span>
                </div>
              </div>
              <div>
                {showCreateWs ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={newWsName}
                      onChange={(e) => setNewWsName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleQuickCreateWorkspace()}
                      placeholder="Workspace name..."
                      className="bg-[rgba(255,255,255,0.06)] text-white text-sm rounded-lg px-3 py-2 outline-none border border-[rgba(255,255,255,0.1)] focus:border-accent-cyan/50 w-48"
                    />
                    <PillButton onClick={handleQuickCreateWorkspace}>Create</PillButton>
                    <button onClick={() => setShowCreateWs(false)} className="text-text-muted hover:text-white">
                      <X size={16} />
                    </button>
                  </div>
                ) : workspaceLimitReached ? (
                  <p className="text-amber-400 text-xs font-medium">🏠 {workspaces.length}/{MAX_WORKSPACES} workspaces (limit reached)</p>
                ) : (
                  <PillButton onClick={() => setShowCreateWs(true)}>
                    <Plus size={16} /> New Workspace
                  </PillButton>
                )}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Top bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Source Documents</h1>
          {activeWs && (
            <div>
              <p className="text-text-muted text-sm mt-1">
                Workspace: <span className="text-accent-cyan">{activeWs.name}</span> · {workspaceSources.length}/{MAX_DOCS_PER_WORKSPACE} documents
              </p>
              {/* Document count progress bar */}
              <div className="w-48 h-1 bg-[rgba(255,255,255,0.06)] rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${(workspaceSources.length / MAX_DOCS_PER_WORKSPACE) * 100}%`,
                    background: workspaceSources.length >= MAX_DOCS_PER_WORKSPACE
                      ? '#ef4444'
                      : workspaceSources.length >= MAX_DOCS_PER_WORKSPACE * 0.8
                        ? '#f59e0b'
                        : 'linear-gradient(to right, #22d3ee, #6366f1)'
                  }}
                />
              </div>
            </div>
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
          {/* Upload button — disabled without workspace */}
          {noWorkspace ? (
            <button
              disabled
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-[rgba(255,255,255,0.04)] text-text-muted border border-[rgba(255,255,255,0.06)] cursor-not-allowed opacity-60"
              title="Create a workspace first"
            >
              <Plus size={16} /> Upload
            </button>
          ) : (
            <PillButton onClick={() => setShowUpload(true)} disabled={isRateLimited}>
              <Plus size={16} /> Upload
            </PillButton>
          )}
        </div>
      </div>

      {/* Limits info bar — shown when workspace active */}
      {activeWs && (
        <div className="flex items-center gap-4 mb-4 px-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]">
          <Info size={14} className="text-text-muted shrink-0" />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-text-muted">
            <span>📄 <strong className="text-white">{workspaceSources.length}</strong>/{MAX_DOCS_PER_WORKSPACE} docs</span>
            <span>📦 Max <strong className="text-white">{MAX_FILE_SIZE_MB}MB</strong> per file</span>
            <span>⏱️ <strong className="text-white">{RATE_LIMIT_UPLOADS}</strong> uploads/min</span>
            <span>📎 PDF, DOCX, TXT, PPTX, XLSX, CSV, MD</span>
          </div>
        </div>
      )}

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

          {/* Upload card — only when workspace active */}
          {!noWorkspace && workspaceSources.length < MAX_DOCS_PER_WORKSPACE && (
            <GlassCard
              className="p-5 border-2 border-dashed border-[rgba(255,255,255,0.15)] flex flex-col items-center justify-center min-h-[120px] cursor-pointer"
              onClick={() => !isRateLimited && setShowUpload(true)}
            >
              <Plus className="text-text-muted mb-2" size={24} />
              <p className="text-text-muted text-sm">Upload more documents</p>
            </GlassCard>
          )}

          {/* Workspace full indicator */}
          {!noWorkspace && workspaceSources.length >= MAX_DOCS_PER_WORKSPACE && (
            <GlassCard
              className="p-5 border-2 border-dashed border-red-500/20 flex flex-col items-center justify-center min-h-[120px]"
              hover={false}
            >
              <AlertCircle className="text-red-400 mb-2" size={24} />
              <p className="text-red-400 text-sm">Workspace full ({MAX_DOCS_PER_WORKSPACE}/{MAX_DOCS_PER_WORKSPACE})</p>
            </GlassCard>
          )}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && workspaceSources.length === 0 && (
        <div className="text-center py-16">
          <Upload className="text-text-muted mx-auto mb-4" size={40} />
          <p className="text-text-muted text-lg">
            {activeWs
              ? `No documents in "${activeWs.name}" yet. Upload or add existing sources.`
              : 'Select or create a workspace above to start uploading documents.'}
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
            onClick={() => { if (!isUploading) closeUploadPanel() }}
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

              {/* Workspace context */}
              {activeWs && (
                <div className="px-4 py-2.5 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] mb-4">
                  <p className="text-white text-xs font-medium">
                    <span className="w-2 h-2 rounded-full inline-block mr-2" style={{ backgroundColor: activeWs.color }} />
                    {activeWs.name}
                  </p>
                  <p className="text-text-muted text-[11px] mt-1">
                    {workspaceSources.length}/{MAX_DOCS_PER_WORKSPACE} documents · Max {MAX_FILE_SIZE_MB}MB per file
                  </p>
                </div>
              )}

              {/* Rate limit warning in panel */}
              {isRateLimited && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="text-amber-400" size={14} />
                    <span className="text-amber-400 text-xs font-medium">Rate limited — please wait</span>
                  </div>
                  <div className="w-full h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-amber-500 to-green-400 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: `${rateLimitProgress}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                </div>
              )}

              {/* Upload stopwatch */}
              {isUploading && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 mb-4">
                  <Clock className="text-cyan-400 animate-pulse" size={14} />
                  <span className="text-cyan-400 text-xs font-mono font-bold">
                    {Math.floor(uploadElapsed / 60)}:{String(uploadElapsed % 60).padStart(2, '0')}
                  </span>
                  <span className="text-cyan-400/60 text-xs">elapsed</span>
                </div>
              )}

              {/* Drop zone — disabled if rate limited */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={isRateLimited ? undefined : handleDrop}
                className={`border-2 border-dashed rounded-[16px] p-8 flex flex-col items-center ${isRateLimited ? 'border-[rgba(255,255,255,0.08)] opacity-50 cursor-not-allowed' : 'border-[rgba(255,255,255,0.2)] cursor-pointer'}`}
                onClick={() => {
                  if (isRateLimited) return
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

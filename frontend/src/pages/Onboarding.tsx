import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Sparkles, Check, Loader2, AlertCircle, FileText } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import PageTransition from '@/components/common/PageTransition'
import GlassCard from '@/components/common/GlassCard'
import PillButton from '@/components/common/PillButton'
import { cn } from '@/lib/utils'
import { uploadSource } from '@/lib/api'

const fileTypes = ['PDF', 'DOCX', 'TXT', 'PPTX', 'XLSX', 'CSV', 'MD']

const stepVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -200 : 200, opacity: 0 }),
}

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadedCount, setUploadedCount] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const nextStep = () => { setDirection(1); setStep((s) => Math.min(s + 1, 2)) }

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      setUploadError(null)
      for (let i = 0; i < files.length; i++) {
        setUploadedCount(i)
        await uploadSource(files[i])
      }
      setUploadedCount(files.length)
    },
    onSuccess: () => {
      nextStep()
    },
    onError: (err: Error) => {
      setUploadError(err.message || 'Upload failed')
    },
  })

  const handleFileSelect = useCallback((fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    setSelectedFiles(Array.from(fileList))
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const handleUploadAndContinue = () => {
    if (selectedFiles.length === 0) return
    uploadMutation.mutate(selectedFiles)
  }

  return (
    <PageTransition className="min-h-screen bg-bg-app flex flex-col items-center px-6 py-12">
      {/* Progress — now only 2 steps */}
      <div className="flex items-center gap-4 mb-16">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
                step >= s
                  ? 'bg-accent-cyan text-white'
                  : 'bg-[rgba(255,255,255,0.08)] text-text-muted'
              )}
            >
              {step > s ? <Check size={16} /> : s}
            </div>
            {s < 2 && (
              <div className={cn('w-16 h-0.5', step > s ? 'bg-accent-cyan' : 'bg-[rgba(255,255,255,0.1)]')} />
            )}
          </div>
        ))}
      </div>

      <div className="w-full max-w-2xl">
        <AnimatePresence mode="wait" custom={direction}>
          {step === 1 && (
            <motion.div key="s1" variants={stepVariants} custom={direction} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <h2 className="text-2xl font-bold text-white text-center mb-2">Upload your documents</h2>
              <p className="text-text-muted text-center text-sm mb-8">
                The AI orchestrator will automatically choose the best retrieval strategy for each query.
              </p>

              <GlassCard
                hover={false}
                className="p-12 border-2 border-dashed border-[rgba(255,255,255,0.2)] flex flex-col items-center cursor-pointer"
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.multiple = true
                  input.accept = '.pdf,.docx,.txt,.md,.pptx,.xlsx,.csv'
                  input.onchange = (e) => handleFileSelect((e.target as HTMLInputElement).files)
                  input.click()
                }}
                onDragOver={(e: React.DragEvent) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <Upload className="text-accent-cyan mb-4" size={48} />
                <p className="text-white font-medium mb-2">Drop files here or click to browse</p>
                <p className="text-text-muted text-sm">Select one or multiple files</p>
                <div className="flex flex-wrap gap-2 mt-3 justify-center">
                  {fileTypes.map((ft) => (
                    <span key={ft} className="badge-cyan text-xs">{ft}</span>
                  ))}
                </div>
              </GlassCard>

              {/* Selected files list */}
              {selectedFiles.length > 0 && (
                <div className="mt-4 flex flex-col gap-2">
                  {selectedFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <FileText className="text-accent-cyan" size={14} />
                      <span className="text-white">{f.name}</span>
                      <span className="text-text-muted text-xs">({(f.size / 1024).toFixed(0)} KB)</span>
                      {uploadMutation.isPending && i < uploadedCount && (
                        <Check className="text-green-400 ml-auto" size={14} />
                      )}
                      {uploadMutation.isPending && i === uploadedCount && (
                        <Loader2 className="text-accent-cyan animate-spin ml-auto" size={14} />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {uploadError && (
                <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="text-red-400 shrink-0" size={16} />
                  <p className="text-red-400 text-sm">{uploadError}</p>
                </div>
              )}

              <div className="flex justify-end mt-8">
                <PillButton
                  onClick={handleUploadAndContinue}
                  disabled={selectedFiles.length === 0 || uploadMutation.isPending}
                >
                  {uploadMutation.isPending
                    ? `Processing ${uploadedCount + 1}/${selectedFiles.length}...`
                    : `Upload ${selectedFiles.length > 0 ? `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}` : ''} & Continue →`
                  }
                </PillButton>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" variants={stepVariants} custom={direction} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <div className="flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  <Sparkles className="text-accent-cyan mb-6" size={64} />
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-3">Your workspace is ready.</h2>
                <p className="text-text-muted mb-2">
                  {selectedFiles.length} document{selectedFiles.length !== 1 ? 's' : ''} uploaded and indexed.
                </p>
                <p className="text-text-muted text-sm mb-8">
                  The AI orchestrator will automatically route your queries to the best retrieval engine.
                </p>
                <PillButton onClick={() => navigate('/dashboard/chat')}>Start Chatting →</PillButton>
                <button
                  onClick={() => navigate('/dashboard/sources')}
                  className="text-text-muted text-sm mt-4 hover:text-white transition-colors"
                >
                  Go to Sources instead
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}

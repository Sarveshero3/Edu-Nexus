import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

// Attach session token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('edu-nexus-session-token')
  if (token) {
    config.headers['x-session-token'] = token
  }
  return config
})

// ── Types ─────────────────────────────────────────────────────────

export interface ChainOfThoughtStep {
  step: string
  detail: string
  status: string
}

export interface ChatResponse {
  answer: string
  engine_used: string
  chosen_brains: string[]
  sources: { type: string; preview: string; score?: number; index: number }[]
  confidence: number
  chain_of_thought: ChainOfThoughtStep[]
  router_reasoning: string
}

export interface EngineStatus {
  bm25: { online: boolean; doc_count: number }
  qdrant: { online: boolean; vector_count: number }
  graph: { online: boolean; node_count: number; edge_count: number }
}

export interface Source {
  id: string
  name: string
  type: string
  chunks: number
  date: string
}

export interface ChunkData {
  id: number
  text: string
  source: string
}

export interface SearchHit {
  engine: string
  rank: number
  text: string
  score: number | null
}

export interface SearchResult {
  query: string
  engine: string
  hits: SearchHit[]
  total: number
}

export interface GraphNode {
  id: string
  name: string
  group: string
  frequency: number
  doc_ids: string[]
}

export interface GraphEdge {
  source: string
  target: string
  relation: string
  weight: number
  source_name: string
  target_name: string
}

export interface NodeDetail {
  name: string
  labels: string[]
  connections: { relation: string; connected: string }[]
}

// ── Auth ──────────────────────────────────────────────────────────

export async function authRegister(username: string, password: string) {
  const { data } = await api.post('/auth/register', { username, password })
  return data.data as { token: string; username: string }
}

export async function authLogin(username: string, password: string) {
  const { data } = await api.post('/auth/login', { username, password })
  return data.data as { token: string; username: string }
}

export async function authLogout() {
  const { data } = await api.post('/auth/logout')
  return data.data
}

export async function authStatus() {
  const { data } = await api.get('/auth/status')
  return data.data as { registered: boolean; logged_in: boolean; username?: string }
}

export async function authDeleteAccount() {
  const { data } = await api.post('/auth/delete-account')
  return data.data
}

// ── Status ────────────────────────────────────────────────────────

export async function getStatus(workspaceId: string = 'default'): Promise<EngineStatus> {
  const { data } = await api.get('/status', { params: { workspace_id: workspaceId } })
  return data.data as EngineStatus
}

export async function refreshStatus(workspaceId: string = 'default'): Promise<EngineStatus> {
  const { data } = await api.get('/status/refresh', { params: { workspace_id: workspaceId } })
  return data.data as EngineStatus
}

// ── Sources ───────────────────────────────────────────────────────

export async function getSources(workspaceId: string = 'default'): Promise<Source[]> {
  const { data } = await api.get('/sources', { params: { workspace_id: workspaceId } })
  return data.data as Source[]
}

export async function uploadSourcesBatch(files: File[], workspaceId: string = 'default') {
  const formData = new FormData()
  files.forEach((f) => formData.append('files', f))
  formData.append('workspace_id', workspaceId)
  const { data } = await api.post('/sources/upload-batch', formData)
  return data.data as {
    job_id?: string
    status?: string
    files?: string[]
    results: { filename: string; status: string; chunks_count?: number; message?: string }[]
  }
}

export async function deleteSource(name: string, workspaceId: string = 'default') {
  const { data } = await api.delete(`/sources/${encodeURIComponent(name)}`, {
    params: { workspace_id: workspaceId },
  })
  return data.data
}

export async function getSourceContent(name: string, workspaceId: string = 'default') {
  const { data } = await api.get(`/sources/${encodeURIComponent(name)}/content`, {
    params: { workspace_id: workspaceId },
  })
  return data.data as { name: string; chunks: ChunkData[]; total: number }
}

export function getSourceFileUrl(name: string, workspaceId: string = 'default') {
  return `/api/sources/${encodeURIComponent(name)}/file?workspace_id=${encodeURIComponent(workspaceId)}`
}

// ── Jobs ──────────────────────────────────────────────────────────

export async function getJobStatus(jobId: string) {
  const { data } = await api.get(`/jobs/${jobId}`)
  return data.data as {
    job_id: string
    status: string
    progress: number
    stage: string
    files: Record<string, { status: string; stage: string; chunks: number; warning: string | null; error: string | null }>
    error: string | null
  }
}

// ── Chat ──────────────────────────────────────────────────────────

export async function sendChat(
  query: string,
  workspaceId: string = 'default',
  sourceFilter?: string[],
  singleDoc: boolean = false
): Promise<ChatResponse> {
  const { data } = await api.post('/chat', {
    query,
    workspace_id: workspaceId,
    source_filter: sourceFilter || null,
    single_doc: singleDoc,
  })
  return data.data as ChatResponse
}

// ── Search ────────────────────────────────────────────────────────

export async function search(
  query: string,
  engine?: string,
  sourceFilter?: string[]
): Promise<SearchResult> {
  const { data } = await api.get('/search', {
    params: {
      q: query,
      engine: engine || undefined,
    },
  })
  return data.data as SearchResult
}

// ── Suggestions ───────────────────────────────────────────────────

export async function getSuggestions(workspaceId: string = 'default'): Promise<string[]> {
  const { data } = await api.get('/suggestions', { params: { workspace_id: workspaceId } })
  return data.data as string[]
}

// ── Graph ─────────────────────────────────────────────────────────

export async function getGraphNodes(
  workspaceId: string = 'default',
  minFrequency: number = 1
): Promise<{ nodes: GraphNode[]; total: number }> {
  const { data } = await api.get('/graph/nodes', {
    params: { workspace_id: workspaceId, min_frequency: minFrequency },
  })
  return data.data as { nodes: GraphNode[]; total: number }
}

export async function getGraphEdges(
  workspaceId: string = 'default',
  minFrequency: number = 1,
  minWeight: number = 0
): Promise<{ edges: GraphEdge[]; total: number }> {
  const { data } = await api.get('/graph/edges', {
    params: { workspace_id: workspaceId, min_frequency: minFrequency, min_weight: minWeight },
  })
  return data.data as { edges: GraphEdge[]; total: number }
}

export async function getGraphNodeDetail(
  nodeName: string,
  workspaceId: string = 'default'
): Promise<NodeDetail> {
  const { data } = await api.get(`/graph/node/${encodeURIComponent(nodeName)}`, {
    params: { workspace_id: workspaceId },
  })
  return data.data as NodeDetail
}

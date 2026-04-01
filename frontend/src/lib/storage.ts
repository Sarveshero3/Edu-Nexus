/**
 * IndexedDB Storage Layer — Edu Nexus
 * ====================================
 * Browser-side persistence for deployed (stateless) mode.
 * When the backend is deployed on Railway (no disk), processed
 * chunks and graph data are stored in the user's browser via IndexedDB.
 *
 * Uses the native IndexedDB API — no external dependencies.
 */

const DB_NAME = 'edu-nexus-storage'
const DB_VERSION = 1

// Object store names
const STORES = {
  chunks: 'chunks',        // processed text chunks per workspace
  graphs: 'graphs',        // graph JSON per workspace
  metadata: 'metadata',    // workspace metadata (source list, etc.)
} as const

// ── Types ─────────────────────────────────────────────────────────

export interface StoredChunk {
  id: string              // `${workspaceId}::${source}::${index}`
  workspaceId: string
  source: string
  index: number
  text: string
}

export interface StoredGraph {
  workspaceId: string
  nodes: Array<{ id: string; name: string; group: string; frequency: number }>
  edges: Array<{ source: string; target: string; relation: string; weight: number }>
}

export interface StoredMeta {
  workspaceId: string
  sources: string[]
  lastUpdated: string
}

// ── Database Init ─────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result

      // Chunks store — keyed by composite id, indexed by workspace
      if (!db.objectStoreNames.contains(STORES.chunks)) {
        const chunkStore = db.createObjectStore(STORES.chunks, { keyPath: 'id' })
        chunkStore.createIndex('byWorkspace', 'workspaceId', { unique: false })
        chunkStore.createIndex('bySource', ['workspaceId', 'source'], { unique: false })
      }

      // Graphs store — one entry per workspace
      if (!db.objectStoreNames.contains(STORES.graphs)) {
        db.createObjectStore(STORES.graphs, { keyPath: 'workspaceId' })
      }

      // Metadata store — one entry per workspace
      if (!db.objectStoreNames.contains(STORES.metadata)) {
        db.createObjectStore(STORES.metadata, { keyPath: 'workspaceId' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// ── Generic Helpers ───────────────────────────────────────────────

async function put<T>(storeName: string, value: T): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    tx.objectStore(storeName).put(value)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

async function get<T>(storeName: string, key: string): Promise<T | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const req = tx.objectStore(storeName).get(key)
    req.onsuccess = () => { db.close(); resolve(req.result as T | undefined) }
    req.onerror = () => { db.close(); reject(req.error) }
  })
}

async function getAllByIndex<T>(
  storeName: string,
  indexName: string,
  key: IDBValidKey | IDBKeyRange
): Promise<T[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const idx = tx.objectStore(storeName).index(indexName)
    const req = idx.getAll(key)
    req.onsuccess = () => { db.close(); resolve(req.result as T[]) }
    req.onerror = () => { db.close(); reject(req.error) }
  })
}

// ── Public API ────────────────────────────────────────────────────

/** Save processed chunks returned by the stateless API */
export async function saveChunks(
  workspaceId: string,
  source: string,
  chunks: string[]
): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORES.chunks, 'readwrite')
  const store = tx.objectStore(STORES.chunks)

  for (let i = 0; i < chunks.length; i++) {
    store.put({
      id: `${workspaceId}::${source}::${i}`,
      workspaceId,
      source,
      index: i,
      text: chunks[i],
    } satisfies StoredChunk)
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

/** Get all chunks for a workspace */
export async function getChunks(workspaceId: string): Promise<StoredChunk[]> {
  return getAllByIndex(STORES.chunks, 'byWorkspace', workspaceId)
}

/** Get chunks for a specific source in a workspace */
export async function getChunksBySource(
  workspaceId: string,
  source: string
): Promise<StoredChunk[]> {
  return getAllByIndex(STORES.chunks, 'bySource', [workspaceId, source])
}

/** Save graph data for a workspace */
export async function saveGraph(data: StoredGraph): Promise<void> {
  return put(STORES.graphs, data)
}

/** Get graph data for a workspace */
export async function getGraph(workspaceId: string): Promise<StoredGraph | undefined> {
  return get(STORES.graphs, workspaceId)
}

/** Save workspace metadata */
export async function saveMeta(meta: StoredMeta): Promise<void> {
  return put(STORES.metadata, meta)
}

/** Get workspace metadata */
export async function getMeta(workspaceId: string): Promise<StoredMeta | undefined> {
  return get(STORES.metadata, workspaceId)
}

/** Delete all data for a workspace */
export async function clearWorkspaceData(workspaceId: string): Promise<void> {
  const db = await openDB()
  const tx = db.transaction([STORES.chunks, STORES.graphs, STORES.metadata], 'readwrite')

  // Delete chunks by index
  const chunkIndex = tx.objectStore(STORES.chunks).index('byWorkspace')
  const chunkReq = chunkIndex.openCursor(workspaceId)
  chunkReq.onsuccess = () => {
    const cursor = chunkReq.result
    if (cursor) {
      cursor.delete()
      cursor.continue()
    }
  }

  // Delete graph and metadata
  tx.objectStore(STORES.graphs).delete(workspaceId)
  tx.objectStore(STORES.metadata).delete(workspaceId)

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

/** Check if IndexedDB is available */
export function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined'
  } catch {
    return false
  }
}

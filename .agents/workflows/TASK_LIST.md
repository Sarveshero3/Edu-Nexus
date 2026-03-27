# Edu Nexus — Fix Task List

## FIX 1 — Single-User Auth System
- [x] 1. Create `src/auth/__init__.py`
- [x] 2. Create `src/auth/auth_manager.py` (check_user_exists, register, login, logout, validate_session, delete_account)
- [x] 3. Add `bcrypt` to `requirements.txt`
- [x] 4. Add auth endpoints to `server.py` (register, login, logout, status, delete-account)
- [x] 5. Add session token middleware to `server.py` for protected `/api/*` routes
- [x] 6. Rewrite `stores/authStore.ts` to call real backend
- [x] 7. Add auth API functions to `lib/api.ts`
- [x] 8. Rewrite `pages/SignUp.tsx` — single-user disclaimer flow
- [x] 9. Rewrite `pages/SignIn.tsx` — welcome back hint / no account redirect
- [x] 10. Update `pages/Home.tsx` — auto-redirect if logged in
- [x] 11. Update `components/guards/AuthGuard.tsx` — real session validation
- [x] 43. Add `AUTH_DIR = DATA_DIR / "auth"` to `config.py` and include in startup mkdir loop
- [x] 44. Update `ForgotPassword.tsx` — redirect to `/sign-in` if no account exists
- [x] 45. Reconcile upload endpoint name — confirmed both use same path

## FIX 2 — Batch Upload "0 Chunks" Bug
- [x] 12. Update `server.py` `_make_job` / `_update_job` — per-file status tracking in `ingestion_jobs`
- [x] 13. Update `server.py` `upload_sources` — per-file progress in background task
- [x] 14. Update `run_pipeline.py` — 0-chunk warning (log + return gracefully, don't error)
- [x] 15. Add `getJobStatus()` to `lib/api.ts`
- [ ] 16. Update `Sources.tsx` upload panel — polling-based per-file progress
- [x] 46. Ensure `lib/api.ts` upload function sends `X-Session-Token` header (via interceptor)

## FIX 3 — Graph Explorer Layout & Sidebar Overlap
- [x] 17. Fix `Graph.tsx` toolbar positioning — uses relative/flex, no sidebar overlap
- [ ] 18. Fix `Graph.tsx` canvas — subscribe to sidebar store, trigger resize on collapse

## FIX 4 — Graph Node Quality, Naming & Filtering
- [x] 19. Add `clean_entity_text()` to `extractor.py` — max 5 words, min 2 chars, no URLs
- [x] 20. Add frequency>=2 filter in `extractor.py` `build_graph_data()`
- [x] 21. Add `min_frequency` param to `neo4j_ops.get_all_nodes()` and `get_all_edges()`
- [x] 22. Add query params to `server.py` graph endpoints (min_frequency, min_weight)
- [x] 23. Add filter panel UI to `Graph.tsx` (frequency slider)
- [ ] 24. Add graph loading overlay to `Graph.tsx` (check for running ingestion jobs)
- [ ] 25. Move browser `Notification.requestPermission()` to `Sources.tsx` (on first upload)
- [x] 26. Update `api.ts` graph functions to pass filter params
- [ ] 47. Update `tailwind.config.ts` `darkMode` to respond to `data-theme` attribute

## FIX 5 — Chat Engine Status Badges (BM25/QDRANT/GRAPH Offline)
- [x] 27. Rewrite `GET /api/status` in `server.py` — real engine health checks
- [x] 28. Update `EngineStatus` type in `api.ts` to match new shape
- [x] 29. Update `Chat.tsx` engine badges — use new status fields
- [ ] 30. Update `manager.py` — skip graph retrieval if no graph data
- [x] 49. Pass `workspace_id` query param in `GET /api/status` call from `Chat.tsx`
- [x] 50. Exempt `GET /api/jobs/{job_id}` from session token middleware

## FIX 6 — Profile Delete Account + Settings Accent/Light Mode
- [x] 31. Wire `Settings.tsx` Account tab — call `POST /api/auth/delete-account`, redirect
- [ ] 32. Update `themeStore.ts` — full accent color CSS variable mappings + `applyTheme()`
- [ ] 33. Add `[data-theme="light"]` CSS overrides to `index.css`
- [x] 34. Update `Settings.tsx` — accent color picker + account deletion UI
- [ ] 51. Update `App.tsx` — call `applyTheme()` on startup using values from `themeStore`
- [ ] 52. Persist chosen accent color and mode to `localStorage` in `themeStore.ts`

## FIX 7 — Update Documentation (Remove FAISS/Neo4j)
- [x] 35-38. Verified zero FAISS/Neo4j references in all Python, TS, and MD files
- [x] Home.tsx feature cards updated (Qdrant, NetworkX)
- [x] EngineBadge.tsx updated (qdrant, graph, semantic, keyword)
- [x] Settings.tsx AI Engine description updated

## FIX 8 — Graph Node Detail Panel: Improve Edge Labels
- [x] 39. Updated `neo4j_ops.get_node_detail()` — includes frequency, doc_ids, relation type
- [x] 40. Updated `server.py` node detail endpoint — returns enriched data
- [ ] 41. Update `Graph.tsx` detail panel — show frequency, source badges, weight

## Post-Implementation
- [ ] 42. Update `.agents/workflows/memory.md` with changes
- [x] 53. Run documentation `findstr` checks (verified zero FAISS/Neo4j mentions)
- [ ] 54. Update `.agents/workflows/memory.md` with summary of all 8 fixes

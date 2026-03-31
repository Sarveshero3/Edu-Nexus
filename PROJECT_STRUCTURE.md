# Edu Nexus: Project Structure 📂

Full directory tree of the **Edu Nexus** project.
*(Excludes `node_modules`, `venv`, `.git`, `__pycache__`, `dist`)*

```text
Edu-Nexus/
├── .agents/                        # Agent context & workflows
│   └── workflows/
│       ├── lessons.md              # Coding rules from past mistakes
│       ├── memory.md               # Session memory & progress tracking
│       └── primer.md               # Project architecture primer
├── data/                           # Core Data Storage
│   ├── auth/                       # User credentials & session tokens
│   ├── artifacts/                  # Engine indices (disk-persisted)
│   │   ├── qdrant/                 # Qdrant vector collections
│   │   ├── bm25/                   # BM25 pickle indices per workspace
│   │   └── graphs/                 # NetworkX graph JSON files per workspace
│   ├── processed/                  # Extracted text chunks (.chunks.jsonl)
│   └── raw/                        # User-uploaded original files
├── frontend/                       # Vite + React 18 + TypeScript SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── EngineBadge.tsx      # Color-coded engine label
│   │   │   │   ├── GlassCard.tsx        # Glassmorphism card with hover glow
│   │   │   │   ├── MarkdownMessage.tsx  # Markdown renderer for chat
│   │   │   │   ├── NeuralCanvas.tsx     # Neural network background animation
│   │   │   │   ├── PageTransition.tsx   # Framer Motion page wrapper
│   │   │   │   ├── PillButton.tsx       # Gradient pill CTA button
│   │   │   │   ├── SplineScene.tsx      # Spline 3D WebGL background
│   │   │   │   └── WorkspaceGateModal.tsx # Workspace creation modal
│   │   │   ├── guards/
│   │   │   │   └── AuthGuard.tsx        # Route guard → validates session
│   │   │   ├── layout/
│   │   │   │   ├── AppShell.tsx         # Dashboard shell (sidebar + theme + auto-workspace)
│   │   │   │   ├── PublicLayout.tsx     # Shared Spline background for public pages
│   │   │   │   ├── PublicNavbar.tsx     # Public page top navbar
│   │   │   │   └── Sidebar.tsx          # Dashboard nav + workspace switcher
│   │   │   └── magicui/
│   │   │       ├── AnimatedGradientText.tsx  # Shimmer gradient text
│   │   │       └── BlurFade.tsx              # Bidirectional scroll fade+blur
│   │   ├── lib/
│   │   │   ├── api.ts               # Typed Axios client with session token interceptor
│   │   │   └── utils.ts             # cn() utility
│   │   ├── pages/
│   │   │   ├── dashboard/
│   │   │   │   ├── Chat.tsx          # RAG chat with chain-of-thought + engine badges
│   │   │   │   ├── Graph.tsx         # Knowledge graph explorer (4 layouts)
│   │   │   │   ├── History.tsx       # Query history with engine tabs
│   │   │   │   ├── Search.tsx        # Cross-engine search
│   │   │   │   ├── Sources.tsx       # Document upload/list/delete
│   │   │   │   └── Viewer.tsx        # Document chunk viewer + side chat
│   │   │   ├── Docs.tsx              # Documentation page
│   │   │   ├── ForgotPassword.tsx    # Password reset (glass card)
│   │   │   ├── Home.tsx              # Landing page with scroll animations
│   │   │   ├── NotFound.tsx          # 404 page
│   │   │   ├── Onboarding.tsx        # 3-step animated tutorial
│   │   │   ├── Profile.tsx           # User profile
│   │   │   ├── Settings.tsx          # Engine weights + accent + account settings
│   │   │   ├── SignIn.tsx            # Sign in (glass card, real auth)
│   │   │   └── SignUp.tsx            # Sign up (single-user disclaimer flow)
│   │   ├── stores/
│   │   │   ├── authStore.ts          # Real backend auth (register/login/logout)
│   │   │   ├── sidebarStore.ts       # Sidebar collapse
│   │   │   ├── themeStore.ts         # Theme + accent color
│   │   │   └── workspaceStore.ts     # Workspaces, sources, chats, messages
│   │   ├── App.tsx                   # Root app with routing
│   │   ├── index.css                 # Global styles + design tokens + animations
│   │   ├── main.tsx                  # React entry point
│   │   └── vite-env.d.ts            # Vite type declarations
│   ├── index.html                    # HTML entry (loads Spline viewer)
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── vite.config.ts
├── src/                              # Python Backend Source
│   ├── auth/                         # Single-User Authentication
│   │   ├── __init__.py
│   │   └── auth_manager.py           # bcrypt auth, session tokens, account deletion
│   ├── graph_engine/                 # Knowledge Graph Pipeline
│   │   ├── __init__.py
│   │   ├── builder.py                # Graph construction orchestrator
│   │   ├── extractor.py              # GLiNER-based entity extraction with filters
│   │   └── neo4j_ops.py              # NetworkX graph CRUD (JSON persistence)
│   ├── ingest/                       # Document Ingestion Pipeline
│   │   ├── __init__.py
│   │   ├── cleaner.py                # Regex noise removal + sentence chunking
│   │   ├── extractor.py              # Multi-format text extraction
│   │   ├── ocr.py                    # OCR fallback for scanned PDFs
│   │   └── processor.py              # Raw file → clean text conversion
│   ├── orchestrator/                 # Central Intelligence Router
│   │   ├── __init__.py
│   │   └── manager.py                # Query routing, fusion, answer generation
│   ├── pipeline/                     # End-to-end Ingestion Glue
│   │   ├── build_index.py            # Batch index rebuilder
│   │   └── run_pipeline.py           # Full ingestion: extract → chunk → embed → index → graph
│   ├── retrieval/                    # Keyword Retrieval
│   │   ├── __init__.py
│   │   ├── bm25_index.py             # Okapi BM25 index (per-workspace)
│   │   └── search.py                 # Search utilities
│   ├── splitter/                     # Text Chunking
│   │   └── textSplitter.py           # 500-char chunks with overlap
│   └── vector_engine/                # Vector Semantic Search
│       ├── __init__.py
│       ├── store.py                  # Qdrant embedded vector store
│       └── vector.py                 # Embedding utilities
├── tests/                            # Test data & frameworks
│   └── Sample_data/
│       ├── raw/
│       │   ├── images/
│       │   ├── pdf/
│       │   └── ppt/
│       └── README.md
├── .env.example                      # Template for API keys
├── .gitignore
├── LICENSE
├── MODULE_DETAILS.md                 # Functional module map
├── PROJECT_STRUCTURE.md              # This file
├── README.md                         # Project readme
├── config.py                         # Centralized configuration
├── requirements.txt                  # Python dependencies
├── run.bat                           # Start backend + frontend
├── server.py                         # FastAPI REST API
└── setup.bat                         # One-time environment setup
```

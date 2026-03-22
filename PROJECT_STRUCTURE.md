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
│   ├── artifacts/                  # FAISS index, BM25 pickle (disk-persisted)
│   ├── processed/                  # Extracted text chunks (.chunks.jsonl)
│   └── raw/                        # User-uploaded original files
├── docs/                           # Internal documentation
│   └── data_naming_convention.md
├── frontend/                       # Vite + React 18 + TypeScript SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── EngineBadge.tsx      # Color-coded engine label
│   │   │   │   ├── GlassCard.tsx        # Glassmorphism card with hover glow
│   │   │   │   ├── PageTransition.tsx   # Framer Motion page wrapper
│   │   │   │   ├── PillButton.tsx       # Gradient pill CTA button
│   │   │   │   └── SplineScene.tsx      # Spline 3D WebGL background
│   │   │   ├── guards/
│   │   │   │   └── AuthGuard.tsx        # Route guard → redirect if not authed
│   │   │   ├── layout/
│   │   │   │   ├── AppShell.tsx         # Dashboard shell (sidebar + content)
│   │   │   │   ├── PublicLayout.tsx     # Shared Spline background for public pages
│   │   │   │   ├── PublicNavbar.tsx     # Public page top navbar
│   │   │   │   └── Sidebar.tsx          # Dashboard nav + workspace switcher
│   │   │   └── magicui/
│   │   │       ├── AnimatedGradientText.tsx  # Shimmer gradient text
│   │   │       └── BlurFade.tsx              # Bidirectional scroll fade+blur
│   │   ├── lib/
│   │   │   ├── api.ts               # Typed Axios client (14 endpoints)
│   │   │   └── utils.ts             # cn() utility
│   │   ├── pages/
│   │   │   ├── dashboard/
│   │   │   │   ├── Chat.tsx          # RAG chat with chain-of-thought
│   │   │   │   ├── Graph.tsx         # Neo4j Aura–style graph (4 layouts)
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
│   │   │   ├── Settings.tsx          # Engine weight tuning
│   │   │   ├── SignIn.tsx            # Sign in (glass card)
│   │   │   └── SignUp.tsx            # Sign up (glass card, 2×2 grid)
│   │   ├── stores/
│   │   │   ├── authStore.ts          # Auth state (mock)
│   │   │   ├── sidebarStore.ts       # Sidebar collapse
│   │   │   ├── themeStore.ts         # Theme preferences
│   │   │   └── workspaceStore.ts     # Workspaces, sources, chats, messages
│   │   ├── App.tsx                   # Root app with routing
│   │   ├── index.css                 # Global styles + animations
│   │   ├── main.tsx                  # React entry point
│   │   └── vite-env.d.ts            # Vite type declarations
│   ├── index.html                    # HTML entry (loads Spline viewer)
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── vite.config.ts
├── notebooks/                        # Jupyter notebooks (experimentation)
│   ├── 01_scan_files.ipynb
│   ├── 02_text_to_docx.ipynb
│   ├── 03_ppt_to_docx.ipynb
│   ├── 04_pdf_to_docx.ipynb
│   └── 05_deepseek_ocr.ipynb
├── prompts/                          # LLM system prompts
│   └── .gitkeep
├── src/                              # Python Backend Source
│   ├── graph_engine/                 # Knowledge Graph Pipeline
│   │   ├── __init__.py
│   │   ├── builder.py                # Graph construction orchestrator
│   │   ├── extractor.py              # Entity/relationship extraction via LLM
│   │   └── neo4j_ops.py              # Neo4j CRUD (MERGE, read, delete)
│   ├── ingest/                       # Document Ingestion Pipeline
│   │   ├── __init__.py
│   │   ├── cleaner.py                # Regex noise removal
│   │   ├── extractor.py              # Multi-format text extraction
│   │   ├── ocr.py                    # OCR fallback for scanned PDFs
│   │   └── processor.py              # Raw file → clean text conversion
│   ├── orchestrator/                 # Central Intelligence Router
│   │   ├── __init__.py
│   │   └── manager.py                # Query routing, fusion, answer generation
│   ├── pipeline/                     # End-to-end Ingestion Glue
│   │   ├── build_index.py            # Batch index rebuilder
│   │   └── run_pipeline.py           # Full ingestion: extract → chunk → embed → index
│   ├── retrieval/                    # Keyword Retrieval
│   │   ├── __init__.py
│   │   ├── bm25_index.py             # Okapi BM25 index
│   │   └── search.py                 # Search utilities
│   ├── splitter/                     # Text Chunking
│   │   └── textSplitter.py           # 500-char chunks with overlap
│   └── vector_engine/                # Vector Semantic Search
│       ├── __init__.py
│       ├── store.py                  # FAISS index management
│       └── vector.py                 # Vector utilities
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
├── app.py                            # Legacy Chainlit entry point
├── config.py                         # Centralized configuration
├── logo.png                          # Project logo
├── requirements.txt                  # Python dependencies
├── run.bat                           # Start backend + frontend
├── server.py                         # FastAPI REST API (14 endpoints)
└── setup.bat                         # One-time environment setup
```

# Edu Nexus: Detailed Project Structure 📂

This document provides a deep dive (DFS) into the **exact** file and folder hierarchy of the **Edu Nexus** project. 
*(Note: standard generated directories like `node_modules`, `venv`, `.git`, and `__pycache__` are excluded for clarity).*

```text
Edu-Nexus/
├── data/                       # Core Data Storage & Databases
│   ├── artifacts/              # Contains FAISS metadata, indexes, and serialized BM25 pickles
│   ├── processed/              # Extracted text chunks (.jsonl) and standardized text files
│   └── raw/                    # User-uploaded PDFs, DOCX, and raw input files
├── docs/                       # Internal documentation and system design references
│   └── data_naming_convention.md
├── frontend/                   # UI Assets corresponding to Next/React updates
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── EngineBadge.tsx
│   │   │   │   ├── GlassCard.tsx
│   │   │   │   ├── PageTransition.tsx
│   │   │   │   └── PillButton.tsx
│   │   │   ├── guards/
│   │   │   │   └── AuthGuard.tsx
│   │   │   └── layout/
│   │   │       ├── AppShell.tsx
│   │   │       ├── PublicNavbar.tsx
│   │   │       └── Sidebar.tsx
│   │   ├── lib/
│   │   │   └── utils.ts
│   │   ├── pages/
│   │   │   ├── dashboard/
│   │   │   │   ├── Chat.tsx
│   │   │   │   ├── Graph.tsx
│   │   │   │   ├── History.tsx
│   │   │   │   ├── Search.tsx
│   │   │   │   ├── Sources.tsx
│   │   │   │   └── Viewer.tsx
│   │   │   ├── Docs.tsx
│   │   │   ├── ForgotPassword.tsx
│   │   │   ├── Home.tsx
│   │   │   ├── NotFound.tsx
│   │   │   ├── Onboarding.tsx
│   │   │   ├── Profile.tsx
│   │   │   ├── Settings.tsx
│   │   │   ├── SignIn.tsx
│   │   │   └── SignUp.tsx
│   │   ├── stores/
│   │   │   ├── authStore.ts
│   │   │   ├── sidebarStore.ts
│   │   │   └── themeStore.ts
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── vite.config.ts
├── notebooks/                  # Sandboxed Jupyter Notebooks for experimentation
│   ├── 01_scan_files.ipynb
│   ├── 02_text_to_docx.ipynb
│   ├── 03_ppt_to_docx.ipynb
│   ├── 04_pdf_to_docx.ipynb
│   └── 05_deepseek_ocr.ipynb
├── prompts/                    # LLM System Prompts used across engines
│   └── .gitkeep
├── src/                        # Main Application Source Code
│   ├── graph_engine/           # Knowledge Graph Logic Subsystem
│   │   ├── __init__.py
│   │   ├── builder.py          
│   │   ├── extractor.py        
│   │   ├── generation_log.md   
│   │   └── neo4j_ops.py        
│   ├── ingest/                 # Document Loading & Cleaning Subsystem
│   │   ├── __init__.py
│   │   ├── cleaner.py          
│   │   ├── extractor.py        
│   │   ├── ocr.py              
│   │   └── processor.py        
│   ├── orchestrator/           # Central Hub Logic
│   │   ├── __init__.py
│   │   └── manager.py          
│   ├── pipeline/               # Full workflow glue linking all systems
│   │   ├── build_index.py
│   │   └── run_pipeline.py     
│   ├── retrieval/              # Pure Lexical Keyword Logic
│   │   ├── __init__.py
│   │   ├── bm25_index.py       
│   │   └── search.py           
│   ├── splitter/               # Document Chunking Logic 
│   │   └── textSplitter.py     
│   └── vector_engine/          # Vector Semantic Brain Logic
│       ├── __init__.py
│       ├── store.py            
│       └── vector.py           
├── tests/                      # Testing frameworks covering ingestion & engine functionality
│   └── Sample_data/
│       ├── raw/
│       │   ├── images/
│       │   │   ├── DSA2.png
│       │   │   └── Syllabus for DSA.png
│       │   ├── pdf/
│       │   │   ├── UltimateJavaCheatSheet.pdf
│       │   │   └── Unit-1 DS.pdf
│       │   └── ppt/
│       │       ├── Session18(linkedlist(Intro).pptx
│       │       └── Session19(Singlylinkedlist).pptx
│       └── README.md
├── .env                        # [SECRET] API Keys (Groq, Neo4j, Gemini) 
├── .env.example                # [PUBLIC] Template for API keys
├── .gitignore                  # Files to exclude from Git
├── Features_To_Add.txt
├── HOW_TO_RUN.txt
├── LICENSE
├── MODULE_DETAILS.md           
├── PROJECT_STRUCTURE.md        # This Structure Document
├── README.md                   
├── app.py                      # Core runtime for UI Interface
├── config.py                   # Centralized configuration constants and API keys maps
├── generation_log.md           
├── logo.png
├── requirements.txt            # Python environment packages
├── run.bat
├── server.py
└── setup.bat
```

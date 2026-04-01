@echo off
REM ============================================================
REM  Edu Nexus Ultimate — One-Time Setup
REM  Run this ONCE after cloning the project.
REM ============================================================

echo.
echo ============================================================
echo   Edu Nexus Ultimate — First-Time Setup
echo ============================================================
echo.

REM ------ Step 1: Create virtual environment ------
IF NOT EXIST "venv" (
    echo [1/6] Creating Python virtual environment...
    python -m venv venv
    echo       Done.
) ELSE (
    echo [1/6] Virtual environment already exists, skipping.
)

REM ------ Step 2: Install Python dependencies ------
echo [2/6] Installing Python backend dependencies...
call venv\Scripts\activate.bat
pip install -r requirements.txt
echo       Done.

REM ------ Step 3: Install Vite + React frontend dependencies ------
echo [3/6] Installing Vite frontend dependencies...
cd frontend
call npm install
cd ..
echo       Done.

REM ------ Step 4: Create .env if missing ------
IF NOT EXIST ".env" (
    echo [4/6] Creating .env file from template...
    (
        echo GROQ_API_KEY=your_groq_api_key_here
        echo NVIDIA_API_KEY=your_nvidia_api_key_here
    ) > .env
    echo       .env created. Please fill in your API keys before running.
) ELSE (
    echo [4/6] .env already exists, skipping.
)

IF NOT EXIST "frontend\.env" (
    echo       Creating frontend .env...
    echo VITE_API_URL=http://localhost:8000 > frontend\.env
    echo       Done.
) ELSE (
    echo       frontend .env already exists.
)

REM ------ Step 5: Create data directories ------
echo [5/6] Creating data directories...
IF NOT EXIST "data\raw" mkdir data\raw
IF NOT EXIST "data\processed" mkdir data\processed
IF NOT EXIST "data\artifacts" mkdir data\artifacts
IF NOT EXIST "data\artifacts\qdrant" mkdir data\artifacts\qdrant
IF NOT EXIST "data\artifacts\bm25" mkdir data\artifacts\bm25
IF NOT EXIST "data\artifacts\graphs" mkdir data\artifacts\graphs
echo       Done.

REM ------ Step 6: Pre-download GLiNER model ------
echo [6/6] Pre-downloading GLiNER NER model (~80MB)...
call venv\Scripts\activate.bat
python -c "from gliner import GLiNER; GLiNER.from_pretrained('urchade/gliner_small-v2.1'); print('GLiNER model cached.')"
echo       Done.

echo.
echo ============================================================
echo   Setup complete!
echo.
echo   IMPORTANT: Edit .env and fill in your API keys:
echo     - GROQ_API_KEY   (required)
echo     - NVIDIA_API_KEY  (optional, LLM fallback)
echo.
echo   Then run: run.bat
echo.
echo   ARCHITECTURE (v3 — Local-First):
echo     - Qdrant (local)   : replaces FAISS for vector search
echo     - NetworkX (local) : replaces Neo4j for knowledge graphs
echo     - GLiNER (local)   : replaces Groq for entity extraction
echo     - No Neo4j, no FAISS, no preprocessing API calls
echo ============================================================
echo.
pause

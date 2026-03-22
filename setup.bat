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
    echo [1/5] Creating Python virtual environment...
    python -m venv venv
    echo       Done.
) ELSE (
    echo [1/5] Virtual environment already exists, skipping.
)

REM ------ Step 2: Install Python dependencies ------
echo [2/5] Installing Python backend dependencies...
call venv\Scripts\activate.bat
pip install -r requirements.txt
echo       Done.

REM ------ Step 3: Install Vite + React frontend dependencies ------
echo [3/5] Installing Vite frontend dependencies...
cd frontend
call npm install
cd ..
echo       Done.

REM ------ Step 4: Create .env if missing ------
IF NOT EXIST ".env" (
    echo [4/5] Creating .env file from template...
    (
        echo GROQ_API_KEY=your_groq_api_key_here
        echo NEO4J_URI=bolt://localhost:7687
        echo NEO4J_USER=neo4j
        echo NEO4J_PASSWORD=your_neo4j_password_here
    ) > .env
    echo       .env created. Please fill in your API keys before running.
) ELSE (
    echo [4/5] .env already exists, skipping.
)

IF NOT EXIST "frontend\.env" (
    echo       Creating frontend .env...
    echo VITE_API_URL=http://localhost:8000 > frontend\.env
    echo       Done.
) ELSE (
    echo       frontend .env already exists.
)

REM ------ Step 5: Create data directories ------
echo [5/5] Creating data directories...
IF NOT EXIST "data\raw" mkdir data\raw
IF NOT EXIST "data\processed" mkdir data\processed
IF NOT EXIST "data\artifacts" mkdir data\artifacts
IF NOT EXIST "data\.tmp_uploads" mkdir data\.tmp_uploads
echo       Done.

echo.
echo ============================================================
echo   Setup complete!
echo.
echo   IMPORTANT: Edit .env and fill in your API keys:
echo     - GROQ_API_KEY  (required)
echo     - NEO4J_*       (optional, for graph features)
echo.
echo   Then run: run.bat
echo.
echo   NEW FEATURES:
echo     - Workspaces: organize documents + chats
echo     - Batch upload: process multiple files in parallel
echo     - PDF viewer: view PDFs inline with side chat
echo     - Engine status: live BM25/FAISS/Neo4j indicators
echo     - Suggested questions: AI-generated starter questions
echo ============================================================
echo.
pause

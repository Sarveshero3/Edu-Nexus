@echo off
REM ============================================================
REM  Edu Nexus Ultimate — Launch Servers
REM  Starts the FastAPI backend (port 8000) and Vite frontend (port 5173).
REM  Run setup.bat first if you haven't installed dependencies.
REM ============================================================

echo.
echo ============================================================
echo   Edu Nexus Ultimate — Starting Servers
echo ============================================================
echo.
echo   Backend API:  http://localhost:8000
echo   Frontend UI:  http://localhost:5173
echo   API Docs:     http://localhost:8000/docs
echo.
echo   FEATURES:
echo     - LLM fallback chain (Groq models + NVIDIA API)
echo     - Workspace-scoped chat + single-doc smart citations
echo     - Graph Explorer with auto-zoom + fit-to-view
echo     - Resizable viewer panels (drag handle)
echo     - Workspace color tags in sidebar
echo.
echo   Close the server windows or press Ctrl+C to stop.
echo ============================================================
echo.

REM ------ Check .env exists ------
IF NOT EXIST ".env" (
    echo [WARNING] No .env file found! Run setup.bat first.
    echo           The backend needs GROQ_API_KEY to start.
    pause
    exit /b 1
)

REM ------ Start FastAPI Backend ------
start "Edu Nexus Backend" cmd /k "cd /d %~dp0 && call venv\Scripts\activate.bat && python server.py"

REM ------ Wait a moment for backend to initialize ------
echo   Waiting 4 seconds for backend to initialize...
timeout /t 4 /nobreak > nul

REM ------ Start Vite Frontend ------
start "Edu Nexus Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo   Both servers are starting...
echo   Backend window: "Edu Nexus Backend"
echo   Frontend window: "Edu Nexus Frontend"
echo.
echo   Open http://localhost:5173 in your browser.
echo.

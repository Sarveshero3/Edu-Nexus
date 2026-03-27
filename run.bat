@echo off
REM ============================================================
REM  Edu Nexus Ultimate — Launch Servers
REM  Starts the FastAPI backend and Vite frontend.
REM  Run setup.bat first if you haven't installed dependencies.
REM
REM  Usage:
REM    run.bat          — local dev  (backend:8000, frontend:5173)
REM    run.bat host     — LAN mode   (backend:0.0.0.0:8000,
REM                                    frontend:0.0.0.0:5173)
REM ============================================================

echo.
echo ============================================================
echo   Edu Nexus Ultimate — Starting Servers
echo ============================================================
echo.

REM ------ Detect mode ------
SET MODE=local
IF /I "%~1"=="host" SET MODE=host

IF "%MODE%"=="host" (
    echo   MODE: LAN Hosting (accessible on your network)
    echo.
    REM Show local IP for convenience
    for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4"') do (
        set "IP=%%a"
        set "IP=!IP: =!"
    )
    setlocal enabledelayedexpansion
    for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4"') do (
        echo   Your LAN IP: %%a
    )
    endlocal
    echo.
    echo   Share these URLs with others on your network:
    echo     Backend API:  http://YOUR_IP:8000
    echo     Frontend UI:  http://YOUR_IP:5173
    echo     API Docs:     http://YOUR_IP:8000/docs
) ELSE (
    echo   MODE: Local Development
    echo.
    echo   Backend API:  http://localhost:8000
    echo   Frontend UI:  http://localhost:5173
    echo   API Docs:     http://localhost:8000/docs
)

echo.
echo   ARCHITECTURE (v3 — Local-First):
echo     - Qdrant:    Semantic Brain (vector search)
echo     - NetworkX:  Deep Brain (knowledge graph)
echo     - GLiNER:    Entity extraction (no API calls)
echo     - BM25:      Fast Brain (keyword search)
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
IF "%MODE%"=="host" (
    start "Edu Nexus Backend" cmd /k "cd /d %~dp0 && call venv\Scripts\activate.bat && uvicorn server:app --host 0.0.0.0 --port 8000 --reload"
) ELSE (
    start "Edu Nexus Backend" cmd /k "cd /d %~dp0 && call venv\Scripts\activate.bat && python server.py"
)

REM ------ Wait a moment for backend to initialize ------
echo   Waiting 4 seconds for backend to initialize...
timeout /t 4 /nobreak > nul

REM ------ Start Vite Frontend ------
IF "%MODE%"=="host" (
    start "Edu Nexus Frontend" cmd /k "cd /d %~dp0frontend && npm run dev -- --host 0.0.0.0"
) ELSE (
    start "Edu Nexus Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
)

echo   Both servers are starting...
echo   Backend window: "Edu Nexus Backend"
echo   Frontend window: "Edu Nexus Frontend"
echo.

IF "%MODE%"=="host" (
    echo   Open http://YOUR_IP:5173 in your browser (or share with others).
) ELSE (
    echo   Open http://localhost:5173 in your browser.
)
echo.

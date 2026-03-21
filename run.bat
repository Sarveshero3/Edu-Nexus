@echo off
REM ============================================================
REM  Edu Nexus — Launch Servers
REM  Starts the FastAPI backend and Vite frontend.
REM  Run setup.bat first if you haven't installed dependencies.
REM ============================================================

echo.
echo ============================================================
echo   Edu Nexus — Starting Servers
echo ============================================================
echo.
echo   Backend API:  http://localhost:8000
echo   Frontend UI:  http://localhost:3000
echo.
echo   Close the server windows or press Ctrl+C to stop.
echo ============================================================
echo.

REM ------ Start FastAPI Backend ------
start "Edu Nexus Backend" cmd /k "cd /d %~dp0 && call venv\Scripts\activate.bat && uvicorn server:app --host 0.0.0.0 --port 8000 --reload"

REM ------ Start Vite Frontend ------
start "Edu Nexus Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

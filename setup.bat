@echo off
REM ============================================================
REM  Edu Nexus — One-Time Setup
REM  Run this ONCE after cloning the project.
REM ============================================================

echo.
echo ============================================================
echo   Edu Nexus — First-Time Setup
echo ============================================================
echo.

REM ------ Step 1: Create virtual environment ------
IF NOT EXIST "venv" (
    echo [1/3] Creating Python virtual environment...
    python -m venv venv
    echo       Done.
) ELSE (
    echo [1/3] Virtual environment already exists, skipping.
)

REM ------ Step 2: Install Python dependencies ------
echo [2/3] Installing Python backend dependencies...
call venv\Scripts\activate.bat
pip install -r requirements.txt
echo       Done.

REM ------ Step 3: Install Vite + React frontend dependencies ------
echo [3/3] Installing Vite frontend dependencies...
cd frontend
call npm install
cd ..
echo       Done.

echo.
echo ============================================================
echo   Setup complete! You can now use run.bat to start the app.
echo ============================================================
echo.
pause

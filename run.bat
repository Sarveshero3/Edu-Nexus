@echo off
REM ============================================================
REM  Edu Nexus — Quick Start Guide
REM  Run this from the project root:
REM    c:\Users\Sarvesh\Desktop\MinorProject\Edu-Nexus\
REM ============================================================

echo.
echo ============================================================
echo   Edu Nexus — Setup ^& Launch
echo ============================================================
echo.

REM ------ Step 1: Create virtual environment (skip if exists) ------
IF NOT EXIST "venv" (
    echo [1/4] Creating virtual environment...
    python -m venv venv
    echo       Done.
) ELSE (
    echo [1/4] Virtual environment already exists, skipping creation.
)

REM ------ Step 2: Activate virtual environment ------
echo [2/4] Activating virtual environment...
call venv\Scripts\activate.bat

REM ------ Step 3: Install / update dependencies ------
echo [3/4] Installing dependencies from requirements.txt...
pip install -r requirements.txt

REM ------ Step 4: Copy logo to avatars directory ------
echo [3.5/4] Setting up avatar...
IF NOT EXIST ".chainlit\public\avatars" (
    mkdir ".chainlit\public\avatars"
)
copy /Y "logo.png" ".chainlit\public\avatars\edu nexus.png" >nul 2>&1
echo       Avatar setup complete.

REM ------ Step 5: Launch Chainlit ------
echo [4/4] Starting Edu Nexus...
echo.
echo ============================================================
echo   Open your browser at:  http://localhost:8000
echo   Press Ctrl+C to stop the server.
echo ============================================================
echo.
chainlit run app.py

pause

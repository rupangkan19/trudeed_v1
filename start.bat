@echo off
:: TruDeed — one-command startup (Windows)
setlocal

set "SCRIPT_DIR=%~dp0"
set "BACKEND=%SCRIPT_DIR%backend"
set "VENV=%BACKEND%\venv"

echo.
echo   TruDeed — Real-time Document Forgery Detection
echo   100%% Offline
echo.

:: ── Step 1: Python virtual environment ──────────────────────────────────────
if not exist "%VENV%" (
    echo -- Creating Python virtual environment...
    py -3.12 -m venv "%VENV%"
    if errorlevel 1 (
        echo -- Retrying with default python...
        python -m venv "%VENV%"
        if errorlevel 1 (
            echo ERROR: Python 3 not found. Please install Python 3.10+ from https://python.org
            pause
            exit /b 1
        )
    )
)

echo -- Installing Python dependencies (takes ~60s on first run)...
"%VENV%\Scripts\pip" install --upgrade pip -q
"%VENV%\Scripts\pip" install -r "%BACKEND%\requirements.txt" -q
echo   OK: Python dependencies ready

:: ── Step 2: Generate demo documents (first run only) ────────────────────────
if not exist "%BACKEND%\demo_docs\salary_genuine.pdf" (
    echo -- Generating demo test documents...
    cd /d "%BACKEND%"
    "%VENV%\Scripts\python" demo_generator.py
    echo   OK: Demo documents created in backend\demo_docs\
)

:: ── Step 3: Start the server ─────────────────────────────────────────────────
echo.
echo -- Starting TruDeed server...
echo.
echo   Open in your browser:  http://localhost:8000
echo   Press Ctrl+C to stop
echo.

cd /d "%BACKEND%"
"%VENV%\Scripts\uvicorn" main:app --host 0.0.0.0 --port 8000

pause

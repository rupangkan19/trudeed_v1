@echo off
:: TruDeed — pull latest updates and restart
setlocal

set "SCRIPT_DIR=%~dp0"
set "BACKEND=%SCRIPT_DIR%backend"
set "VENV=%BACKEND%\venv"

echo.
echo -- Pulling latest updates from GitHub...
git -C "%SCRIPT_DIR%" pull

echo -- Installing any new Python dependencies...
"%VENV%\Scripts\pip" install -q -r "%BACKEND%\requirements.txt"

echo.
echo -- Starting updated TruDeed server...
echo.
echo   Open in your browser:  http://localhost:8000
echo   Press Ctrl+C to stop
echo.

cd /d "%BACKEND%"
"%VENV%\Scripts\uvicorn" main:app --host 0.0.0.0 --port 8000

pause

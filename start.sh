#!/bin/bash
# TruDeed — one-command startup (macOS / Linux)
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$SCRIPT_DIR/backend"
VENV="$BACKEND/venv"

echo ""
echo "  ████████╗██████╗ ██╗   ██╗███████╗██████╗ ███████╗███████╗██████╗ "
echo "  ╚══██╔══╝██╔══██╗██║   ██║██╔════╝██╔══██╗██╔════╝██╔════╝██╔══██╗"
echo "     ██║   ██████╔╝██║   ██║█████╗  ██║  ██║█████╗  █████╗  ██║  ██║"
echo "     ██║   ██╔══██╗██║   ██║██╔══╝  ██║  ██║██╔══╝  ██╔══╝  ██║  ██║"
echo "     ██║   ██║  ██║╚██████╔╝███████╗██████╔╝███████╗███████╗██████╔╝"
echo "     ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═════╝ ╚══════╝╚══════╝╚═════╝ "
echo ""
echo "  Real-time Document Forgery Detection  |  100% Offline"
echo ""

# ── Step 1: Python virtual environment ──────────────────────────────────────
if [ ! -d "$VENV" ]; then
  echo "→ Creating Python virtual environment..."
  python3 -m venv "$VENV"
fi

echo "→ Installing Python dependencies (this takes ~60s on first run)..."
"$VENV/bin/pip" install -q --upgrade pip
"$VENV/bin/pip" install -q -r "$BACKEND/requirements.txt"
echo "  ✓ Python dependencies ready"

# ── Step 2: Generate demo documents (first run only) ────────────────────────
if [ ! -f "$BACKEND/demo_docs/salary_genuine.pdf" ]; then
  echo "→ Generating demo test documents..."
  cd "$BACKEND" && "$VENV/bin/python" demo_generator.py
  echo "  ✓ Demo documents created in backend/demo_docs/"
fi

# ── Step 3: Start the server ─────────────────────────────────────────────────
echo ""
echo "→ Starting TruDeed server..."
echo ""
echo "  ┌─────────────────────────────────────────────────────┐"
echo "  │                                                     │"
echo "  │   Open in your browser:  http://localhost:8000      │"
echo "  │                                                     │"
echo "  │   Press Ctrl+C to stop                             │"
echo "  │                                                     │"
echo "  └─────────────────────────────────────────────────────┘"
echo ""

cd "$BACKEND"
"$VENV/bin/uvicorn" main:app --host 0.0.0.0 --port 8000

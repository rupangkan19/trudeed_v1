#!/bin/bash
# TruDeed — pull latest updates and restart
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$SCRIPT_DIR/backend"
VENV="$BACKEND/venv"

echo ""
echo "→ Pulling latest updates from GitHub..."
git -C "$SCRIPT_DIR" pull

echo "→ Installing any new Python dependencies..."
"$VENV/bin/pip" install -q -r "$BACKEND/requirements.txt"

echo ""
echo "→ Starting updated TruDeed server..."
echo ""
echo "  Open in your browser:  http://localhost:8000"
echo "  Press Ctrl+C to stop"
echo ""

cd "$BACKEND"
"$VENV/bin/uvicorn" main:app --host 0.0.0.0 --port 8000

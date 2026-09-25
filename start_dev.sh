#!/bin/bash
# ReconFlow AI: Local Development Launcher
# Automatically detects available ports and launches Backend & Frontend

echo "🛡️ Starting ReconFlow AI Development Environment..."

# Detect port for Backend
PORT=8001
if lsof -i :8001 >/dev/null 2>&1; then
    echo "⚠️ Port 8001 is occupied. Switching Backend to port 8000..."
    PORT=8000
fi

# 1. Start Backend
echo "🚀 Launching FastAPI Backend on http://localhost:$PORT..."
cd backend
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi
PORT=$PORT python3 -m uvicorn app.main:app --reload --port $PORT &
BACKEND_PID=$!
cd ..

# 2. Start Frontend
echo "💻 Launching Next.js Frontend on http://localhost:3000..."
cd frontend
NEXT_PUBLIC_API_URL="http://localhost:$PORT" npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "=========================================================="
echo "✅ ReconFlow AI System is Live!"
echo "   - Frontend UI:   http://localhost:3000"
echo "   - Backend API:   http://localhost:$PORT"
echo "   - Health Status: http://localhost:$PORT/health"
echo "   - API Swagger:   http://localhost:$PORT/docs"
echo "=========================================================="
echo "Press CTRL+C to terminate both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait

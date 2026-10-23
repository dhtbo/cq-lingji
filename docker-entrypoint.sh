#!/bin/sh
echo "=== Starting CQ-Lingji (CadQuery Blockly Studio) ==="

echo "1. Launching FastAPI Backend on 127.0.0.1:8000..."
python3 -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

echo "2. Waiting for FastAPI backend health check..."
for i in $(seq 1 30); do
    if curl -s http://127.0.0.1:8000/api/v1/health >/dev/null 2>&1; then
        echo "FastAPI backend is ready!"
        break
    fi
    sleep 1
done

echo "3. Launching Next.js Frontend on 0.0.0.0:3000..."
cd /app/frontend-dist && exec node server.js

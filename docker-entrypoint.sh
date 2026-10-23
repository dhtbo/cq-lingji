#!/bin/sh
set -e
echo "=== Starting CQ-Lingji (CadQuery & build123d Studio) ==="

echo "1. Launching FastAPI Backend on 127.0.0.1:8000..."
python3 -u -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

echo "2. Waiting for FastAPI backend health check..."
READY=0
for i in $(seq 1 40); do
    if curl -s http://127.0.0.1:8000/api/v1/health >/dev/null 2>&1; then
        echo "FastAPI backend is ready (after $i seconds)!"
        READY=1
        break
    fi

    # Check if backend process crashed
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "ERROR: FastAPI backend process died unexpectedly!"
        echo "--- Backend Startup Logs ---"
        cat /tmp/backend.log
        echo "----------------------------"
        exit 1
    fi

    sleep 1
done

if [ $READY -eq 0 ]; then
    echo "ERROR: FastAPI backend timed out waiting for health check!"
    echo "--- Backend Startup Logs ---"
    cat /tmp/backend.log
    echo "----------------------------"
    exit 1
fi

echo "3. Launching Next.js Frontend on 0.0.0.0:3000..."
cd /app/frontend-dist && exec node server.js

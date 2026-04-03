#!/bin/bash
set -e

pkill -f "python server.py" 2>/dev/null || true
sleep 1

python server.py &
BACKEND_PID=$!

for i in $(seq 1 30); do
  if curl -s http://localhost:8000/ > /dev/null 2>&1; then
    break
  fi
  sleep 1
done

cd frontend && npm run preview -- --host 0.0.0.0 --port 5000

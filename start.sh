#!/bin/bash
python server.py &
cd frontend && npm run preview -- --host 0.0.0.0 --port 5000

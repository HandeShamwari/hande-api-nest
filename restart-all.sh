#!/bin/bash

# HANDEE - Restart All Projects
# This script restarts all HANDEE services

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "🔄 Restarting HANDEE Services..."

# Stop all services
bash "$SCRIPT_DIR/stop-all.sh"

# Wait a moment
sleep 2

# Start all services
bash "$SCRIPT_DIR/start-all.sh"

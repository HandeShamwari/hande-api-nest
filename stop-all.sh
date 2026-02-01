#!/bin/bash

# HANDEE - Stop All Projects
# This script stops all running HANDEE services

echo "🛑 Stopping HANDEE Services..."

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# Function to kill process on port
kill_port() {
    if lsof -ti:$1 >/dev/null 2>&1; then
        echo -e "${RED}⏹️  Stopping service on port $1...${NC}"
        lsof -ti:$1 | xargs kill -9 2>/dev/null
    fi
}

# Kill all services by port
kill_port 8000  # Laravel API
kill_port 19006 # Expo
kill_port 19000 # Expo DevTools
kill_port 19001 # Expo Metro
kill_port 5173  # Landing Page
kill_port 5174  # Admin Panel

# Kill by process name (backup method)
pkill -f "php artisan serve" 2>/dev/null
pkill -f "expo start" 2>/dev/null
pkill -f "vite" 2>/dev/null

echo -e "${GREEN}✅ All HANDEE services stopped${NC}"

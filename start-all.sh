#!/bin/bash

# HANDEE - Start All Projects
# This script starts all HANDEE services simultaneously

echo "🚗 Starting HANDEE Services..."
echo "================================"

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    lsof -ti:$1 >/dev/null 2>&1
}

# Function to kill process on port
kill_port() {
    if check_port $1; then
        echo -e "${YELLOW}⚠️  Port $1 is in use. Killing existing process...${NC}"
        lsof -ti:$1 | xargs kill -9 2>/dev/null
        sleep 1
    fi
}

# Clean up function
cleanup() {
    echo -e "\n${RED}🛑 Stopping all services...${NC}"
    kill $(jobs -p) 2>/dev/null
    exit
}

# Trap Ctrl+C
trap cleanup SIGINT SIGTERM

# Create logs directory first
mkdir -p "$SCRIPT_DIR/logs"

# Check required ports and kill if necessary
echo -e "${BLUE}📡 Checking ports...${NC}"
kill_port 8000  # Laravel API
kill_port 19006 # Expo Metro Bundler
kill_port 5173  # Vite (Landing)
kill_port 5174  # Vite (Administration)

echo ""

# Start Laravel API (Backend)
echo -e "${GREEN}🔧 Starting Laravel API (Port 8000)...${NC}"
cd "$SCRIPT_DIR/hande-api"
if [ ! -f "vendor/autoload.php" ]; then
    echo -e "${YELLOW}⚠️  Installing PHP dependencies...${NC}"
    composer install
fi
php artisan serve --host=0.0.0.0 --port=8000 > "$SCRIPT_DIR/logs/api.log" 2>&1 &
API_PID=$!
echo -e "   ${BLUE}→${NC} API running on http://localhost:8000 (PID: $API_PID)"

sleep 2

# Start React Native App (Expo)
echo -e "${GREEN}📱 Starting Mobile App (Expo)...${NC}"
cd "$SCRIPT_DIR/hande-app"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Installing npm dependencies...${NC}"
    npm install
fi
npx expo start --clear > "$SCRIPT_DIR/logs/app.log" 2>&1 &
APP_PID=$!
echo -e "   ${BLUE}→${NC} Mobile app running on http://localhost:19006 (PID: $APP_PID)"

sleep 2

# Start Landing Page (Vite)
echo -e "${GREEN}🌐 Starting Landing Page (Port 5173)...${NC}"
cd "$SCRIPT_DIR/hande-landing"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Installing npm dependencies...${NC}"
    npm install
fi
npm run dev > "$SCRIPT_DIR/logs/landing.log" 2>&1 &
LANDING_PID=$!
echo -e "   ${BLUE}→${NC} Landing page running on http://localhost:5173 (PID: $LANDING_PID)"

sleep 2

# Start Administration Panel (Vite)
echo -e "${GREEN}⚙️  Starting Administration Panel (Port 5174)...${NC}"
cd "$SCRIPT_DIR/hande-administration"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Installing npm dependencies...${NC}"
    npm install
fi
npm run dev -- --port 5174 > "$SCRIPT_DIR/logs/admin.log" 2>&1 &
ADMIN_PID=$!
echo -e "   ${BLUE}→${NC} Admin panel running on http://localhost:5174 (PID: $ADMIN_PID)"

echo ""
echo "================================"
echo -e "${GREEN}✅ All services started successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Service URLs:${NC}"
echo -e "   🔧 API:          http://localhost:8000"
echo -e "   📱 Mobile App:   http://localhost:19006"
echo -e "   🌐 Landing:      http://localhost:5173"
echo -e "   ⚙️  Admin Panel:  http://localhost:5174"
echo ""
echo -e "${YELLOW}📝 Logs are saved in the 'logs/' directory${NC}"
echo -e "${YELLOW}⏹️  Press Ctrl+C to stop all services${NC}"
echo ""

# Wait for all background jobs
wait

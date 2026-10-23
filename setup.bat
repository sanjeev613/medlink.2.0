#!/bin/bash
# Windows Setup Script
# Run this in PowerShell or Git Bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  MediLink AI - Windows Setup${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Function to check command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command_exists node; then
    echo "❌ Node.js is not installed"
    echo "   Download from: https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✓ Node.js installed${NC}"

if ! command_exists python; then
    echo "❌ Python is not installed"
    echo "   Download from: https://www.python.org/"
    exit 1
fi
echo -e "${GREEN}✓ Python installed${NC}"

if ! command_exists git; then
    echo "❌ Git is not installed"
    echo "   Download from: https://git-scm.com/"
    exit 1
fi
echo -e "${GREEN}✓ Git installed${NC}"

echo ""

# Backend Setup
echo -e "${YELLOW}Setting up Backend...${NC}"
cd medilink-backend
call npm install
copy .env.example .env
echo -e "${GREEN}✓ Backend setup complete${NC}"
echo ""

# AI Service Setup
echo -e "${YELLOW}Setting up AI Service...${NC}"
cd ..\medilink-ai
python -m venv venv
call venv\Scripts\activate.bat
pip install -r requirements.txt
echo -e "${GREEN}✓ AI Service setup complete${NC}"
echo ""

# Hospital Dashboard Setup
echo -e "${YELLOW}Setting up Hospital Dashboard...${NC}"
cd ..\medilink-hospital-dashboard
call npm install
echo -e "${GREEN}✓ Hospital Dashboard setup complete${NC}"
echo ""

echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
echo "To start the services:"
echo ""
echo -e "${YELLOW}1. Backend API:${NC}"
echo "   cd medilink-backend && npm run dev"
echo ""
echo -e "${YELLOW}2. AI Service:${NC}"
echo "   cd medilink-ai"
echo "   venv\Scripts\activate.bat"
echo "   python app.py"
echo ""
echo -e "${YELLOW}3. Hospital Dashboard:${NC}"
echo "   cd medilink-hospital-dashboard && npm run dev"
echo ""

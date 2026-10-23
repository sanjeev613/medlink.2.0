#!/bin/bash
# MediLink Setup Script - Automated installation

set -e

echo "=================================="
echo "  MediLink AI - Setup Script"
echo "=================================="
echo ""

# Check prerequisites
echo "Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed."; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "Python 3 is required but not installed."; exit 1; }
command -v git >/dev/null 2>&1 || { echo "Git is required but not installed."; exit 1; }

echo "✓ Prerequisites verified"
echo ""

# Backend Setup
echo "Setting up Backend..."
cd medilink-backend
npm install
cp .env.example .env
echo "✓ Backend setup complete"
echo ""

# AI Service Setup
echo "Setting up AI Service..."
cd ../medilink-ai
python3 -m venv venv
source venv/bin/activate 2>/dev/null || . venv/Scripts/activate 2>/dev/null
pip install -r requirements.txt
echo "✓ AI Service setup complete"
echo ""

# Mobile App Setup (if Flutter is installed)
if command -v flutter >/dev/null 2>&1; then
    echo "Setting up Flutter Mobile App..."
    cd ../medilink-mobile
    flutter pub get
    echo "✓ Mobile App setup complete"
    echo ""
else
    echo "⚠ Flutter not found - skipping mobile app setup"
    echo "  Install Flutter and run: flutter pub get in medilink-mobile/"
    echo ""
fi

# Hospital Dashboard Setup
echo "Setting up Hospital Dashboard..."
cd ../medilink-hospital-dashboard
npm install
echo "✓ Hospital Dashboard setup complete"
echo ""

echo "=================================="
echo "  Setup Complete!"
echo "=================================="
echo ""
echo "To start the services:"
echo ""
echo "1. Backend API:"
echo "   cd medilink-backend && npm run dev"
echo ""
echo "2. AI Service:"
echo "   cd medilink-ai && source venv/bin/activate && python app.py"
echo ""
echo "3. Hospital Dashboard:"
echo "   cd medilink-hospital-dashboard && npm run dev"
echo ""
echo "For Docker setup, run:"
echo "   docker-compose up --build"
echo ""

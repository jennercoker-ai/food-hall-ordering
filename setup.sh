#!/bin/bash

# Event Ordering System Setup Script
# This script sets up and runs the event ordering system

set -e  # Exit on error

echo "🚀 Event Ordering System Setup"
echo "================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm $(npm -v) detected"
echo ""

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Starting development servers..."
echo "================================"
echo ""
echo "Frontend will be available at: http://localhost:3000"
echo "Backend API will be available at: http://localhost:3001"
echo ""
echo "Test URLs:"
echo "  Customer: http://localhost:3000/?vendor=vendor-001&location=Table%205"
echo "  Vendor:   http://localhost:3000/?view=vendor&vendor=vendor-001"
echo ""
echo "Press Ctrl+C to stop the servers"
echo ""

# Start the development server
npm run dev

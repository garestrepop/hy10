#!/bin/bash

# hy10 Development Setup Script
# Run this script to set up your local development environment

set -e

echo "🚀 Setting up hy10 development environment..."

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20 or higher."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version must be 20 or higher. Current: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v)"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm@8.15.0
fi
echo "✅ pnpm $(pnpm -v)"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed. You'll need to set up PostgreSQL manually."
    echo "   Visit: https://www.docker.com/get-started"
else
    echo "✅ Docker $(docker -v | cut -d' ' -f3 | cut -d',' -f1)"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pnpm install

# Set up environment file
echo ""
echo "⚙️  Setting up environment..."
if [ ! -f "apps/api/.env" ]; then
    cp apps/api/.env.example apps/api/.env
    echo "✅ Created apps/api/.env from .env.example"
    echo "   You can edit this file to customize your configuration"
else
    echo "ℹ️  apps/api/.env already exists, skipping..."
fi

# Start database
echo ""
echo "🐘 Starting PostgreSQL..."
if command -v docker &> /dev/null; then
    docker-compose up -d postgres
    echo "✅ PostgreSQL is starting..."
    echo "   Waiting for database to be ready..."
    sleep 5
    
    # Run migrations
    echo ""
    echo "🔄 Running database migrations..."
    cd apps/api
    pnpm migration:run
    cd ../..
    echo "✅ Migrations completed"
else
    echo "⚠️  Skipping database setup (Docker not available)"
    echo "   Please set up PostgreSQL manually and update apps/api/.env"
fi

# Success message
echo ""
echo "✨ Setup complete! You're ready to start developing."
echo ""
echo "📚 Next steps:"
echo "   1. Review and update apps/api/.env if needed"
echo "   2. Start the development server:"
echo "      pnpm dev"
echo ""
echo "   3. Visit the API documentation:"
echo "      http://localhost:3001/api/docs"
echo ""
echo "   4. Check health:"
echo "      curl http://localhost:3001/api/v1/health"
echo ""
echo "📖 For more information, see QUICKSTART.md"
echo ""

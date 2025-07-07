#!/bin/bash

# ==============================================
# FastAPI Backend Setup Script
# ==============================================

echo "🚀 Setting up FastAPI Backend..."

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Install development dependencies if in development
if [ "$1" == "dev" ]; then
    echo "📦 Installing development dependencies..."
    pip install -r requirements/dev.txt
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📄 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Remember to update .env with your actual values!"
fi

# Initialize Alembic if not already initialized
if [ ! -d "alembic/versions" ]; then
    echo "🗄️  Initializing database migrations..."
    alembic init alembic
fi

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your database credentials"
echo "2. Run: source venv/bin/activate"
echo "3. Run: uvicorn app.main:app --reload"
echo ""
echo "🌐 API will be available at: http://localhost:8000"
echo "📚 Documentation at: http://localhost:8000/docs"

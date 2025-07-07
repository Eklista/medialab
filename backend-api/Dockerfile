# ================================
# Multi-stage Dockerfile for FastAPI
# Supports development and production targets
# ================================

# Base image with Python 3.11
FROM python:3.11-slim as base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set work directory
WORKDIR /app

# ================================
# Development stage
# ================================
FROM base as development

# Install development dependencies
RUN apt-get update && apt-get install -y \
    git \
    vim \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements files
COPY requirements/ requirements/
COPY requirements.txt .

# Install Python dependencies
RUN pip install -r requirements.txt
RUN if [ -f requirements/dev.txt ]; then pip install -r requirements/dev.txt; fi

# Copy application code
COPY . .

# Change ownership to app user
RUN chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Development command with hot reload
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# ================================
# Production builder stage
# ================================
FROM base as builder

# Copy requirements files
COPY requirements/ requirements/
COPY requirements.txt .

# Install production dependencies only
RUN pip install --user --no-cache-dir -r requirements.txt

# ================================
# Production stage
# ================================
FROM base as production

# Copy Python dependencies from builder
COPY --from=builder /root/.local /root/.local

# Make sure scripts in .local are usable
ENV PATH=/root/.local/bin:$PATH

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p /app/logs /app/.cache && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Production command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]

# ================================
# Testing stage
# ================================
FROM development as testing

# Install test dependencies
RUN if [ -f requirements/test.txt ]; then pip install -r requirements/test.txt; fi

# Run tests
CMD ["python", "-m", "pytest", "tests/", "-v"]

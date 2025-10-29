# ========== BUILDER STAGE ==========
FROM python:3.13-slim AS builder

# Install uv binary from its official docker repository
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Install all required system and build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl build-essential libpq-dev gcc python3-dev libffi-dev && \
    rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Copy dependency files first for caching
COPY pyproject.toml uv.lock /app/

# Install dependencies using uv into a virtual environment
RUN uv sync --frozen --compile-bytecode


# ========== RUNTIME STAGE ==========
FROM python:3.13-slim AS runtime

# Copy uv binary into runtime image (was missing)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    ENVIRONMENT=production \
    UV_SYSTEM_PYTHON=1

# Set work directory
WORKDIR /app/kennysolutions

# Copy the application including virtual environment
COPY --from=builder /app /app

# Add the venv to PATH
ENV PATH="/app/.venv/bin:$PATH"

# Copy remaining source files
COPY . /app/

# Copy entrypoint script and make it executable
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Expose Django port
EXPOSE 8000

# Set entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]

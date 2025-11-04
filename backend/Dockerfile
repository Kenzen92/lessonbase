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

# Install runtime dependencies required for Python packages
# libpq5: Required for psycopg2-binary (PostgreSQL adapter)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    ENVIRONMENT=production \
    UV_SYSTEM_PYTHON=1

# Set work directory
WORKDIR /app

# Copy only the virtual environment from builder
COPY --from=builder /app/.venv /app/.venv

# Add the venv to PATH
ENV PATH="/app/.venv/bin:$PATH"

# Copy the Django project (lessonbase folder contents)
COPY lessonbase/ /app/lessonbase/

# Copy entrypoint script and make it executable
COPY entrypoint.sh /app/entrypoint.sh
COPY migrate.sh /app/migrate.sh
RUN chmod +x /app/entrypoint.sh /app/migrate.sh

# Expose Django port
EXPOSE 8000

# Use CMD instead of ENTRYPOINT so release_command works properly
CMD ["/app/entrypoint.sh"]

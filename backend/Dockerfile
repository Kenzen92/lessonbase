# Use Python Alpine image for a smaller footprint
FROM python:3.13-alpine

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    ENVIRONMENT=production \
    UV_SYSTEM_PYTHON=1

# Install system dependencies (required for psycopg2 and Pillow)
RUN apk add --no-cache \
    postgresql-dev \
    gcc \
    musl-dev \
    python3-dev \
    libffi-dev \
    curl \
    dos2unix

# Set work directory to your project root
WORKDIR /app

# Copy dependency files first for caching
COPY pyproject.toml uv.lock /app/

# Create a venv and install tooling into the venv, then sync dependencies
# Install uv into the venv and run the sync from the venv so packages land
# inside /opt/venv (not the system python environment).
RUN python -m venv /opt/venv && \
    /opt/venv/bin/pip install --upgrade pip && \
    /opt/venv/bin/pip install --no-cache-dir uv && \
    /opt/venv/bin/uv sync --frozen --no-cache


# Ensure the correct format for the entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN dos2unix /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Copy the rest of your code
COPY . /app/


# Move into the Django project directory
WORKDIR /app/kennysolutions

# Expose Django/Gunicorn port
EXPOSE 8000


ENV PATH="/opt/venv/bin:$PATH"

# Default command (runs entrypoint)
CMD ["/bin/sh", "/app/entrypoint.sh"]

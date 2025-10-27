# Use Python Alpine image for a smaller footprint
FROM python:3.12-alpine

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_HOME=/opt/poetry \
    ENVIRONMENT=production

# Install system dependencies and Poetry
RUN apk add --no-cache \
    postgresql-dev \
    gcc \
    musl-dev \
    python3-dev \
    libffi-dev \
    curl \
    dos2unix \
    && curl -sSL https://install.python-poetry.org | python3 - \
    && ln -s /opt/poetry/bin/poetry /usr/local/bin/poetry

# Set work directory to the *root of your application code*
# This is where pyproject.toml and the 'kennysolutions' Django project are located
WORKDIR /app

# Copy dependency files first
COPY pyproject.toml poetry.lock /app/

# Install dependencies
RUN poetry install --no-root --no-interaction

# Copy the rest of the app, including the kennysolutions directory and manage.py
COPY . /app/

# Copy entrypoint script
COPY entrypoint.sh /app/entrypoint.sh

# Ensure proper line endings and make executable
RUN dos2unix /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh


# Ensure the project directory exists and has correct permissions
RUN mkdir -p /app/kennysolutions && chown -R root:root /app

# Change WORKDIR to the Django project directory for manage.py commands
WORKDIR /app/kennysolutions

# Expose Django/Gunicorn port
EXPOSE 8000

# Set the default command using shell to ensure proper environment
CMD ["/bin/sh", "/app/entrypoint.sh"]
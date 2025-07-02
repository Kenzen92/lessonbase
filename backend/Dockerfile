# Use an official Python runtime
FROM python:3.12

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    POETRY_VIRTUALENVS_CREATE=false \
    ENVIRONMENT=production

# Install system dependencies
RUN apt-get update && apt-get install -y curl build-essential libpq-dev gcc && \
    apt-get clean

# Install Poetry
RUN curl -sSL https://install.python-poetry.org | python3 - && \
    mv /root/.local/bin/poetry /usr/local/bin/

# Set work directory to the *root of your application code*
# This is where pyproject.toml and the 'kennysolutions' Django project are located
WORKDIR /app

# Copy dependency files first
COPY pyproject.toml poetry.lock /app/

# Install dependencies
RUN poetry install --no-root --no-interaction

# Copy the rest of the app, including the kennysolutions directory and manage.py
COPY . /app/

# Copy entrypoint and make it executable
# (Ensure entrypoint.sh is in the same directory as your Dockerfile locally)
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Change WORKDIR to the Django project directory for manage.py commands
WORKDIR /app/kennysolutions

# Expose Django/Gunicorn port
EXPOSE 8000

# Set the default command using its absolute path
CMD ["/app/entrypoint.sh"]
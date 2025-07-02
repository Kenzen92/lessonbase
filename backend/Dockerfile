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

# Set work directory
WORKDIR /app

# Copy dependency files first
COPY pyproject.toml poetry.lock /app/

# Install dependencies
RUN poetry install --no-root --no-interaction

# Copy the rest of the app
COPY . /app/

# Copy entrypoint and make it executable (must be after copying files)
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh


# Expose Django/Gunicorn port
EXPOSE 8000

# Set the default command
CMD ["/app/entrypoint.sh"]
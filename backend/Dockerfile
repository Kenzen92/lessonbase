# Use an official Python runtime as a parent image
FROM python:3.12

# Install Poetry
RUN curl -sSL https://install.python-poetry.org | python3 - && \
    mv /root/.local/bin/poetry /usr/local/bin/

# Disable Poetry's virtual environments (since this is inside a Docker container)
ENV POETRY_VIRTUALENVS_CREATE=false

# Set work directory
WORKDIR /app

# Copy pyproject.toml and poetry.lock first to leverage Docker cache
COPY pyproject.toml poetry.lock /app/

# Install dependencies
RUN poetry install --no-root --no-interaction

# Copy the rest of the project files
COPY . /app/

# Set the workdir to the Django project directory
WORKDIR /app/kennysolutions

# Expose the port for Django's development server
EXPOSE 8000

# Run migrations and start the Django server
CMD ["poetry", "run", "python", "manage.py", "runserver", "0.0.0.0:8000"]

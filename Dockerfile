FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy project
COPY . /app

# Default command binds to $PORT provided by Railway
CMD ["sh", "-c", "gunicorn app:app --chdir backend --bind 0.0.0.0:$PORT"]

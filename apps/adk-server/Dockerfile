FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 adk && chown -R adk:adk /app
USER adk

# Expose ADK API server port
EXPOSE 8080

# Run ADK API server with /adk prefix for Ingress routing
CMD ["adk", "api_server", "--port", "8080", "--host", "0.0.0.0", "--url_prefix", "/adk"]

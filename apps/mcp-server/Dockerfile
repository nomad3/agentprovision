FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY pyproject.toml .
RUN pip install --no-cache-dir .

# Copy source
COPY src/ src/
COPY .env.example .env

# Expose MCP port
EXPOSE 8085

# Run server
CMD ["python", "-m", "src.server"]

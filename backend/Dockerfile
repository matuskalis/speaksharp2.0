FROM python:3.11

# Install system dependencies including FFmpeg and Azure Speech SDK requirements
RUN apt-get update && apt-get install -y \
    ffmpeg \
    build-essential \
    libssl-dev \
    libssl3 \
    ca-certificates \
    libasound2 \
    libasound2-dev \
    libpulse0 \
    libpulse-dev \
    libc6 \
    libstdc++6 \
    libgcc1 \
    wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8001

# Run uvicorn with PORT from environment (Render provides this)
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8001}

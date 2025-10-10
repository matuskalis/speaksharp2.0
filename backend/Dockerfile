FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive

# Install Python 3.8 and system dependencies (Ubuntu 20.04 default Python)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-dev \
    python3-pip \
    ffmpeg \
    build-essential \
    libssl-dev \
    libssl1.1 \
    ca-certificates \
    libasound2 \
    libasound2-dev \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set python3 as default python
RUN update-alternatives --install /usr/bin/python python /usr/bin/python3 1

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

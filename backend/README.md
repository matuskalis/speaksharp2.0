# SpeakSharp Backend API

FastAPI-based pronunciation assessment API using Azure Speech Services and Allosaurus.

## Features

- **Azure Speech Services**: Accurate pronunciation scoring with phoneme-level analysis
- **Allosaurus AI**: IPA phonetic transcription for detailed phoneme detection
- **REST API**: Simple HTTP endpoints for audio upload and assessment
- **Mock Mode**: Works without Azure credentials for development/testing

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

Edit `.env` file:

```env
AZURE_SPEECH_KEY=your_actual_key_here
AZURE_SPEECH_REGION=eastus
```

To get Azure credentials:
1. Go to https://portal.azure.com
2. Create a Speech Services resource
3. Copy the key and region

### 3. Run Server

```bash
# Development mode (auto-reload)
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001

# Or use the run script
python app/main.py
```

Server will start at: http://localhost:8001

## API Endpoints

### Health Check
```
GET /health
```

Returns API status and service configuration.

### Pronunciation Scoring
```
POST /api/score
Content-Type: multipart/form-data

Parameters:
- audio: Audio file (webm, wav, mp3)
- text: Expected text to pronounce
- item_type: "word" | "phrase" | "sentence"
```

Returns detailed pronunciation assessment with scores and IPA transcription.

### Test Endpoint
```
GET /api/test
```

Quick test to verify API is running.

## API Documentation

Interactive docs available at:
- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

## Architecture

```
app/
├── main.py              # FastAPI application
├── api/
│   └── routes/          # API endpoints
├── core/
│   ├── config.py        # Configuration
│   └── azure_speech.py  # Azure Speech SDK wrapper
├── services/
│   ├── pronunciation_service.py  # Main assessment logic
│   └── phoneme_service.py        # Allosaurus integration
└── models/
    └── schemas.py       # Pydantic models
```

## Development

The API runs in mock mode if Azure credentials are not configured. This allows development and testing without Azure costs.

## Testing

Use the `/api/test` endpoint or upload audio via `/api/score` to test the API.

Example curl command:
```bash
curl -X POST http://localhost:8001/api/score \
  -F "audio=@test.wav" \
  -F "text=hello" \
  -F "item_type=word"
```
# Trigger redeploy

# Phonetix - AI-Powered Pronunciation Coaching

Master English pronunciation like a native speaker with real AI-powered phonetic analysis.

🌐 **Live Demo:** https://speaksharp20-production.up.railway.app

## 🎯 Overview

Phonetix is a Duolingo-style pronunciation coaching app that provides **real** pronunciation assessment powered by Microsoft Azure Speech Services. Unlike other apps that use fake scores or guesswork, Phonetix gives you actual phonetic analysis and personalized feedback.

## ✨ Features

- 🎤 **Real-time Voice Recording** - Record your pronunciation directly in the browser
- 🤖 **Azure AI Assessment** - Professional-grade pronunciation scoring using Microsoft Azure Speech Services
- 📊 **Detailed Scoring** - Get accuracy, fluency, completeness, and overall pronunciation scores
- 🔤 **IPA Transcription** - See your pronunciation in International Phonetic Alphabet
- 📈 **Progress Tracking** - 20 questions per session with difficulty levels (Easy, Medium, Hard)
- 🎯 **Word-level Feedback** - Identify exactly which phonemes need improvement
- 🌍 **Cross-platform** - Works on desktop and mobile browsers

## 🏗️ Architecture

### Frontend (Next.js 15)
- **Framework:** Next.js 15.5.4 with App Router
- **UI:** React with Tailwind CSS
- **Audio:** Web Audio API for recording
- **Deployment:** Railway (https://speaksharp20-production.up.railway.app)

### Backend (Python FastAPI)
- **Framework:** FastAPI with uvicorn
- **AI Engine:** Azure Cognitive Services Speech SDK 1.31.0
- **Audio Processing:** FFmpeg for format conversion (WebM → WAV)
- **Deployment:** Railway (https://speaksharp20-production-1a8d.up.railway.app)

```
┌─────────────────┐
│  Next.js App    │
│  (Frontend)     │
└────────┬────────┘
         │ HTTP POST /api/score
         │ {text, audio_data}
         ▼
┌─────────────────┐
│  FastAPI        │
│  (Backend)      │
├─────────────────┤
│ - Audio Convert │
│ - Azure SDK     │
│ - Scoring       │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Azure Speech   │
│  Services       │
└─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (for frontend)
- Python 3.8+ (for backend)
- Azure Speech Services API key

### Environment Variables

#### Frontend (.env.local)
```bash
BACKEND_URL=https://speaksharp20-production-1a8d.up.railway.app
NODE_ENV=production
```

#### Backend (.env)
```bash
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=eastus
```

### Local Development

#### Frontend
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

#### Backend
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app.main:app --reload --port 8001

# Open http://localhost:8001/docs for API docs
```

## 📦 Deployment (Railway)

### Frontend Service
1. Connect to GitHub repository
2. Set root directory: `/` (or leave empty)
3. Deploy branch: `phonetix-main` or `main`
4. Environment variables: `BACKEND_URL`

### Backend Service
1. Connect to GitHub repository
2. Set root directory: `backend`
3. Deploy branch: `main`
4. Build method: Dockerfile
5. Environment variables: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`

## 🐳 Docker

The backend uses a custom Dockerfile optimized for Azure Speech SDK:

```dockerfile
FROM ubuntu:20.04

# System dependencies
RUN apt-get update && apt-get install -y \
    python3 python3-pip \
    libssl1.1 ca-certificates \
    libasound2 libasound2-dev \
    libstdc++6 libgcc-s1 \
    ffmpeg build-essential

# Python packages
COPY requirements.txt .
RUN pip install -r requirements.txt

# Run application
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8001}
```

**Key Requirements:**
- Ubuntu 20.04 (for OpenSSL 1.1.x compatibility)
- `libssl1.1` - Azure SDK requires OpenSSL 1.1
- `libasound2` - ALSA sound libraries
- `libstdc++6`, `libgcc-s1` - C++ runtime for Azure SDK

## 🛠️ Technologies

### Frontend Stack
- **Next.js 15.5.4** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library
- **Framer Motion** - Animations

### Backend Stack
- **FastAPI 0.109.2** - Modern Python web framework
- **Azure Speech SDK 1.31.0** - Microsoft AI pronunciation assessment
- **Pydantic 2.6.4** - Data validation
- **FFmpeg** - Audio format conversion
- **Uvicorn 0.27.0** - ASGI server

## 📡 API Endpoints

### Health Check
```bash
GET /api/test

Response:
{
  "status": "ok",
  "message": "Pronunciation API is running",
  "azure_configured": true,
  "allosaurus_loaded": false
}
```

### Pronunciation Assessment
```bash
POST /api/score

Request:
{
  "text": "think",
  "audio_data": "base64_encoded_audio",
  "audio_format": "webm"
}

Response:
{
  "success": true,
  "overall_score": 97.0,
  "accuracy_score": 95.0,
  "fluency_score": 98.0,
  "completeness_score": 100.0,
  "pronunciation_score": 97.0,
  "recognized_text": "think",
  "expected_text": "think",
  "ipa_transcription": "/θ ɪ ŋ k/",
  "words": [...],
  "message": "Pronunciation assessed successfully"
}
```

## 🧪 Testing

Run the automated backend test:

```bash
chmod +x test-backend.sh
./test-backend.sh
```

This tests:
- ✅ Backend health check
- ✅ Azure configuration
- ✅ Pronunciation assessment endpoint
- ✅ Error 2153 detection (Azure SDK initialization)

## 🐛 Troubleshooting

### Error 2153: "Failed to initialize platform (azure-c-shared)"

**Cause:** Missing system libraries for Azure Speech SDK

**Solution:** Ensure Dockerfile includes:
```dockerfile
RUN apt-get install -y \
    libssl1.1 \          # OpenSSL 1.1.x
    libasound2 \         # ALSA sound
    libasound2-dev \
    libstdc++6 \         # C++ runtime
    libgcc-s1            # GCC runtime
```

### Frontend not connecting to backend

**Check:**
1. `BACKEND_URL` environment variable is set correctly
2. Backend service is running (check `/api/test` endpoint)
3. CORS is configured in backend (`app/main.py`)

### Audio recording not working

**Check:**
1. Browser permissions for microphone access
2. HTTPS connection (HTTP won't allow microphone on production)
3. Browser compatibility (Chrome, Firefox, Safari recommended)

## 📈 Performance

- **Backend response time:** ~1-2 seconds for pronunciation assessment
- **Audio processing:** WebM → WAV conversion via FFmpeg
- **Concurrent users:** Supports multiple users with async/await
- **Memory usage:** ~200MB per container (after removing Allosaurus)

## 🎓 How It Works

1. **User speaks** → Browser records audio via Web Audio API
2. **Audio encoding** → Convert to base64 and send to backend
3. **Format conversion** → Backend converts WebM to WAV (16kHz, mono, 16-bit PCM)
4. **Azure assessment** → Azure Speech SDK analyzes pronunciation with phoneme-level granularity
5. **Results** → Backend returns scores, IPA transcription, and word-level feedback
6. **Display** → Frontend shows results with visual feedback and progress

## 🔒 Security

- API keys stored in environment variables (never in code)
- CORS configured for specific origins
- No user data stored (stateless)
- HTTPS enforced in production

## 📝 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- **Microsoft Azure** - Speech Services API
- **Railway** - Deployment platform
- **FastAPI** - Python web framework
- **Next.js** - React framework

## 👨‍💻 Author

**Matus Kalis**
- Website: https://matuskalis.com
- GitHub: [@matuskalis](https://github.com/matuskalis)

---

Built with ❤️ using Azure AI and modern web technologies.

**Live Demo:** https://speaksharp20-production.up.railway.app

#!/bin/bash

BACKEND_URL="https://speaksharp20-production-1a8d.up.railway.app"

echo "=== Testing Backend Health ==="
curl -s "$BACKEND_URL/api/test" | python3 -m json.tool

echo -e "\n\n=== Testing with Sample Audio ==="
# Create a minimal WAV file (1 second of silence at 16kHz)
# This is a base64 encoded 1-second silent WAV file
SAMPLE_AUDIO="UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQAAAAA="

# Send test request
curl -s -X POST "$BACKEND_URL/api/score" \
  -H "Content-Type: application/json" \
  -d "{
    \"text\": \"think\",
    \"audio_data\": \"$SAMPLE_AUDIO\",
    \"audio_format\": \"wav\"
  }" | python3 -m json.tool

echo -e "\n\n=== Check for Error 2153 ==="
RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/score" \
  -H "Content-Type: application/json" \
  -d "{
    \"text\": \"think\",
    \"audio_data\": \"$SAMPLE_AUDIO\",
    \"audio_format\": \"wav\"
  }")

if echo "$RESPONSE" | grep -q "2153"; then
  echo "❌ FAILED: Error 2153 detected (Azure SDK not initialized)"
  exit 1
elif echo "$RESPONSE" | grep -q "overall_score"; then
  echo "✅ SUCCESS: Azure Speech SDK is working!"
  exit 0
else
  echo "⚠️  UNKNOWN: Unexpected response"
  echo "$RESPONSE"
  exit 2
fi

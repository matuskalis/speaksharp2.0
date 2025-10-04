"""Azure Speech Services integration for pronunciation assessment"""
import azure.cognitiveservices.speech as speechsdk
from typing import Dict, Any, Optional
import json
import logging
import tempfile
import os
import subprocess

from app.core.config import settings

logger = logging.getLogger(__name__)


class AzureSpeechService:
    """Wrapper for Azure Speech Services pronunciation assessment"""

    def __init__(self):
        """Initialize Azure Speech configuration"""
        self.speech_key = settings.AZURE_SPEECH_KEY
        self.speech_region = settings.AZURE_SPEECH_REGION

        if not self.speech_key or self.speech_key == "your_azure_speech_key_here":
            logger.warning("Azure Speech key not configured. Running in mock mode.")
            self.configured = False
        else:
            self.configured = True
            self.speech_config = speechsdk.SpeechConfig(
                subscription=self.speech_key,
                region=self.speech_region
            )

    def assess_pronunciation(
        self,
        audio_data: bytes,
        reference_text: str,
        audio_format: str = "wav"
    ) -> Dict[str, Any]:
        """
        Assess pronunciation using Azure Speech Services

        Args:
            audio_data: Audio file bytes
            reference_text: Expected text to pronounce
            audio_format: Audio format (wav, webm, mp3)

        Returns:
            Dictionary with pronunciation assessment results
        """
        if not self.configured:
            return self._mock_assessment(reference_text)

        try:
            # Convert to WAV if needed
            wav_data = audio_data
            if audio_format != "wav":
                logger.info(f"Converting {audio_format} to WAV for Azure processing")
                wav_data = self._convert_to_wav(audio_data, audio_format)
                if not wav_data:
                    return {
                        "success": False,
                        "message": f"Failed to convert {audio_format} to WAV",
                        "recognized_text": "",
                        "overall_score": 0.0
                    }

            # Configure audio format (16kHz, 16-bit, mono PCM WAV)
            audio_format_obj = speechsdk.audio.AudioStreamFormat(
                samples_per_second=16000,
                bits_per_sample=16,
                channels=1
            )

            # Create pronunciation assessment config
            pronunciation_config = speechsdk.PronunciationAssessmentConfig(
                reference_text=reference_text,
                grading_system=speechsdk.PronunciationAssessmentGradingSystem.HundredMark,
                granularity=speechsdk.PronunciationAssessmentGranularity.Phoneme,
                enable_miscue=True
            )

            # Create audio stream from bytes
            stream = speechsdk.audio.PushAudioInputStream(audio_format_obj)
            audio_config = speechsdk.audio.AudioConfig(stream=stream)

            # Create speech recognizer
            speech_recognizer = speechsdk.SpeechRecognizer(
                speech_config=self.speech_config,
                audio_config=audio_config
            )

            # Apply pronunciation assessment config
            pronunciation_config.apply_to(speech_recognizer)

            # Write audio data to stream
            stream.write(wav_data)
            stream.close()

            # Perform recognition
            result = speech_recognizer.recognize_once()

            if result.reason == speechsdk.ResultReason.RecognizedSpeech:
                return self._parse_azure_result(result, reference_text)
            elif result.reason == speechsdk.ResultReason.NoMatch:
                logger.warning("No speech recognized in audio")
                return {
                    "success": False,
                    "message": "No speech detected in audio",
                    "recognized_text": "",
                    "overall_score": 0.0
                }
            else:
                logger.error(f"Speech recognition failed: {result.reason}")
                return {
                    "success": False,
                    "message": "Speech recognition failed",
                    "recognized_text": "",
                    "overall_score": 0.0
                }

        except Exception as e:
            logger.error(f"Error in pronunciation assessment: {str(e)}")
            return {
                "success": False,
                "message": f"Assessment error: {str(e)}",
                "recognized_text": "",
                "overall_score": 0.0
            }

    def _parse_azure_result(
        self,
        result: speechsdk.SpeechRecognitionResult,
        reference_text: str
    ) -> Dict[str, Any]:
        """Parse Azure pronunciation assessment result"""
        try:
            # Get pronunciation assessment result
            pronunciation_result = speechsdk.PronunciationAssessmentResult(result)

            # Parse JSON details for phoneme-level data
            result_json = json.loads(result.properties.get(
                speechsdk.PropertyId.SpeechServiceResponse_JsonResult
            ))

            words_data = []
            if "NBest" in result_json and len(result_json["NBest"]) > 0:
                words_list = result_json["NBest"][0].get("Words", [])

                for word_data in words_list:
                    phonemes = []
                    for phoneme_data in word_data.get("Phonemes", []):
                        phonemes.append({
                            "phoneme": phoneme_data.get("Phoneme", ""),
                            "accuracy": phoneme_data.get("Score", 0.0),
                            "error_type": self._classify_phoneme_error(
                                phoneme_data.get("Score", 0.0)
                            )
                        })

                    words_data.append({
                        "word": word_data.get("Word", ""),
                        "accuracy": word_data.get("PronunciationAssessment", {}).get("AccuracyScore", 0.0),
                        "error_type": word_data.get("PronunciationAssessment", {}).get("ErrorType", "None"),
                        "phonemes": phonemes
                    })

            return {
                "success": True,
                "overall_score": pronunciation_result.accuracy_score,
                "accuracy_score": pronunciation_result.accuracy_score,
                "fluency_score": pronunciation_result.fluency_score,
                "completeness_score": pronunciation_result.completeness_score,
                "pronunciation_score": pronunciation_result.pronunciation_score,
                "recognized_text": result.text,
                "expected_text": reference_text,
                "words": words_data,
                "message": "Pronunciation assessed successfully"
            }

        except Exception as e:
            logger.error(f"Error parsing Azure result: {str(e)}")
            return {
                "success": True,
                "overall_score": 75.0,
                "accuracy_score": 75.0,
                "recognized_text": result.text,
                "expected_text": reference_text,
                "words": [],
                "message": "Partial assessment (parsing error)"
            }

    def _classify_phoneme_error(self, score: float) -> Optional[str]:
        """Classify phoneme error based on score"""
        if score >= 80:
            return None
        elif score >= 60:
            return "Mispronunciation"
        else:
            return "Omission"

    def _convert_to_wav(self, audio_data: bytes, audio_format: str) -> Optional[bytes]:
        """Convert audio to WAV format using ffmpeg"""
        try:
            # Save input to temp file
            with tempfile.NamedTemporaryFile(suffix=f".{audio_format}", delete=False) as temp_input:
                temp_input.write(audio_data)
                input_path = temp_input.name

            output_path = input_path.rsplit(".", 1)[0] + ".wav"

            try:
                # Use ffmpeg to convert to WAV (mono, 16kHz, 16-bit PCM)
                cmd = [
                    "ffmpeg",
                    "-i", input_path,
                    "-ar", "16000",  # Sample rate: 16kHz
                    "-ac", "1",      # Channels: mono
                    "-c:a", "pcm_s16le",  # Codec: 16-bit PCM
                    "-y",            # Overwrite output
                    output_path
                ]

                # Run ffmpeg (suppress output)
                result = subprocess.run(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    timeout=30
                )

                if result.returncode == 0 and os.path.exists(output_path):
                    # Read WAV data
                    with open(output_path, "rb") as f:
                        wav_data = f.read()
                    logger.info(f"Successfully converted {audio_format} to WAV ({len(wav_data)} bytes)")
                    return wav_data
                else:
                    logger.error(f"ffmpeg conversion failed: {result.stderr.decode()}")
                    return None

            finally:
                # Clean up temp files
                if os.path.exists(input_path):
                    os.unlink(input_path)
                if os.path.exists(output_path):
                    os.unlink(output_path)

        except Exception as e:
            logger.error(f"Error converting audio: {str(e)}")
            return None

    def _mock_assessment(self, reference_text: str) -> Dict[str, Any]:
        """Return mock assessment for testing without Azure credentials"""
        import random

        base_score = random.uniform(65, 85)
        words = reference_text.split()

        words_data = []
        for word in words:
            word_score = base_score + random.uniform(-10, 10)
            words_data.append({
                "word": word,
                "accuracy": max(0, min(100, word_score)),
                "error_type": "None" if word_score > 70 else "Mispronunciation",
                "phonemes": []
            })

        return {
            "success": True,
            "overall_score": base_score,
            "accuracy_score": base_score,
            "fluency_score": base_score + random.uniform(-5, 5),
            "completeness_score": base_score + random.uniform(-5, 5),
            "pronunciation_score": base_score,
            "recognized_text": reference_text,
            "expected_text": reference_text,
            "words": words_data,
            "message": "Mock assessment (Azure not configured)"
        }


# Global instance
azure_speech_service = AzureSpeechService()

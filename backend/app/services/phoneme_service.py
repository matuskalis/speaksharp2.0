"""Allosaurus phoneme detection service for IPA transcription"""
import logging
import tempfile
import os
from typing import Optional

logger = logging.getLogger(__name__)


class PhonemeDetectionService:
    """Service for detecting phonemes using Allosaurus"""

    def __init__(self):
        """Initialize Allosaurus model"""
        self.model = None
        self.loaded = False

        try:
            from allosaurus.app import read_recognizer
            logger.info("Loading Allosaurus model...")
            self.model = read_recognizer()
            self.loaded = True
            logger.info("Allosaurus model loaded successfully")
        except Exception as e:
            logger.warning(f"Failed to load Allosaurus: {str(e)}. IPA transcription will be unavailable.")
            self.loaded = False

    def detect_phonemes(self, audio_data: bytes, audio_format: str = "wav") -> Optional[str]:
        """
        Detect phonemes from audio using Allosaurus

        Args:
            audio_data: Audio file bytes
            audio_format: Audio format (wav, webm, mp3)

        Returns:
            IPA transcription string or None if failed
        """
        if not self.loaded:
            logger.warning("Allosaurus not loaded, skipping phoneme detection")
            return None

        try:
            # Save audio to temporary file
            with tempfile.NamedTemporaryFile(
                suffix=f".{audio_format}",
                delete=False
            ) as temp_audio:
                temp_audio.write(audio_data)
                temp_audio_path = temp_audio.name

            try:
                # If not WAV, convert to WAV first
                if audio_format != "wav":
                    converted_path = self._convert_to_wav(temp_audio_path)
                    if converted_path:
                        os.unlink(temp_audio_path)
                        temp_audio_path = converted_path

                # Run Allosaurus recognition
                ipa_transcription = self.model.recognize(temp_audio_path)

                # Clean up IPA string (remove extra spaces)
                ipa_transcription = " ".join(ipa_transcription.split())

                return ipa_transcription

            finally:
                # Clean up temp file
                if os.path.exists(temp_audio_path):
                    os.unlink(temp_audio_path)

        except Exception as e:
            logger.error(f"Error in phoneme detection: {str(e)}")
            return None

    def _convert_to_wav(self, input_path: str) -> Optional[str]:
        """Convert audio file to WAV format using ffmpeg"""
        try:
            import subprocess

            # Output path
            output_path = input_path.rsplit(".", 1)[0] + ".wav"

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
                logger.info(f"Successfully converted audio to WAV: {output_path}")
                return output_path
            else:
                logger.error(f"ffmpeg conversion failed: {result.stderr.decode()}")
                return None

        except Exception as e:
            logger.error(f"Error converting audio to WAV: {str(e)}")
            return None

    def analyze_pronunciation_patterns(self, ipa_transcription: str) -> dict:
        """
        Analyze IPA transcription for common pronunciation patterns

        Args:
            ipa_transcription: IPA phonetic transcription

        Returns:
            Dictionary with detected patterns
        """
        patterns = {
            "th_issues": False,
            "r_l_confusion": False,
            "v_sounds": False,
            "final_consonants": False,
            "specific_phonemes": []
        }

        if not ipa_transcription:
            return patterns

        # Check for TH sound substitutions
        if "θ" not in ipa_transcription and "ð" not in ipa_transcription:
            # Look for likely substitutions (t, d, s, z)
            if any(phone in ipa_transcription for phone in ["t", "d", "s", "z"]):
                patterns["th_issues"] = True
                patterns["specific_phonemes"].append("TH (θ/ð)")

        # Check for R/L confusion
        # This is harder to detect without reference, but we can flag if both appear
        if "r" in ipa_transcription and "l" in ipa_transcription:
            patterns["r_l_confusion"] = True
            patterns["specific_phonemes"].append("R/L")

        # Check for V sounds
        if "v" in ipa_transcription or "w" in ipa_transcription or "b" in ipa_transcription:
            patterns["v_sounds"] = True
            patterns["specific_phonemes"].append("V sounds")

        # Check for final consonant patterns
        # This would require more sophisticated analysis
        words = ipa_transcription.split()
        for word in words:
            if len(word) > 0 and word[-1] in "ptkbdgfvsʃʒmnŋlr":
                patterns["final_consonants"] = True
                break

        return patterns


# Global instance
phoneme_service = PhonemeDetectionService()

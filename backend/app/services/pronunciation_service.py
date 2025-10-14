"""Pronunciation assessment service combining Azure and Allosaurus"""
import logging
from typing import Dict, Any

from app.core.azure_speech import azure_speech_service
from app.services.phoneme_service import phoneme_service

logger = logging.getLogger(__name__)


class PronunciationService:
    """Main service for pronunciation assessment"""

    def __init__(self):
        """Initialize pronunciation service"""
        self.azure_service = azure_speech_service
        self.phoneme_service = phoneme_service

    async def assess_pronunciation(
        self,
        audio_data: bytes,
        reference_text: str,
        audio_format: str = "wav"
    ) -> Dict[str, Any]:
        """
        Comprehensive pronunciation assessment

        Combines:
        1. Azure Speech Services for accurate scoring
        2. Allosaurus for IPA phonetic transcription
        3. Custom pattern analysis for error detection

        Args:
            audio_data: Audio file bytes
            reference_text: Expected text to be pronounced
            audio_format: Audio format (wav, webm, mp3)

        Returns:
            Complete assessment results
        """
        try:
            # Step 1: Get Azure pronunciation assessment
            logger.info(f"Assessing pronunciation for text: {reference_text}")
            azure_result = self.azure_service.assess_pronunciation(
                audio_data=audio_data,
                reference_text=reference_text,
                audio_format=audio_format
            )

            if not azure_result.get("success", False):
                return azure_result

            # Step 2: Get IPA transcription from Allosaurus (only as fallback)
            logger.info("Detecting phonemes with Allosaurus")
            allosaurus_ipa = self.phoneme_service.detect_phonemes(
                audio_data=audio_data,
                audio_format=audio_format
            )

            # Step 3: Use Azure IPA (already converted from phonemes), fallback to Allosaurus
            # IMPORTANT: Azure IPA is more accurate because it's based on pronunciation assessment
            azure_ipa = azure_result.get("ipa_transcription")
            final_ipa = azure_ipa if azure_ipa else allosaurus_ipa

            logger.info(f"IPA source: {'Azure (phoneme-based)' if azure_ipa else 'Allosaurus (audio-based)'}")

            # Step 4: Analyze pronunciation patterns
            error_patterns = {}
            if final_ipa:
                error_patterns = self.phoneme_service.analyze_pronunciation_patterns(
                    final_ipa
                )

            # Step 5: Combine results (don't overwrite Azure's IPA!)
            result = {
                **azure_result,
                # Keep Azure's IPA, only add Allosaurus if Azure didn't provide it
                "ipa_transcription": final_ipa,
                "allosaurus_ipa": allosaurus_ipa,  # Keep for debugging
                "error_patterns": error_patterns
            }

            # Add focus areas based on patterns
            focus_areas = []
            if error_patterns.get("th_issues"):
                focus_areas.append("TH sounds (θ/ð)")
            if error_patterns.get("r_l_confusion"):
                focus_areas.append("R/L discrimination")
            if error_patterns.get("v_sounds"):
                focus_areas.append("V/W/B sounds")
            if error_patterns.get("final_consonants"):
                focus_areas.append("Final consonants")

            result["focus_areas"] = focus_areas

            logger.info(f"Assessment complete. Overall score: {result.get('overall_score', 0)}")
            return result

        except Exception as e:
            logger.error(f"Error in pronunciation assessment: {str(e)}")
            return {
                "success": False,
                "message": f"Assessment failed: {str(e)}",
                "overall_score": 0.0,
                "recognized_text": "",
                "expected_text": reference_text
            }

    def analyze_words_for_patterns(self, words_data: list) -> Dict[str, Any]:
        """
        Analyze word-level data for common error patterns

        Args:
            words_data: List of word assessment results from Azure

        Returns:
            Dictionary of detected patterns
        """
        patterns = {
            "th_words": [],
            "r_l_words": [],
            "v_words": [],
            "final_consonant_words": []
        }

        for word_info in words_data:
            word = word_info.get("word", "").lower()
            error_type = word_info.get("error_type", "None")
            accuracy = word_info.get("accuracy", 100)

            # Only consider words with errors
            if error_type == "None" and accuracy > 80:
                continue

            # Check for TH sounds
            if "th" in word:
                patterns["th_words"].append(word)

            # Check for R/L
            if "r" in word or "l" in word:
                patterns["r_l_words"].append(word)

            # Check for V sounds
            if any(char in word for char in ["v", "w", "b"]):
                patterns["v_words"].append(word)

            # Check for final consonants
            if word and word[-1] in "bdfghjklmnpqrstvwxyz":
                patterns["final_consonant_words"].append(word)

        return patterns


# Global instance
pronunciation_service = PronunciationService()

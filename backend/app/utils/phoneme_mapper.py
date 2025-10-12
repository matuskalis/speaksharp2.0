"""
Azure Speech SDK Phoneme to IPA Mapping

Azure uses ARPABET/SAMPA format phonemes.
This module maps them to International Phonetic Alphabet (IPA) symbols.
"""

from typing import Dict, List, Optional


# Azure ARPABET/SAMPA to IPA mapping
AZURE_TO_IPA: Dict[str, str] = {
    # Consonants
    "b": "b",
    "d": "d",
    "f": "f",
    "g": "ɡ",
    "h": "h",
    "k": "k",
    "l": "l",
    "m": "m",
    "n": "n",
    "p": "p",
    "r": "ɹ",
    "s": "s",
    "t": "t",
    "v": "v",
    "w": "w",
    "y": "j",
    "z": "z",

    # Digraphs and special consonants
    "ch": "tʃ",
    "dh": "ð",    # "this"
    "jh": "dʒ",   # "judge"
    "ng": "ŋ",    # "sing"
    "sh": "ʃ",    # "ship"
    "th": "θ",    # "think"
    "zh": "ʒ",    # "measure"

    # Vowels (short)
    "aa": "ɑ",    # "father"
    "ae": "æ",    # "cat"
    "ah": "ʌ",    # "cut"
    "ao": "ɔ",    # "caught"
    "aw": "aʊ",   # "cow"
    "ax": "ə",    # "about" (schwa)
    "ay": "aɪ",   # "buy"
    "eh": "ɛ",    # "bed"
    "er": "ɜ",    # "bird"
    "ey": "eɪ",   # "bay"
    "ih": "ɪ",    # "bit"
    "iy": "i",    # "beet"
    "ow": "oʊ",   # "boat"
    "oy": "ɔɪ",   # "boy"
    "uh": "ʊ",    # "book"
    "uw": "u",    # "boot"

    # R-colored vowels
    "axr": "ɚ",   # "better"
    "ehr": "ɛr",  # "bear"
    "ier": "ɪr",  # "beer"
    "ohr": "ɔr",  # "bore"
    "uhr": "ʊr",  # "poor"
}


# Reverse mapping for reference
IPA_TO_AZURE: Dict[str, str] = {v: k for k, v in AZURE_TO_IPA.items()}


def azure_to_ipa(azure_phoneme: str) -> str:
    """
    Convert single Azure phoneme to IPA symbol

    Args:
        azure_phoneme: Azure format phoneme (e.g., "th", "ih", "ng")

    Returns:
        IPA symbol (e.g., "θ", "ɪ", "ŋ")
    """
    # Normalize to lowercase
    phoneme = azure_phoneme.lower().strip()

    # Remove stress markers (0, 1, 2) if present
    phoneme = ''.join(c for c in phoneme if not c.isdigit())

    # Return IPA or original if not found
    return AZURE_TO_IPA.get(phoneme, azure_phoneme)


def azure_word_to_ipa(azure_phonemes: List[str]) -> str:
    """
    Convert list of Azure phonemes to IPA string

    Args:
        azure_phonemes: List of Azure phonemes (e.g., ["th", "ih", "ng", "k"])

    Returns:
        IPA transcription string (e.g., "θɪŋk")
    """
    if not azure_phonemes:
        return ""

    ipa_symbols = [azure_to_ipa(p) for p in azure_phonemes]
    return " ".join(ipa_symbols)


def text_to_ipa_estimate(text: str) -> str:
    """
    Rough estimate of IPA for English text
    (Not accurate, just for display when Azure doesn't provide phonemes)

    Args:
        text: English word or phrase

    Returns:
        Estimated IPA (very rough approximation)
    """
    # This is a simplified mapping - real IPA requires pronunciation dictionary
    simple_map = {
        "th": "θ",
        "sh": "ʃ",
        "ch": "tʃ",
        "ng": "ŋ",
        "a": "æ",
        "e": "ɛ",
        "i": "ɪ",
        "o": "ɑ",
        "u": "ʌ",
    }

    result = text.lower()
    for eng, ipa in simple_map.items():
        result = result.replace(eng, ipa)

    return " ".join(result)


# Common English words to IPA (for testing/demo)
COMMON_WORDS_IPA: Dict[str, str] = {
    "think": "θ ɪ ŋ k",
    "this": "ð ɪ s",
    "cat": "k æ t",
    "dog": "d ɔ ɡ",
    "hello": "h ɛ l oʊ",
    "world": "w ɜ l d",
    "water": "w ɔ t ɚ",
    "computer": "k ə m p j u t ɚ",
    "pronunciation": "p ɹ ə n ʌ n s i eɪ ʃ ə n",
}


def get_expected_ipa(word: str) -> Optional[str]:
    """
    Get expected IPA for common words

    Args:
        word: English word

    Returns:
        IPA transcription if known, None otherwise
    """
    return COMMON_WORDS_IPA.get(word.lower())

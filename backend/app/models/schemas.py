"""Pydantic models for API request/response validation"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum


class ItemType(str, Enum):
    """Type of pronunciation item"""
    WORD = "word"
    PHRASE = "phrase"
    SENTENCE = "sentence"


class PronunciationScoreRequest(BaseModel):
    """Request model for pronunciation scoring"""
    text: str = Field(..., description="Expected text to pronounce")
    audio_data: str = Field(..., description="Base64-encoded audio data")
    item_type: str = Field(default="word", description="Type of item (word/phrase/sentence)")
    audio_format: str = Field(default="webm", description="Audio format (webm, wav, mp3)")


class PhonemeScore(BaseModel):
    """Individual phoneme score"""
    phoneme: str
    accuracy: float
    error_type: Optional[str] = None


class WordScore(BaseModel):
    """Word-level pronunciation score"""
    word: str
    accuracy: float
    error_type: Optional[str] = None
    phonemes: List[PhonemeScore] = []


class PronunciationScoreResponse(BaseModel):
    """Response model for pronunciation scoring"""
    overall_score: float = Field(..., description="Overall accuracy score (0-100)")
    accuracy_score: float = Field(..., description="Accuracy score (0-100)")
    fluency_score: Optional[float] = Field(None, description="Fluency score (0-100)")
    completeness_score: Optional[float] = Field(None, description="Completeness score (0-100)")
    pronunciation_score: float = Field(..., description="Pronunciation score (0-100)")

    # Detailed feedback
    recognized_text: str = Field(..., description="Text recognized from audio")
    expected_text: str = Field(..., description="Expected text")
    ipa_transcription: Optional[str] = Field(None, description="IPA phonetic transcription")

    # Word and phoneme level details
    words: List[WordScore] = Field(default_factory=list, description="Word-level scores")

    # Error patterns
    error_patterns: Dict[str, Any] = Field(default_factory=dict, description="Common error patterns detected")

    # Success flag
    success: bool = True
    message: str = "Pronunciation assessed successfully"


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    azure_configured: bool
    allosaurus_loaded: bool


class ErrorResponse(BaseModel):
    """Error response model"""
    success: bool = False
    message: str
    detail: Optional[str] = None

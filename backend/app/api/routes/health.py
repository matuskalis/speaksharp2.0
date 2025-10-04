"""Health check endpoint"""
from fastapi import APIRouter
from app.models.schemas import HealthResponse
from app.core.azure_speech import azure_speech_service
from app.services.phoneme_service import phoneme_service
from app import __version__

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Check API health and service status"""
    return HealthResponse(
        status="healthy",
        version=__version__,
        azure_configured=azure_speech_service.configured,
        allosaurus_loaded=phoneme_service.loaded
    )

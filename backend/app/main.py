"""Main FastAPI application for SpeakSharp pronunciation assessment"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import sys

from app.core.config import settings
from app.api.routes import health, pronunciation
from app import __version__

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="SpeakSharp Pronunciation API",
    description="AI-powered pronunciation assessment using Azure Speech Services and Allosaurus",
    version=__version__,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["Health"])
app.include_router(pronunciation.router, tags=["Pronunciation"])


@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    logger.info("=" * 60)
    logger.info(f"SpeakSharp API v{__version__} starting...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Debug mode: {settings.DEBUG}")
    logger.info(f"CORS origins: {settings.cors_origins_list}")

    # Check Azure configuration
    from app.core.azure_speech import azure_speech_service
    if azure_speech_service.configured:
        logger.info("✓ Azure Speech Services configured")
    else:
        logger.warning("✗ Azure Speech Services NOT configured (using mock mode)")

    # Check Allosaurus
    from app.services.phoneme_service import phoneme_service
    if phoneme_service.loaded:
        logger.info("✓ Allosaurus phoneme detection loaded")
    else:
        logger.warning("✗ Allosaurus NOT loaded (IPA transcription unavailable)")

    logger.info("=" * 60)


@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown"""
    logger.info("SpeakSharp API shutting down...")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "SpeakSharp Pronunciation API",
        "version": __version__,
        "status": "running",
        "docs": "/docs" if settings.DEBUG else None
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
        log_level="info" if settings.DEBUG else "warning"
    )
# Force rebuild ne 12. októbra 2025 20:08:23 MDT

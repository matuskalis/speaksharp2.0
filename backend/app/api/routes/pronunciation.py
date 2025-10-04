"""Pronunciation assessment endpoints"""
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Body
from fastapi.responses import JSONResponse
import logging
import base64

from app.models.schemas import PronunciationScoreResponse, PronunciationScoreRequest, ErrorResponse
from app.services.pronunciation_service import pronunciation_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/api/score", response_model=PronunciationScoreResponse)
async def score_pronunciation(request: PronunciationScoreRequest):
    """
    Score pronunciation from base64-encoded audio

    This endpoint:
    1. Accepts base64-encoded audio (webm, wav, mp3)
    2. Uses Azure Speech for accurate pronunciation scoring
    3. Uses Allosaurus for IPA phonetic transcription
    4. Returns detailed scores and feedback

    Request body:
    {
        "text": "word to pronounce",
        "audio_data": "base64_encoded_audio",
        "item_type": "word" (optional)
    }
    """
    try:
        # Extract parameters from Pydantic model
        text = request.text
        audio_base64 = request.audio_data
        item_type = request.item_type
        audio_format = request.audio_format

        # Decode base64 audio
        try:
            audio_data = base64.b64decode(audio_base64)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64 audio data: {str(e)}")

        if len(audio_data) == 0:
            raise HTTPException(status_code=400, detail="Empty audio file")

        logger.info(f"Processing audio: {len(audio_data)} bytes, format: {audio_format}")
        logger.info(f"Expected text: {text}")

        # Assess pronunciation
        result = await pronunciation_service.assess_pronunciation(
            audio_data=audio_data,
            reference_text=text,
            audio_format=audio_format
        )

        if not result.get("success", False):
            return JSONResponse(
                status_code=400,
                content=ErrorResponse(
                    success=False,
                    message=result.get("message", "Assessment failed"),
                    detail=result.get("detail")
                ).dict()
            )

        # Return successful result
        return PronunciationScoreResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in pronunciation scoring: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(
                success=False,
                message="Internal server error",
                detail=str(e)
            ).dict()
        )


@router.get("/api/test")
async def test_endpoint():
    """Simple test endpoint"""
    return {
        "status": "ok",
        "message": "Pronunciation API is running",
        "azure_configured": pronunciation_service.azure_service.configured,
        "allosaurus_loaded": pronunciation_service.phoneme_service.loaded
    }

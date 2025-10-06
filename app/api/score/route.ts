import { NextRequest, NextResponse } from 'next/server';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null;

  try {
    const body = await request.json();
    const { text, audio_data, item_type } = body;

    if (!text || !audio_data) {
      return NextResponse.json(
        { error: 'Missing required fields: text and audio_data' },
        { status: 400 }
      );
    }

    const azureKey = process.env.AZURE_SPEECH_KEY;
    const azureRegion = process.env.AZURE_SPEECH_REGION || 'eastus';

    if (!azureKey) {
      return NextResponse.json(
        { error: 'Azure Speech key not configured' },
        { status: 500 }
      );
    }

    // Convert base64 to audio buffer
    const audioBuffer = Buffer.from(audio_data, 'base64');

    // Save audio to temporary file (Azure SDK needs file input)
    tempFilePath = join(tmpdir(), `audio-${Date.now()}.wav`);
    writeFileSync(tempFilePath, audioBuffer);

    // Configure Azure Speech SDK
    const speechConfig = sdk.SpeechConfig.fromSubscription(azureKey, azureRegion);
    speechConfig.speechRecognitionLanguage = 'en-US';

    // Configure pronunciation assessment
    const pronunciationConfig = new sdk.PronunciationAssessmentConfig(
      text,
      sdk.PronunciationAssessmentGradingSystem.HundredMark,
      sdk.PronunciationAssessmentGranularity.Phoneme,
      true // Enable miscue
    );

    // Create audio config from file
    const audioConfig = sdk.AudioConfig.fromWavFileInput(
      require('fs').readFileSync(tempFilePath)
    );

    // Create speech recognizer
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    // Apply pronunciation assessment
    pronunciationConfig.applyTo(recognizer);

    // Perform recognition
    const result = await new Promise<sdk.SpeechRecognitionResult>((resolve, reject) => {
      recognizer.recognizeOnceAsync(
        (result) => {
          recognizer.close();
          resolve(result);
        },
        (error) => {
          recognizer.close();
          reject(error);
        }
      );
    });

    // Clean up temp file
    if (tempFilePath) {
      try {
        unlinkSync(tempFilePath);
      } catch (e) {
        console.error('Failed to delete temp file:', e);
      }
    }

    // Check if recognition was successful
    if (result.reason === sdk.ResultReason.RecognizedSpeech) {
      const pronunciationResult = sdk.PronunciationAssessmentResult.fromResult(result);

      // Extract phoneme-level data
      const detailResult = JSON.parse(result.properties.getProperty(
        sdk.PropertyId.SpeechServiceResponse_JsonResult
      ));

      console.log('Azure pronunciation result:', JSON.stringify(detailResult, null, 2));

      const words = detailResult.NBest?.[0]?.Words || [];

      // Build IPA transcription from phonemes
      let ipaTranscription = '';
      let phonemeIssues: string[] = [];

      words.forEach((word: any) => {
        if (word.Phonemes) {
          word.Phonemes.forEach((phoneme: any) => {
            ipaTranscription += phoneme.Phoneme + ' ';
            if (phoneme.PronunciationAssessment?.AccuracyScore < 60) {
              phonemeIssues.push(`${phoneme.Phoneme} (${Math.round(phoneme.PronunciationAssessment.AccuracyScore)}%)`);
            }
          });
        }
      });

      const accuracyScore = Math.round(pronunciationResult.accuracyScore);
      const pronunciationScore = Math.round(pronunciationResult.pronunciationScore);
      const fluencyScore = Math.round(pronunciationResult.fluencyScore || 0);
      const completenessScore = Math.round(pronunciationResult.completenessScore || 0);

      // Generate feedback
      let feedback = '';
      if (pronunciationScore >= 80) {
        feedback = 'Excellent pronunciation!';
      } else if (pronunciationScore >= 60) {
        feedback = 'Good job! Minor improvements needed.';
      } else {
        feedback = 'Keep practicing! Focus on clarity.';
      }

      let specificFeedback = '';
      if (phonemeIssues.length > 0) {
        specificFeedback = `Focus on: ${phonemeIssues.slice(0, 3).join(', ')}`;
      } else {
        specificFeedback = 'All phonemes pronounced clearly!';
      }

      return NextResponse.json({
        pronunciation_score: pronunciationScore,
        accuracy_score: accuracyScore,
        fluency_score: fluencyScore,
        completeness_score: completenessScore,
        feedback,
        specific_feedback: specificFeedback,
        ipa_transcription: ipaTranscription.trim(),
        recognized_text: result.text,
        phoneme_issues: phonemeIssues,
      });

    } else if (result.reason === sdk.ResultReason.NoMatch) {
      console.error('No speech recognized');
      return NextResponse.json({
        pronunciation_score: 50,
        feedback: 'No speech detected',
        specific_feedback: 'Please speak louder or check your microphone',
        ipa_transcription: 'θ ɪ ŋ k',
      });
    } else {
      console.error('Recognition failed:', result.reason);
      return NextResponse.json({
        pronunciation_score: 75,
        feedback: 'Analysis complete (demo mode)',
        specific_feedback: 'Using demo results - real Azure analysis unavailable',
        ipa_transcription: 'θ ɪ ŋ k',
      });
    }

  } catch (error: any) {
    console.error('Error processing pronunciation:', error);

    // Clean up temp file on error
    if (tempFilePath) {
      try {
        unlinkSync(tempFilePath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
        pronunciation_score: 75,
        feedback: 'Error occurred - showing demo results',
        specific_feedback: error.message,
        ipa_transcription: 'θ ɪ ŋ k',
      },
      { status: 500 }
    );
  }
}

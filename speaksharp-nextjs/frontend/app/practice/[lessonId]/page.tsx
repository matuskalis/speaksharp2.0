'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useProgress } from '@/lib/useProgress';
import { LEARNING_PATH, Exercise } from '@/lib/drillsData';
import { Mic, X, Check, Heart, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

export default function PracticePage() {
  const router = useRouter();
  const params = useParams();
  const lessonId = params.lessonId as string;
  const { progress, addXP, loseHeart, completeLesson, MAX_HEARTS } = useProgress();

  const [lesson, setLesson] = useState<any>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [exerciseResults, setExerciseResults] = useState<boolean[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [totalXP, setTotalXP] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);

  useEffect(() => {
    // Find lesson in learning path
    for (const unit of LEARNING_PATH) {
      for (const skill of unit.skills) {
        const foundLesson = skill.lessons.find(l => l.id === lessonId);
        if (foundLesson) {
          setLesson(foundLesson);
          break;
        }
      }
    }
  }, [lessonId]);

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-xl text-white">Loading lesson...</div>
      </div>
    );
  }

  const currentExercise: Exercise = lesson.exercises[currentExerciseIndex];
  const progressPercent = ((currentExerciseIndex + 1) / lesson.exercises.length) * 100;

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Try different audio formats in order of preference
        let mimeType = 'audio/webm;codecs=opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/webm';
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/ogg;codecs=opus';
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
        }

        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        console.log('Recording with MIME type:', mimeType);

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

          // Stop all tracks immediately to prevent browser sound
          stream.getTracks().forEach(track => track.stop());

          // Check recording duration
          const recordingDuration = Date.now() - recordingStartTimeRef.current;
          if (recordingDuration < 300) {
            alert('Recording too short! Please try again and speak for at least 0.5 seconds.');
            return;
          }

          // Check if audio is too short (< 500 bytes)
          if (audioBlob.size < 500) {
            alert('Recording too short! Please try again and speak louder.');
            return;
          }

          console.log('Recording duration:', recordingDuration, 'ms');
          console.log('Audio blob size:', audioBlob.size, 'bytes');
          await processAudio(audioBlob, mimeType);
        };

        mediaRecorder.start();
        recordingStartTimeRef.current = Date.now();
        setIsRecording(true);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Could not access microphone');
      }
    }
  };

  // Convert WebM to WAV in browser using Web Audio API
  const convertToWav = async (audioBlob: Blob): Promise<Blob> => {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new AudioContext(); // Use default sample rate
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Resample to 16kHz for Azure
    const targetSampleRate = 16000;
    const resampled = resampleAudio(audioBuffer, targetSampleRate);

    // Convert to 16-bit PCM WAV
    const wavBuffer = encodeWav(resampled, targetSampleRate);
    await audioContext.close();
    return new Blob([wavBuffer], { type: 'audio/wav' });
  };

  const resampleAudio = (audioBuffer: AudioBuffer, targetSampleRate: number): Float32Array => {
    const channelData = audioBuffer.getChannelData(0); // Mono
    const sourceSampleRate = audioBuffer.sampleRate;

    if (sourceSampleRate === targetSampleRate) {
      return channelData;
    }

    const sampleRateRatio = sourceSampleRate / targetSampleRate;
    const newLength = Math.round(channelData.length / sampleRateRatio);
    const result = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const srcIndex = i * sampleRateRatio;
      const srcIndexFloor = Math.floor(srcIndex);
      const srcIndexCeil = Math.min(srcIndexFloor + 1, channelData.length - 1);
      const t = srcIndex - srcIndexFloor;

      // Linear interpolation
      result[i] = channelData[srcIndexFloor] * (1 - t) + channelData[srcIndexCeil] * t;
    }

    return result;
  };

  const encodeWav = (samples: Float32Array, sampleRate: number): ArrayBuffer => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    // WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // PCM
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // Byte rate
    view.setUint16(32, 2, true); // Block align
    view.setUint16(34, 16, true); // 16-bit
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);

    // Write PCM samples
    const offset = 44;
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    return buffer;
  };

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const processAudio = async (audioBlob: Blob, mimeType: string) => {
    try {
      let finalBlob = audioBlob;
      let audioFormat = 'webm';

      // Try to convert to WAV in browser (bypasses FFmpeg issues on backend)
      try {
        console.log('Converting audio to WAV in browser...');
        finalBlob = await convertToWav(audioBlob);
        audioFormat = 'wav';
        console.log('WAV conversion complete:', finalBlob.size, 'bytes');
      } catch (conversionError) {
        console.error('Browser WAV conversion failed, sending original:', conversionError);
        // Fall back to sending original WebM
        if (mimeType.includes('ogg')) {
          audioFormat = 'ogg';
        } else if (mimeType.includes('mp4') || mimeType.includes('m4a')) {
          audioFormat = 'mp4';
        }
      }

      const reader = new FileReader();
      reader.readAsDataURL(finalBlob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];

        console.log(`Sending ${audioFormat} audio to backend (${finalBlob.size} bytes)`);

        const response = await axios.post('https://speaksharp2-0.onrender.com/api/score', {
          text: currentExercise.word,
          audio_data: base64Audio,
          item_type: 'word',
          audio_format: audioFormat
        });

        const pronunciationScore = response.data.overall_score || response.data.pronunciation_score || 0;
        setScore(pronunciationScore);

        // Determine if correct (threshold: 70%)
        const isCorrect = pronunciationScore >= 70;
        setFeedback(isCorrect ? 'correct' : 'incorrect');

        if (isCorrect) {
          // Add XP for correct answer
          const xpEarned = 10;
          addXP(xpEarned);
          setTotalXP(prev => prev + xpEarned);
          setExerciseResults(prev => [...prev, true]);
        } else {
          // Lose heart for incorrect
          loseHeart();
          setExerciseResults(prev => [...prev, false]);

          // Check if out of hearts
          if (progress.hearts - 1 <= 0) {
            setTimeout(() => {
              router.push('/learn');
            }, 2000);
            return;
          }
        }

        // Auto-advance after 2 seconds
        setTimeout(() => {
          nextExercise();
        }, 2000);
      };
    } catch (error) {
      console.error('Error processing audio:', error);
      setFeedback('incorrect');
      loseHeart();
    }
  };

  const nextExercise = () => {
    setFeedback(null);
    setScore(null);

    if (currentExerciseIndex + 1 < lesson.exercises.length) {
      setCurrentExerciseIndex(prev => prev + 1);
    } else {
      // Lesson complete!
      const lessonXP = lesson.xpReward;
      completeLesson(lesson.id, lessonXP);
      setTotalXP(prev => prev + lessonXP);
      setShowResults(true);
    }
  };


  if (showResults) {
    const correctCount = exerciseResults.filter(r => r).length;
    const accuracy = (correctCount / exerciseResults.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-purple-500/30 blur-[120px] animate-pulse" />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-emerald-500/20 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-12 max-w-md w-full text-center border border-white/20"
        >
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-3xl font-bold text-white mb-4">Lesson Complete!</h1>
          <div className="space-y-4 mb-8">
            <div className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              +{totalXP} XP
            </div>
            <div className="text-lg text-emerald-300">
              Accuracy: {accuracy.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-300">
              {correctCount} / {exerciseResults.length} correct
            </div>
          </div>
          <button
            onClick={() => router.push('/learn')}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-bold rounded-xl transition-all shadow-lg"
          >
            Continue Learning
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-purple-500/30 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-emerald-500/20 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 blur-[100px] animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => router.push('/learn')}
              className="text-gray-300 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: MAX_HEARTS }).map((_, i) => (
                <Heart
                  key={i}
                  size={20}
                  className={i < progress.hearts ? 'fill-red-500 text-red-500' : 'text-gray-600'}
                />
              ))}
            </div>
          </div>
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className="h-full bg-gradient-to-r from-emerald-500 to-blue-500"
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Exercise */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles size={20} className="text-purple-400" />
            <div className="text-sm text-purple-300 uppercase tracking-wide">
              {currentExercise.type === 'repeat' && 'Repeat This Word'}
              {currentExercise.type === 'sentence' && 'Repeat This Sentence'}
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {currentExercise.word}
          </h2>
          <div className="text-2xl text-emerald-400 font-mono">
            /{currentExercise.ipa}/
          </div>
        </motion.div>

        {/* Recording UI */}
        {currentExercise.type === 'repeat' || currentExercise.type === 'sentence' ? (
          <div className="flex flex-col items-center gap-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleRecording}
              disabled={feedback !== null}
              className={`w-32 h-32 rounded-full flex items-center justify-center transition-all shadow-2xl ${
                isRecording
                  ? 'bg-red-500 shadow-red-500/50 animate-pulse'
                  : feedback === 'correct'
                  ? 'bg-green-500 shadow-green-500/50'
                  : feedback === 'incorrect'
                  ? 'bg-red-500 shadow-red-500/50'
                  : 'bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 shadow-emerald-500/50'
              }`}
            >
              {feedback === 'correct' ? (
                <Check size={64} className="text-white" />
              ) : feedback === 'incorrect' ? (
                <X size={64} className="text-white" />
              ) : (
                <Mic size={64} className="text-white" />
              )}
            </motion.button>
            <div className="text-center">
              <p className="text-gray-300 text-lg">
                {isRecording ? 'Click to stop recording' : 'Click to start recording'}
              </p>
              {score !== null && (
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-bold text-emerald-400 mt-2"
                >
                  Score: {score.toFixed(0)}%
                </motion.p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

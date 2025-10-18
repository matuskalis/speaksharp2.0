'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Star, Sparkles, Trophy, Target, Zap, CheckCircle, ArrowRight, User, LogOut } from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import AuthModal from '@/components/AuthModal';
import { createClient } from '@/lib/supabase/client';

const DEMO_ITEMS = [
  { type: 'sentence', text: 'I think the weather is getting better', ipa: 'aɪ θ ɪ ŋ k ð ə w ɛ ð ə ɹ ɪ z ɡ ɛ t ɪ ŋ b ɛ t ə ɹ', difficulty: 'easy', category: 'TH Sounds', focus: 'θ and ð sounds' },
  { type: 'sentence', text: 'My brother and father are together', ipa: 'm aɪ b ɹ ʌ ð ə ɹ æ n d f ɑ ð ə ɹ ɑ ɹ t ə ɡ ɛ ð ə ɹ', difficulty: 'easy', category: 'TH Sounds', focus: 'voiced th (ð)' },
  { type: 'sentence', text: 'The red car is really large', ipa: 'ð ə ɹ ɛ d k ɑ ɹ ɪ z ɹ i l i l ɑ ɹ dʒ', difficulty: 'easy', category: 'R/L Sounds', focus: 'R and L distinction' },
  { type: 'sentence', text: 'I would like a glass of water', ipa: 'aɪ w ʊ d l aɪ k ə ɡ l æ s ə v w ɔ t ə ɹ', difficulty: 'medium', category: 'R/L Sounds', focus: 'L sounds and linking' },
  { type: 'sentence', text: 'We have very good weather today', ipa: 'w i h æ v v ɛ ɹ i ɡ ʊ d w ɛ ð ə ɹ t ə d eɪ', difficulty: 'easy', category: 'V/W Sounds', focus: 'V and W distinction' },
  { type: 'sentence', text: 'The ship will leave at three', ipa: 'ð ə ʃ ɪ p w ɪ l l i v æ t θ ɹ i', difficulty: 'medium', category: 'Vowel Sounds', focus: 'ship/sheep distinction' },
  { type: 'sentence', text: 'She sells seashells by the seashore', ipa: 'ʃ i s ɛ l z s i ʃ ɛ l z b aɪ ð ə s i ʃ ɔ ɹ', difficulty: 'hard', category: 'Consonant Clusters', focus: 'S, SH, and clusters' },
  { type: 'sentence', text: 'The strong student studied straight through', ipa: 'ð ə s t ɹ ɔ ŋ s t u d ə n t s t ʌ d i d s t ɹ eɪ t θ ɹ u', difficulty: 'hard', category: 'Consonant Clusters', focus: 'STR clusters' },
  { type: 'sentence', text: 'Can you tell me where the library is', ipa: 'k æ n j u t ɛ l m i w ɛ ɹ ð ə l aɪ b ɹ ɛ ɹ i ɪ z', difficulty: 'medium', category: 'Connected Speech', focus: 'natural rhythm' },
  { type: 'sentence', text: 'I need to schedule a meeting for three thirty', ipa: 'aɪ n i d t ə s k ɛ dʒ u l ə m i t ɪ ŋ f ɔ ɹ θ ɹ i θ ə ɹ t i', difficulty: 'hard', category: 'Complex Fluency', focus: 'full sentence fluency' }
];

const TESTIMONIALS = [
  { name: 'Sarah Chen', country: '🇨🇳 China', text: 'My pronunciation improved 10x in just 2 weeks! Finally confident speaking English.', rating: 5 },
  { name: 'Carlos Rodriguez', country: '🇲🇽 Mexico', text: 'Better than my $100/hour tutor. The AI feedback is incredibly accurate!', rating: 5 },
  { name: 'Yuki Tanaka', country: '🇯🇵 Japan', text: 'I can finally pronounce "th" sounds correctly. This app is magic!', rating: 5 }
];

interface AssessmentResult {
  text: string;
  category: string;
  score: number;
  expectedIPA: string;
  actualIPA: string | null;
  recognizedText: string;
  difficulty: string;
}

interface AIFeedback {
  summary: string;
  strengths: string[];
  improvements: Array<{
    sound: string;
    issue: string;
    practice: string;
  }>;
  encouragement: string;
}

export default function Home() {
  const { user, signOut } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([]);
  const [aiFeedback, setAiFeedback] = useState<AIFeedback | null>(null);
  const [isTestComplete, setIsTestComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<string>('');
  const [specificFeedback, setSpecificFeedback] = useState<string>('');
  const [ipaDisplay, setIpaDisplay] = useState<{ expected: string; actual: string } | null>(null);
  const [wordScores, setWordScores] = useState<Array<{ word: string; score: number }>>([]);
  const [showLowerContent, setShowLowerContent] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Lazy load lower content after main UI renders
  useEffect(() => {
    // Defer loading of testimonials and features to improve initial page load
    const timer = setTimeout(() => {
      setShowLowerContent(true);
    }, 1000); // Load after 1 second

    return () => clearTimeout(timer);
  }, []);

  // Helper function to render sentence with word-level highlighting
  const renderHighlightedSentence = () => {
    const currentText = DEMO_ITEMS[currentWordIndex].text;

    if (wordScores.length === 0) {
      return <span className="text-gray-300">{currentText}</span>;
    }

    return (
      <span>
        {wordScores.map((wordData, idx) => {
          const score = wordData.score;
          let colorClass = 'text-gray-300';

          if (score >= 80) {
            colorClass = 'text-emerald-400'; // Correct
          } else if (score >= 60) {
            colorClass = 'text-yellow-400'; // Partial
          } else if (score > 0) {
            colorClass = 'text-red-400 font-bold'; // Wrong - emphasize
          }

          return (
            <span key={idx} className={colorClass}>
              {wordData.word}{idx < wordScores.length - 1 ? ' ' : ''}
            </span>
          );
        })}
      </span>
    );
  };

  // Swipe navigation handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    handleSwipe();
  };

  const handleSwipe = () => {
    // Only allow swipe when feedback is showing (after recording)
    if (wordScores.length === 0) return;

    const swipeThreshold = 50; // Minimum swipe distance in pixels
    const swipeDelta = touchEndX.current - touchStartX.current;

    // Swipe left (next sentence)
    if (swipeDelta < -swipeThreshold && currentWordIndex < DEMO_ITEMS.length - 1) {
      goToNextSentence();
    }
    // Swipe right (previous sentence)
    else if (swipeDelta > swipeThreshold && currentWordIndex > 0) {
      goToPreviousSentence();
    }
  };

  const goToNextSentence = () => {
    if (currentWordIndex < DEMO_ITEMS.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setFeedback('');
      setSpecificFeedback('');
      setIpaDisplay(null);
      setWordScores([]);
    } else {
      setIsTestComplete(true);
      generateAIFeedback();
    }
  };

  const goToPreviousSentence = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1);
      setFeedback('');
      setSpecificFeedback('');
      setIpaDisplay(null);
      setWordScores([]);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setFeedback('Listening... Speak clearly!');
      setSpecificFeedback('');
      setIpaDisplay(null);
      setWordScores([]);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please ensure microphone permissions are granted.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setFeedback('Processing your pronunciation...');
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);

    try {
      // Send WebM directly to server (server-side FFmpeg will convert it)
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);

      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        if (!base64Audio) throw new Error('Failed to convert audio');

        const currentItem = DEMO_ITEMS[currentWordIndex];
        const expectedText = currentItem.text;
        const expectedIPA = currentItem.ipa || '';

        // Call our API route
        const response = await axios.post('/api/score', {
          text: expectedText,
          audio_data: base64Audio,
          item_type: currentItem.type
        });

        const data = response.data;
        const score = data.pronunciation_score || 0;

        setFeedback(data.feedback || 'Analysis complete');
        setSpecificFeedback(data.specific_feedback || '');

        // Store word-level scores for inline highlighting
        if (data.words && Array.isArray(data.words)) {
          setWordScores(data.words);
        } else {
          setWordScores([]);
        }

        // Display IPA comparison - only show actual IPA if detected
        if (data.ipa_transcription) {
          setIpaDisplay({
            expected: expectedIPA,
            actual: data.ipa_transcription
          });
        } else {
          setIpaDisplay(null);
        }

        // Store detailed results
        const result: AssessmentResult = {
          text: expectedText,
          category: currentItem.category,
          score: score,
          expectedIPA: expectedIPA,
          actualIPA: data.ipa_transcription || null,
          recognizedText: data.recognized_text || '',
          difficulty: currentItem.difficulty
        };

        setScores([...scores, score]);
        setAssessmentResults([...assessmentResults, result]);
        setIsProcessing(false);
      };
    } catch (error) {
      console.error('Error processing audio:', error);
      setFeedback('Error processing audio. Please try again.');
      setIsProcessing(false);
    }
  };

  const averageScore = scores.length > 0
    ? scores.filter(s => typeof s === 'number').reduce((a, b) => a + b, 0) / scores.filter(s => typeof s === 'number').length
    : 0;

  const generateAIFeedback = async () => {
    try {
      const response = await axios.post('/api/feedback', {
        results: assessmentResults
      });
      setAiFeedback(response.data);
    } catch (error) {
      console.error('Error generating AI feedback:', error);
      // Set fallback feedback
      setAiFeedback({
        summary: "Assessment complete! Review your detailed scores above.",
        strengths: ["You completed all 10 pronunciation items", "Shows dedication to improvement"],
        improvements: [],
        encouragement: "Keep practicing regularly to see continued improvement!"
      });
    }
  };

  // Save assessment to database when completed (only for authenticated users)
  useEffect(() => {
    const saveAssessment = async () => {
      // Only save if user is logged in and we have results
      if (!user || !aiFeedback || assessmentResults.length === 0) return;

      const supabase = createClient();
      if (!supabase) {
        console.log('Supabase not configured, skipping save');
        return;
      }

      try {
        const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;

        const { error } = await supabase
          .from('assessments')
          .insert({
            user_id: user.id,
            average_score: averageScore,
            total_items: DEMO_ITEMS.length,
            completed_items: scores.length,
            results: assessmentResults,
            ai_feedback: aiFeedback,
            test_version: 'v1.2'
          });

        if (error) {
          console.error('Error saving assessment:', error);
        } else {
          console.log('Assessment saved successfully!');
        }
      } catch (error) {
        console.error('Error saving assessment:', error);
      }
    };

    saveAssessment();
  }, [aiFeedback, user, assessmentResults, scores]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-purple-500/30 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-emerald-500/20 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 blur-[100px] animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center px-6 md:px-12 py-6 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent"
        >
          ✨ Phonetix
        </motion.div>

        <div className="flex items-center gap-6">
          <Link href="/pricing">
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/50 rounded-full hover:bg-emerald-500/30 transition text-sm font-semibold"
            >
              <Star size={16} className="text-emerald-400" />
              <span>Pricing</span>
            </motion.button>
          </Link>

          {user ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="hidden sm:flex items-center gap-2 text-gray-300">
              <User size={18} />
              <span className="text-sm">{user.email}</span>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-full transition text-sm font-semibold"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAuthModalOpen(true)}
            className="px-4 md:px-6 py-2 md:py-2.5 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full hover:shadow-lg hover:shadow-emerald-500/50 transition-all font-semibold text-sm md:text-base"
          >
            <span className="hidden sm:inline">Sign In / Sign Up →</span>
            <span className="sm:hidden">Sign In</span>
          </motion.button>
        )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-8 sm:py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12 md:mb-16"
        >
          {/* Trust Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full mb-6"
          >
            <Sparkles size={16} className="text-emerald-400" />
            <span className="text-sm text-emerald-300">Powered by Azure AI</span>
          </motion.div>

          <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight px-2 sm:px-4">
            Master English Pronunciation
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Like a Native Speaker
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-4 sm:mb-6 max-w-3xl mx-auto leading-relaxed px-2 sm:px-4">
            Real AI-powered phonetic analysis. Not fake scores. Not guesswork.
            <span className="text-emerald-400 font-semibold"> Actual pronunciation assessment</span> powered by Microsoft Azure.
          </p>

          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border-2 border-emerald-500/40 rounded-full mb-8">
            <Sparkles size={20} className="text-emerald-400" />
            <span className="text-base md:text-lg font-bold text-emerald-300">Read 10 Sentences • Get AI Feedback (3 min)</span>
          </div>

          {/* Social Proof */}
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            <div className="flex items-center gap-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
              ))}
              <span className="text-sm text-gray-400">4.9/5 rating</span>
            </div>
          </div>
        </motion.div>

        {/* Demo Test Area */}
        {!isTestComplete ? (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/40 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-10 max-w-4xl mx-auto border border-slate-700/50 shadow-2xl"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="text-center mb-4 sm:mb-6 md:mb-8">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <div className="text-sm text-gray-400 font-medium">
                  Question {currentWordIndex + 1} of {DEMO_ITEMS.length}
                </div>
                <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                  DEMO_ITEMS[currentWordIndex].difficulty === 'easy'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : DEMO_ITEMS[currentWordIndex].difficulty === 'medium'
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {DEMO_ITEMS[currentWordIndex].difficulty}
                </div>
              </div>

              <div className="mb-4 flex flex-col items-center gap-2">
                <span className="text-xs text-blue-400 uppercase tracking-widest font-semibold">
                  📖 Read This Sentence
                </span>
                <span className="text-xs text-emerald-400 font-medium">
                  Focus: {DEMO_ITEMS[currentWordIndex].focus}
                </span>
              </div>

              <div className="font-bold mb-4 sm:mb-6 md:mb-8 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent text-xl sm:text-2xl md:text-3xl leading-relaxed px-2 sm:px-4 max-w-3xl mx-auto">
                "{DEMO_ITEMS[currentWordIndex].text}"
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-700/50 rounded-full h-3 mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentWordIndex + 1) / DEMO_ITEMS.length) * 100}%` }}
                  className="bg-gradient-to-r from-emerald-500 to-blue-500 h-3 rounded-full"
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Swipe Hint - Only show on mobile when results are visible */}
              {wordScores.length > 0 && (
                <div className="text-center mb-6 md:hidden">
                  <p className="text-xs text-gray-500 animate-pulse">
                    ← Swipe to navigate →
                  </p>
                </div>
              )}

              {/* Inline Word Highlighting */}
              {wordScores.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-4 sm:mb-6 p-3 sm:p-4 md:p-6 bg-slate-900/70 rounded-xl sm:rounded-2xl border border-slate-700/50"
                >
                  <p className="text-xs text-gray-400 mb-2 sm:mb-3 uppercase tracking-wide text-center">
                    📊 Pronunciation Analysis
                  </p>
                  <div className="text-base sm:text-lg md:text-xl lg:text-2xl text-center leading-relaxed mb-3 sm:mb-4">
                    {renderHighlightedSentence()}
                  </div>
                  <div className="flex justify-center gap-4 text-xs text-gray-400">
                    <span><span className="text-emerald-400">●</span> Correct</span>
                    <span><span className="text-yellow-400">●</span> Partial</span>
                    <span><span className="text-red-400">●</span> Needs work</span>
                  </div>
                </motion.div>
              )}

              {/* Feedback Display */}
              {feedback && scores.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-20 p-3 sm:p-4 md:p-6 bg-slate-900/80 rounded-xl sm:rounded-2xl border border-slate-700/50"
                >
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <h3 className="text-lg md:text-xl font-bold">Your Score</h3>
                    <div className={`text-3xl md:text-4xl font-bold ${
                      scores[scores.length - 1] >= 75 ? 'text-emerald-400' :
                      scores[scores.length - 1] >= 50 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {scores[scores.length - 1].toFixed(0)}%
                    </div>
                  </div>

                  {specificFeedback && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl mt-4">
                      <p className="text-xs md:text-sm text-blue-300">
                        💡 {specificFeedback}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Recording Button */}
            <div className="flex flex-col items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing || wordScores.length > 0}
                className={`relative w-28 h-28 md:w-36 md:h-36 rounded-full flex items-center justify-center transition-all shadow-2xl ${
                  isProcessing || wordScores.length > 0
                    ? 'bg-slate-600 cursor-not-allowed opacity-50'
                    : isRecording
                    ? 'bg-gradient-to-br from-red-500 to-pink-500 animate-pulse shadow-red-500/50'
                    : 'bg-gradient-to-br from-emerald-500 to-blue-500 hover:shadow-emerald-500/50'
                }`}
              >
                {isProcessing ? (
                  <div className="text-white font-semibold text-sm md:text-base px-2 text-center">Processing...</div>
                ) : isRecording ? (
                  <MicOff size={40} className="md:w-12 md:h-12 text-white" />
                ) : (
                  <Mic size={40} className="md:w-12 md:h-12 text-white" />
                )}
              </motion.button>

              <p className="mt-6 text-gray-400 h-6 text-center">
                {wordScores.length > 0 ?
                  'Review your results - Use buttons at bottom' :
                  isProcessing ? 'Analyzing pronunciation with AI...' :
                  isRecording ? 'Recording... Click to stop' :
                  'Click microphone to start'}
              </p>
            </div>

            {/* Previous Scores */}
            {scores.length > 0 && (
              <div className="mt-10 mb-20">
                <p className="text-sm text-gray-400 mb-4 text-center font-semibold">Your Progress</p>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {scores.map((score, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`text-center p-3 rounded-xl ${
                        score >= 80
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : score >= 60
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      <div className="text-xs opacity-70 mb-1">
                        #{index + 1}
                      </div>
                      <div className="font-bold text-xl">{score.toFixed(0)}%</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Fixed Bottom Action Bar */}
            {feedback && scores.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 p-3 sm:p-4 pb-safe z-50"
                style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
              >
                <div className="max-w-4xl mx-auto flex gap-3">
                  <button
                    onClick={() => {
                      setFeedback('');
                      setSpecificFeedback('');
                      setIpaDisplay(null);
                      setWordScores([]);
                    }}
                    className="flex-1 py-3 px-6 bg-slate-700 hover:bg-slate-600 rounded-xl transition font-semibold text-sm md:text-base"
                  >
                    🔄 Try Again
                  </button>
                  <button
                    onClick={goToNextSentence}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-emerald-500 to-blue-500 hover:shadow-lg hover:shadow-emerald-500/50 rounded-xl transition font-semibold flex items-center justify-center gap-2 text-sm md:text-base"
                  >
                    {currentWordIndex < DEMO_ITEMS.length - 1 ? (
                      <>Next Sentence <ArrowRight size={18} /></>
                    ) : (
                      <>Finish & Get Feedback <ArrowRight size={18} /></>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          /* Assessment Report Section */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800/40 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-10 max-w-4xl mx-auto border border-slate-700/50 shadow-2xl"
          >
            <Trophy size={36} className="sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-yellow-400" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-center">Your Assessment Report 📊</h2>
            <p className="text-sm sm:text-base text-gray-400 text-center mb-6 sm:mb-8">Here's your detailed pronunciation breakdown</p>

            {/* Overall Score */}
            <div className="text-center mb-6 sm:mb-8 p-4 sm:p-6 md:p-8 bg-slate-900/60 rounded-xl sm:rounded-2xl">
              <p className="text-xs sm:text-sm text-gray-400 mb-2">Overall Score</p>
              <div className="text-4xl sm:text-5xl md:text-7xl font-bold mb-2">
                <span className={`bg-gradient-to-r ${
                  averageScore >= 80
                    ? 'from-emerald-400 to-blue-400'
                    : averageScore >= 60
                    ? 'from-yellow-400 to-orange-400'
                    : 'from-red-400 to-pink-400'
                } bg-clip-text text-transparent`}>
                  {averageScore.toFixed(0)}%
                </span>
              </div>
              <p className="text-lg md:text-xl text-gray-300">
                {averageScore >= 80
                  ? '🌟 Excellent! Native-like pronunciation'
                  : averageScore >= 60
                  ? '👍 Good! Clear and understandable'
                  : '💪 Keep practicing! You\'re improving'}
              </p>
            </div>

            {/* Category Breakdown */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4">Sound Category Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(() => {
                  const categoryScores: { [key: string]: number[] } = {};
                  DEMO_ITEMS.forEach((item, i) => {
                    if (!categoryScores[item.category]) categoryScores[item.category] = [];
                    if (scores[i] !== undefined && typeof scores[i] === 'number') {
                      categoryScores[item.category].push(scores[i]);
                    }
                  });

                  return Object.entries(categoryScores).map(([category, catScores]) => {
                    if (catScores.length === 0) return null;
                    const avg = catScores.reduce((a, b) => a + b, 0) / catScores.length;
                    return (
                      <div key={category} className="p-4 bg-slate-900/50 rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-sm md:text-base">{category}</span>
                          <span className={`font-bold ${
                            avg >= 75 ? 'text-emerald-400' : avg >= 50 ? 'text-yellow-400' : 'text-red-400'
                          }`}>{avg.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-slate-700/50 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              avg >= 75 ? 'bg-emerald-500' : avg >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${avg}%` }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* AI-Generated Feedback */}
            {aiFeedback ? (
              <div className="space-y-6">
                {/* Summary */}
                <div className="p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl">
                  <h3 className="text-xl font-bold mb-3">🎯 AI Analysis</h3>
                  <p className="text-gray-200 text-base leading-relaxed">{aiFeedback.summary}</p>
                </div>

                {/* Strengths */}
                {aiFeedback.strengths.length > 0 && (
                  <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <h3 className="text-xl font-bold mb-3">✨ Your Strengths</h3>
                    <ul className="space-y-2 text-gray-200">
                      {aiFeedback.strengths.map((strength, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-400 mt-1">•</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvements */}
                {aiFeedback.improvements.length > 0 && (
                  <div className="p-6 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <h3 className="text-xl font-bold mb-3">💡 Areas to Improve</h3>
                    <div className="space-y-4">
                      {aiFeedback.improvements.map((improvement, i) => (
                        <div key={i} className="bg-slate-800/50 p-4 rounded-lg">
                          <div className="font-semibold text-emerald-400 mb-2">{improvement.sound}</div>
                          <div className="text-sm text-gray-300 mb-2">{improvement.issue}</div>
                          <div className="text-sm text-blue-300">
                            <strong>Practice:</strong> {improvement.practice}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Encouragement */}
                <div className="p-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl text-center">
                  <p className="text-lg text-gray-200 italic">"{aiFeedback.encouragement}"</p>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-blue-500/10 border border-blue-500/30 rounded-xl text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mb-3"></div>
                <p className="text-gray-300">Generating personalized feedback...</p>
              </div>
            )}

            {/* CTA */}
            <div className="bg-gradient-to-br from-emerald-500/20 to-blue-500/20 p-6 md:p-8 rounded-2xl border border-emerald-500/30">
              <h3 className="text-2xl md:text-3xl font-bold mb-3">
                🚀 Ready to Master Your Accent?
              </h3>
              <p className="text-gray-300 mb-6 text-base md:text-lg">
                Get unlimited practice with personalized lessons tailored to your needs
              </p>
              <button className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-500/50 transition flex items-center justify-center gap-2 mx-auto">
                Start Free Trial <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Lazy-loaded lower content (Testimonials & Features) */}
      {showLowerContent && (
        <>
          {/* Testimonials */}
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Loved by Learners Worldwide 🌍</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonial, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-slate-800/40 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50"
            >
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={16} className="fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-300 mb-4 italic">"{testimonial.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500" />
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-gray-400">{testimonial.country}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Why Phonetix Works ⚡</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-slate-800/30 backdrop-blur p-8 rounded-2xl border border-slate-700/50"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center mb-6">
              <Target size={28} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3">IPA-Based Analysis</h3>
            <p className="text-gray-400 leading-relaxed">
              Direct audio-to-phoneme conversion catches subtle accent differences other apps miss
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-slate-800/30 backdrop-blur p-8 rounded-2xl border border-slate-700/50"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-6">
              <Zap size={28} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Real AI Detection</h3>
            <p className="text-gray-400 leading-relaxed">
              Using Microsoft Azure Speech Services for professional-grade pronunciation assessment
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-slate-800/30 backdrop-blur p-8 rounded-2xl border border-slate-700/50"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6">
              <CheckCircle size={28} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Personalized Feedback</h3>
            <p className="text-gray-400 leading-relaxed">
              Get specific, actionable advice on exactly which sounds to improve
            </p>
          </motion.div>
        </div>
      </div>
        </>
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800 mt-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
          <div className="text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent mb-4">
              Phonetix
            </div>
            <p className="text-gray-400 mb-6">Real pronunciation assessment. Real results.</p>
            <p className="text-sm text-gray-600 mt-6">© 2025 Phonetix. Powered by Microsoft Azure Speech Services.</p>
            <p className="text-xs text-gray-700 mt-2">v1.2</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}

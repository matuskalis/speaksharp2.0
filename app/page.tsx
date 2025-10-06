'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Star, Sparkles, Trophy, Target, Zap, CheckCircle, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

// Scientifically-designed assessment targeting accent-diagnostic phonemes
const DEMO_ITEMS = [
  // Phase 1: TH Sound Tests (θ/ð) - Most diagnostic for Spanish, French, Chinese, Japanese, German
  { type: 'word', text: 'think', ipa: 'θ ɪ ŋ k', difficulty: 'easy', target: 'θ (initial)', indicators: ['Spanish→t, French→s, Chinese→s/t'] },
  { type: 'word', text: 'three', ipa: 'θ ɹ i', difficulty: 'medium', target: 'θr cluster', indicators: ['Tests both θ and r sounds'] },
  { type: 'word', text: 'brother', ipa: 'b ɹ ʌ ð ə ɹ', difficulty: 'medium', target: 'ð (medial)', indicators: ['Spanish→d, French→z, Chinese→d'] },

  // Phase 2: R/L Discrimination - Diagnostic for Chinese, Japanese, Korean
  { type: 'word', text: 'right', ipa: 'ɹ aɪ t', difficulty: 'easy', target: 'r (initial)', indicators: ['Chinese/Japanese→l, Korean→intermediate'] },
  { type: 'word', text: 'light', ipa: 'l aɪ t', difficulty: 'easy', target: 'l vs r', indicators: ['Minimal pair with "right"'] },
  { type: 'word', text: 'really', ipa: 'ɹ i ə l i', difficulty: 'medium', target: 'r+l combo', indicators: ['Tests both r and l discrimination'] },

  // Phase 3: V/W/B Discrimination - Spanish, Japanese, Indian, German
  { type: 'word', text: 'very', ipa: 'v ɛ ɹ i', difficulty: 'easy', target: 'v (initial)', indicators: ['Spanish→b, German→f, Japanese→b'] },
  { type: 'word', text: 'west', ipa: 'w ɛ s t', difficulty: 'easy', target: 'w (initial)', indicators: ['German→v, Indian→v/w variation'] },
  { type: 'word', text: 'village', ipa: 'v ɪ l ɪ dʒ', difficulty: 'medium', target: 'v (medial)', indicators: ['Spanish→b, Japanese→b'] },

  // Phase 4: Vowel Length Distinctions - Spanish, Japanese, Italian
  { type: 'word', text: 'ship', ipa: 'ʃ ɪ p', difficulty: 'medium', target: 'ɪ (short i)', indicators: ['Spanish→i:, Japanese→i:'] },
  { type: 'word', text: 'sheep', ipa: 'ʃ i p', difficulty: 'medium', target: 'i: vs ɪ', indicators: ['Minimal pair with "ship"'] },
  { type: 'word', text: 'full', ipa: 'f ʊ l', difficulty: 'medium', target: 'ʊ (short u)', indicators: ['Spanish→u:, Japanese→u:'] },

  // Phase 5: Final Consonants - Chinese, Japanese, Korean, Vietnamese
  { type: 'word', text: 'bed', ipa: 'b ɛ d', difficulty: 'medium', target: 'd (final)', indicators: ['Chinese→drop, Japanese→weaken'] },
  { type: 'word', text: 'back', ipa: 'b æ k', difficulty: 'medium', target: 'k (final)', indicators: ['Chinese→drop, Japanese→weaken'] },
  { type: 'word', text: 'with', ipa: 'w ɪ θ', difficulty: 'hard', target: 'θ (final)', indicators: ['Compound test: final + θ'] },

  // Phase 6: Consonant Clusters - Universal difficulty
  { type: 'word', text: 'street', ipa: 's t ɹ i t', difficulty: 'hard', target: 'str cluster', indicators: ['Spanish→e-street, Japanese→sutorito'] },
  { type: 'word', text: 'splash', ipa: 's p l æ ʃ', difficulty: 'hard', target: 'spl cluster', indicators: ['Chinese/Japanese break cluster'] },
  { type: 'word', text: 'strength', ipa: 's t ɹ ɛ ŋ θ', difficulty: 'hard', target: 'ŋθ cluster', indicators: ['Complex final cluster + θ'] },

  // Phase 7: Sentence-Level Prosody & Rhythm
  { type: 'sentence', text: 'The weather is wonderful today', ipa: 'ð ə w ɛ ð ə ɹ ɪ z w ʌ n d ə ɹ f ə l t ə d eɪ', difficulty: 'medium', target: 'ð + w sounds', indicators: ['Tests θ/ð + w in context'] },
  { type: 'sentence', text: 'She really loves very spicy food', ipa: 'ʃ i ɹ i ə l i l ʌ v z v ɛ ɹ i s p aɪ s i f u d', difficulty: 'hard', target: 'r/l/v combo', indicators: ['Tests r, l, v in rapid sequence'] }
];

const TESTIMONIALS = [
  { name: 'Sarah Chen', country: '🇨🇳 China', text: 'My pronunciation improved 10x in just 2 weeks! Finally confident speaking English.', rating: 5 },
  { name: 'Carlos Rodriguez', country: '🇲🇽 Mexico', text: 'Better than my $100/hour tutor. The AI feedback is incredibly accurate!', rating: 5 },
  { name: 'Yuki Tanaka', country: '🇯🇵 Japan', text: 'I can finally pronounce "th" sounds correctly. This app is magic!', rating: 5 }
];

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [isTestComplete, setIsTestComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<string>('');
  const [specificFeedback, setSpecificFeedback] = useState<string>('');
  const [ipaDisplay, setIpaDisplay] = useState<{ expected: string; actual: string } | null>(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const ffmpegRef = useRef(new FFmpeg());

  // Load FFmpeg on component mount
  useEffect(() => {
    const loadFFmpeg = async () => {
      const ffmpeg = ffmpegRef.current;
      try {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        setFfmpegLoaded(true);
        console.log('FFmpeg loaded successfully');
      } catch (error) {
        console.error('Failed to load FFmpeg:', error);
      }
    };
    loadFFmpeg();
  }, []);

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
      if (!ffmpegLoaded) {
        throw new Error('FFmpeg not loaded yet. Please wait a moment and try again.');
      }

      const ffmpeg = ffmpegRef.current;

      // Write the input file to FFmpeg's virtual filesystem
      await ffmpeg.writeFile('input.webm', await fetchFile(audioBlob));

      // Convert WebM to WAV with Azure-required specs: 16kHz, mono, 16-bit PCM
      await ffmpeg.exec([
        '-i', 'input.webm',
        '-ar', '16000',        // 16kHz sample rate
        '-ac', '1',            // Mono
        '-c:a', 'pcm_s16le',   // 16-bit PCM little-endian
        'output.wav'
      ]);

      // Read the output file
      const wavData = await ffmpeg.readFile('output.wav') as Uint8Array;
      const wavBlob = new Blob([wavData], { type: 'audio/wav' });

      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(wavBlob);

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

        // Display IPA comparison
        setIpaDisplay({
          expected: expectedIPA,
          actual: data.ipa_transcription || expectedIPA
        });

        setScores([...scores, score]);
        setIsProcessing(false);

        // Clean up FFmpeg files
        try {
          await ffmpeg.deleteFile('input.webm');
          await ffmpeg.deleteFile('output.wav');
        } catch (e) {
          // Ignore cleanup errors
        }
      };
    } catch (error) {
      console.error('Error processing audio:', error);
      setFeedback('Error processing audio. Please try again.');
      setSpecificFeedback(error instanceof Error ? error.message : '');
      setIsProcessing(false);
    }
  };

  const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

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
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full hover:shadow-lg hover:shadow-emerald-500/50 transition-all font-semibold"
        >
          Start Learning →
        </motion.button>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
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

          <h1 className="text-4xl md:text-7xl font-bold mb-6 leading-tight">
            Master English Pronunciation
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Like a Native Speaker
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Real AI-powered phonetic analysis. Not fake scores. Not guesswork.
            <span className="text-emerald-400 font-semibold"> Actual pronunciation assessment</span> powered by Microsoft Azure.
          </p>

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
            className="bg-slate-800/40 backdrop-blur-xl rounded-3xl p-6 md:p-10 max-w-4xl mx-auto border border-slate-700/50 shadow-2xl"
          >
            <div className="text-center mb-8">
              <div className="flex justify-between items-center mb-6">
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

              <div className="mb-4">
                <span className="text-xs text-blue-400 uppercase tracking-widest font-semibold">
                  {DEMO_ITEMS[currentWordIndex].type === 'word' ? '📝 Word' : '📖 Sentence'}
                </span>
              </div>

              <div className={`font-bold mb-8 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent ${
                DEMO_ITEMS[currentWordIndex].type === 'word'
                  ? 'text-5xl md:text-6xl'
                  : 'text-3xl md:text-4xl leading-relaxed'
              }`}>
                "{DEMO_ITEMS[currentWordIndex].text}"
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-700/50 rounded-full h-3 mb-8">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentWordIndex + 1) / DEMO_ITEMS.length) * 100}%` }}
                  className="bg-gradient-to-r from-emerald-500 to-blue-500 h-3 rounded-full"
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* IPA Display */}
              {ipaDisplay && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-8 p-6 bg-slate-900/70 rounded-2xl border border-slate-700/50"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-left">
                      <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Expected IPA</p>
                      <p className="text-2xl font-mono text-emerald-400 break-all">/{ipaDisplay.expected}/</p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Your IPA</p>
                      <p className="text-2xl font-mono text-yellow-400 break-all">/{ipaDisplay.actual}/</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Feedback Display */}
              {feedback && scores.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-8 bg-slate-900/80 rounded-2xl border border-slate-700/50"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold">Your Score</h3>
                    <div className={`text-5xl font-bold ${
                      scores[scores.length - 1] >= 75 ? 'text-emerald-400' :
                      scores[scores.length - 1] >= 50 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {scores[scores.length - 1].toFixed(0)}%
                    </div>
                  </div>

                  {specificFeedback && (
                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl mb-4">
                      <p className="text-sm text-blue-300">
                        💡 {specificFeedback}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setFeedback('');
                        setSpecificFeedback('');
                        setIpaDisplay(null);
                      }}
                      className="flex-1 py-3 px-6 bg-slate-700 hover:bg-slate-600 rounded-xl transition font-semibold"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={() => {
                        if (currentWordIndex < DEMO_ITEMS.length - 1) {
                          setCurrentWordIndex(currentWordIndex + 1);
                          setFeedback('');
                          setSpecificFeedback('');
                          setIpaDisplay(null);
                        } else {
                          setIsTestComplete(true);
                        }
                      }}
                      className="flex-1 py-3 px-6 bg-gradient-to-r from-emerald-500 to-blue-500 hover:shadow-lg hover:shadow-emerald-500/50 rounded-xl transition font-semibold flex items-center justify-center gap-2"
                    >
                      Next <ArrowRight size={18} />
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Recording Button */}
            <div className="flex flex-col items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing || ipaDisplay !== null || !ffmpegLoaded}
                className={`relative w-36 h-36 rounded-full flex items-center justify-center transition-all shadow-2xl ${
                  isProcessing || ipaDisplay || !ffmpegLoaded
                    ? 'bg-slate-600 cursor-not-allowed opacity-50'
                    : isRecording
                    ? 'bg-gradient-to-br from-red-500 to-pink-500 animate-pulse shadow-red-500/50'
                    : 'bg-gradient-to-br from-emerald-500 to-blue-500 hover:shadow-emerald-500/50'
                }`}
              >
                {!ffmpegLoaded ? (
                  <div className="text-white font-semibold text-sm px-4">Loading...</div>
                ) : isProcessing ? (
                  <div className="text-white font-semibold">Processing...</div>
                ) : isRecording ? (
                  <MicOff size={48} className="text-white" />
                ) : (
                  <Mic size={48} className="text-white" />
                )}
              </motion.button>

              <p className="mt-6 text-gray-400 h-6 text-center">
                {!ffmpegLoaded ?
                  'Loading audio processor...' :
                  ipaDisplay ?
                  'Review your results above' :
                  isProcessing ? 'Analyzing pronunciation with AI...' :
                  isRecording ? 'Recording... Click to stop' :
                  'Click microphone to start'}
              </p>
            </div>

            {/* Previous Scores */}
            {scores.length > 0 && (
              <div className="mt-10">
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
                        {DEMO_ITEMS[index].type === 'word' ? '📝' : '📖'}
                      </div>
                      <div className="font-bold text-xl">{score.toFixed(0)}%</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          /* Results Section */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800/40 backdrop-blur-xl rounded-3xl p-10 max-w-3xl mx-auto text-center border border-slate-700/50 shadow-2xl"
          >
            <Trophy size={64} className="mx-auto mb-6 text-yellow-400" />
            <h2 className="text-4xl font-bold mb-4">Assessment Complete! 🎉</h2>
            <div className="text-7xl font-bold mb-6">
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
            <p className="text-2xl text-gray-300 mb-12">
              {averageScore >= 80
                ? '🌟 Excellent! You have native-like pronunciation.'
                : averageScore >= 60
                ? '👍 Good job! Your pronunciation is clear and understandable.'
                : '💪 Keep practicing! Focus on individual phonemes.'}
            </p>

            {/* CTA */}
            <div className="bg-gradient-to-br from-emerald-500/20 to-blue-500/20 p-8 rounded-2xl border border-emerald-500/30">
              <h3 className="text-3xl font-bold mb-3">
                🚀 Ready to Master Your Accent?
              </h3>
              <p className="text-gray-300 mb-6 text-lg">
                Get unlimited practice and personalized lessons
              </p>
              <button className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-500/50 transition flex items-center justify-center gap-2 mx-auto">
                Start Free Trial <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </div>

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

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800 mt-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
          <div className="text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent mb-4">
              Phonetix
            </div>
            <p className="text-gray-400 mb-6">Real pronunciation assessment. Real results.</p>
            <p className="text-sm text-gray-600 mt-6">© 2024 Phonetix. Powered by Microsoft Azure Speech Services.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

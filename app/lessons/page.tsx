'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Target, ArrowLeft, Lock, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';

// Lesson content organized by category
const lessonLibrary: { [key: string]: any } = {
  'TH Sounds': {
    title: 'Mastering TH Sounds',
    description: 'Practice the voiced (ð) and voiceless (θ) TH sounds',
    difficulty: 'Medium',
    exercises: [
      {
        type: 'minimal-pairs',
        title: 'TH vs T/D',
        pairs: [
          { wrong: 'tank', right: 'thank', ipa: 'θæŋk' },
          { wrong: 'tin', right: 'thin', ipa: 'θɪn' },
          { wrong: 'tree', right: 'three', ipa: 'θɹi' },
          { wrong: 'dat', right: 'that', ipa: 'ðæt' },
          { wrong: 'den', right: 'then', ipa: 'ðɛn' }
        ],
        instructions: 'Put your tongue between your teeth and blow air. The right column shows the correct TH pronunciation.'
      },
      {
        type: 'practice-sentences',
        title: 'Practice Sentences',
        sentences: [
          'I think they threw three things.',
          'The weather is better than this.',
          'My mother and father are together.',
          'Nothing is worth more than everything.',
          'This Thursday, they will gather.'
        ],
        instructions: 'Read each sentence slowly, focusing on every TH sound.'
      }
    ],
    tips: [
      'Place tongue tip between teeth, not behind them',
      'For θ: no vibration (voiceless) - like blowing out a candle',
      'For ð: vibration (voiced) - you should feel it in your throat',
      'Practice in front of a mirror to ensure tongue position'
    ]
  },
  'R/L Confusion': {
    title: 'R vs L Distinction',
    description: 'Master the difference between R and L sounds',
    difficulty: 'Hard',
    exercises: [
      {
        type: 'minimal-pairs',
        title: 'R vs L',
        pairs: [
          { wrong: 'light', right: 'right', ipa: 'ɹaɪt' },
          { wrong: 'led', right: 'red', ipa: 'ɹɛd' },
          { wrong: 'collect', right: 'correct', ipa: 'kəˈɹɛkt' },
          { wrong: 'fly', right: 'fry', ipa: 'fɹaɪ' },
          { wrong: 'play', right: 'pray', ipa: 'pɹeɪ' }
        ],
        instructions: 'For R: curl tongue back without touching roof of mouth. For L: press tongue tip to roof.'
      },
      {
        type: 'practice-sentences',
        title: 'Practice Sentences',
        sentences: [
          'The library has really rare books.',
          'Larry will arrive early tomorrow.',
          'Please correct the errors carefully.',
          'Red lorries and yellow lorries.',
          'The rural juror ruled in her favor.'
        ],
        instructions: 'Focus on tongue position - L touches the roof, R does not.'
      }
    ],
    tips: [
      'L: tongue tip touches alveolar ridge (bumpy part behind teeth)',
      'R: tongue curls back, no contact with roof',
      'Practice slowly, exaggerating the difference at first',
      'Record yourself and compare to native speakers'
    ]
  },
  'V/W Distinction': {
    title: 'V vs W Sounds',
    description: 'Learn the difference between V and W',
    difficulty: 'Medium',
    exercises: [
      {
        type: 'minimal-pairs',
        title: 'V vs W',
        pairs: [
          { wrong: 'wine', right: 'vine', ipa: 'vaɪn' },
          { wrong: 'west', right: 'vest', ipa: 'vɛst' },
          { wrong: 'worse', right: 'verse', ipa: 'vɜːs' },
          { wrong: 'wail', right: 'veil', ipa: 'veɪl' },
          { wrong: 'went', right: 'vent', ipa: 'vɛnt' }
        ],
        instructions: 'V: upper teeth touch lower lip. W: round your lips, no teeth.'
      },
      {
        type: 'practice-sentences',
        title: 'Practice Sentences',
        sentences: [
          'We will visit the village on Wednesday.',
          'Victor went to the valley with William.',
          'The view from the window was very wide.',
          'Wives and wives voted in November.',
          'Vincent wore a velvet vest at the wedding.'
        ],
        instructions: 'Feel your teeth on your lip for every V sound.'
      }
    ],
    tips: [
      'V: bite your lower lip with upper teeth and vibrate',
      'W: round your lips like saying "oo" then release',
      'V is a fricative (air flows), W is a glide',
      'Practice in slow motion to build muscle memory'
    ]
  },
  'Consonant Clusters': {
    title: 'Consonant Clusters',
    description: 'Practice words with multiple consonants together',
    difficulty: 'Hard',
    exercises: [
      {
        type: 'practice-words',
        title: 'Initial Clusters',
        words: [
          { word: 'strength', ipa: 'stɹɛŋθ', breakdown: 's + t + r' },
          { word: 'splash', ipa: 'splæʃ', breakdown: 's + p + l' },
          { word: 'scream', ipa: 'skɹim', breakdown: 's + k + r' },
          { word: 'three', ipa: 'θɹi', breakdown: 'th + r' },
          { word: 'spring', ipa: 'spɹɪŋ', breakdown: 's + p + r' }
        ],
        instructions: 'Say each consonant clearly without adding extra vowel sounds between them.'
      },
      {
        type: 'practice-sentences',
        title: 'Practice Sentences',
        sentences: [
          'The strong winds swept through the streets.',
          'She tried to split the strange fruit.',
          'Twelve twisted tree branches scratched the sky.',
          'The prescription costs less than expected.',
          'Sprinkle the shredded coconut on top.'
        ],
        instructions: 'Don\'t add "uh" sounds between consonants. Keep them smooth.'
      }
    ],
    tips: [
      'Don\'t insert extra vowels (e.g., "street" not "suh-tree-t")',
      'Practice very slowly at first, then speed up',
      'Final clusters are hardest - practice "asked", "desks", "texts"',
      'Break words down, then blend smoothly'
    ]
  },
  'Word Stress': {
    title: 'Word Stress Patterns',
    description: 'Learn where to emphasize syllables in words',
    difficulty: 'Medium',
    exercises: [
      {
        type: 'stress-practice',
        title: 'Common Stress Patterns',
        words: [
          { word: 'PHOtograph', stress: 1, syllables: 3 },
          { word: 'phoTOgraphy', stress: 2, syllables: 4 },
          { word: 'photoGRAPHic', stress: 3, syllables: 4 },
          { word: 'IMportant', stress: 2, syllables: 3 },
          { word: 'commuNIcate', stress: 2, syllables: 4 }
        ],
        instructions: 'CAPITAL letters show the stressed syllable. Make it louder, longer, and higher pitch.'
      },
      {
        type: 'practice-sentences',
        title: 'Practice Sentences',
        sentences: [
          'The PHOtograph showed beautiful phoTOgraphy.',
          'It\'s IMportant to comMUnicate clearly.',
          'The PREsent was preSENTed beautifully.',
          'I want to REcord a new reCORD.',
          'The CONtent made me conTENT.'
        ],
        instructions: 'Exaggerate the stressed syllables - make them really stand out.'
      }
    ],
    tips: [
      'Stressed syllables are LOUDER, LONGER, and HIGHER pitch',
      'Unstressed syllables are quieter and often reduced ("uh" sound)',
      'Word stress can change meaning: REcord (noun) vs reCORD (verb)',
      'Listen to how native speakers emphasize words'
    ]
  },
  'Linking & Rhythm': {
    title: 'Linking and Rhythm',
    description: 'Connect words smoothly like native speakers',
    difficulty: 'Hard',
    exercises: [
      {
        type: 'linking-practice',
        title: 'Consonant-to-Vowel Linking',
        phrases: [
          { phrase: 'turn_it_off', linked: 'tur-ni-toff' },
          { phrase: 'check_it_out', linked: 'che-ki-tout' },
          { phrase: 'pick_up', linked: 'pi-kup' },
          { phrase: 'an_apple', linked: 'a-napple' },
          { phrase: 'not_at_all', linked: 'no-ta-tall' }
        ],
        instructions: 'Connect final consonant to next vowel. No pauses between words.'
      },
      {
        type: 'practice-sentences',
        title: 'Practice Sentences',
        sentences: [
          'I\'ll_eat_it_in_an_hour.',
          'She_asked_about_it_again.',
          'Turn_on_the_light_at_eight.',
          'He_arrived_at_eleven_o\'clock.',
          'Pick_up_an_apple_and_an_orange.'
        ],
        instructions: 'Flow words together. Mark _ shows where to link.'
      }
    ],
    tips: [
      'English flows like music, not individual words',
      'Link consonant endings to vowel beginnings',
      'Content words (nouns, verbs) are stressed; function words (the, of) are reduced',
      'Practice with music - songs show natural rhythm'
    ]
  },
  'Vowel Sounds': {
    title: 'English Vowel Sounds',
    description: 'Master the complex English vowel system',
    difficulty: 'Hard',
    exercises: [
      {
        type: 'minimal-pairs',
        title: 'Vowel Distinctions',
        pairs: [
          { wrong: 'ship', right: 'sheep', ipa: 'ʃip vs ʃiːp' },
          { wrong: 'bit', right: 'beat', ipa: 'bɪt vs biːt' },
          { wrong: 'full', right: 'fool', ipa: 'fʊl vs fuːl' },
          { wrong: 'cat', right: 'cut', ipa: 'kæt vs kʌt' },
          { wrong: 'pen', right: 'pan', ipa: 'pɛn vs pæn' }
        ],
        instructions: 'Pay attention to vowel length (short vs long) and tongue position.'
      },
      {
        type: 'practice-sentences',
        title: 'Practice Sentences',
        sentences: [
          'The sheep are sleeping in the ship.',
          'Fill the full cup until it\'s full.',
          'I can put the book in the good spot.',
          'The cat cut the curtain.',
          'Ten men sat in the pan.'
        ],
        instructions: 'Focus on the vowel sound in each bolded word.'
      }
    ],
    tips: [
      'English has ~14 vowel sounds (more than most languages)',
      'Long vowels (ee, oo) are actually TENSE, short vowels are LAX',
      'Mouth position matters: open vs closed, front vs back',
      'Record yourself and compare to native speakers'
    ]
  },
  'Final Consonants': {
    title: 'Final Consonant Sounds',
    description: 'Don\'t drop the endings of words',
    difficulty: 'Medium',
    exercises: [
      {
        type: 'minimal-pairs',
        title: 'Final Consonants Matter',
        pairs: [
          { wrong: 'row', right: 'road', ipa: 'ɹoʊd' },
          { wrong: 'high', right: 'hide', ipa: 'haɪd' },
          { wrong: 'see', right: 'seat', ipa: 'siːt' },
          { wrong: 'may', right: 'made', ipa: 'meɪd' },
          { wrong: 'plan', right: 'plant', ipa: 'plænt' }
        ],
        instructions: 'Pronounce the final consonant clearly. It changes the word meaning.'
      },
      {
        type: 'practice-sentences',
        title: 'Practice Sentences',
        sentences: [
          'I need to find the road and hide the note.',
          'The plant will last past August.',
          'She worked and asked about the task.',
          'The best test was the hardest.',
          'They walked and talked all night.'
        ],
        instructions: 'Make sure you pronounce EVERY final consonant, especially -ed, -s, -t, -d.'
      }
    ],
    tips: [
      'Many languages drop final consonants - English doesn\'t',
      'Final -ed can be /t/, /d/, or /ɪd/ depending on the word',
      'Final consonants can affect the vowel length before them',
      'Practice exaggerating final sounds, then make them natural'
    ]
  },
  'Intonation Patterns': {
    title: 'Intonation Patterns',
    description: 'Use pitch to convey meaning and emotion',
    difficulty: 'Medium',
    exercises: [
      {
        type: 'intonation-practice',
        title: 'Question vs Statement',
        pairs: [
          { statement: 'You\'re going. ↘', question: 'You\'re going? ↗' },
          { statement: 'She left. ↘', question: 'She left? ↗' },
          { statement: 'It\'s ready. ↘', question: 'It\'s ready? ↗' },
          { statement: 'They know. ↘', question: 'They know? ↗' },
          { statement: 'He can. ↘', question: 'He can? ↗' }
        ],
        instructions: '↗ means pitch goes UP at end (question). ↘ means pitch goes DOWN (statement).'
      },
      {
        type: 'practice-sentences',
        title: 'Practice Sentences',
        sentences: [
          'What time is it? ↗ (Wh-questions go down)',
          'Are you coming? ↗ (Yes/no questions go up)',
          'I don\'t know. ↘ (Statements go down)',
          'Really? ↗ (Surprise goes up)',
          'I think so. ↘ (Certainty goes down)'
        ],
        instructions: 'Match your pitch to the arrows. Record yourself and listen.'
      }
    ],
    tips: [
      'Wh-questions (what, where, who) usually go DOWN',
      'Yes/no questions usually go UP',
      'Rising intonation can show surprise or uncertainty',
      'Flat intonation sounds robotic - vary your pitch'
    ]
  },
  'Connected Speech': {
    title: 'Connected Speech',
    description: 'Reductions and contractions in natural speech',
    difficulty: 'Hard',
    exercises: [
      {
        type: 'reduction-practice',
        title: 'Common Reductions',
        reductions: [
          { full: 'want to', reduced: 'wanna', ipa: 'wɑnə' },
          { full: 'going to', reduced: 'gonna', ipa: 'ɡɑnə' },
          { full: 'have to', reduced: 'hafta', ipa: 'hæftə' },
          { full: 'out of', reduced: 'outta', ipa: 'aʊɾə' },
          { full: 'kind of', reduced: 'kinda', ipa: 'kaɪndə' }
        ],
        instructions: 'Native speakers use reductions in casual speech. Practice both forms.'
      },
      {
        type: 'practice-sentences',
        title: 'Practice Sentences',
        sentences: [
          'I\'m gonna go to the store (going to).',
          'We hafta finish this today (have to).',
          'Whaddya want for dinner? (what do you)',
          'I wanna learn more (want to).',
          'It\'s kinda difficult (kind of).'
        ],
        instructions: 'Casual speech uses reductions. Formal speech uses full forms.'
      }
    ],
    tips: [
      'Reductions are normal in casual speech, not "lazy"',
      'Use full forms in formal situations',
      'Listen to movies/TV shows to hear natural reductions',
      'Practice understanding reductions even if you don\'t use them yet'
    ]
  }
};

interface Assessment {
  id: string;
  created_at: string;
  average_score: number;
  results: any[];
}

export default function LessonsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/pricing');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchAssessments = async () => {
      if (!user) return;

      const supabase = createClient();
      if (!supabase) {
        setLoadingData(false);
        return;
      }

      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching assessments:', error);
      } else {
        setAssessments(data || []);
      }
      setLoadingData(false);
    };

    fetchAssessments();
  }, [user]);

  // Get weak categories from latest assessment
  const weakCategories = assessments[0]?.results
    ? (() => {
        const categories: { [key: string]: number[] } = {};
        assessments[0].results.forEach((r: any) => {
          if (!categories[r.category]) categories[r.category] = [];
          categories[r.category].push(r.score);
        });
        return Object.entries(categories)
          .map(([category, scores]) => ({
            category,
            average: scores.reduce((a, b) => a + b, 0) / scores.length
          }))
          .filter(cat => cat.average < 80) // Focus on scores below 80%
          .sort((a, b) => a.average - b.average);
      })()
    : [];

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  // If no category selected, show overview
  if (!selectedCategory) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 text-white">
        {/* Animated Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-purple-500/30 blur-[120px] animate-pulse" />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-emerald-500/20 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Navigation */}
        <nav className="relative z-10 flex justify-between items-center px-6 md:px-12 py-6">
          <Link href="/">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent cursor-pointer"
            >
              ✨ Phonetix
            </motion.div>
          </Link>
          <Link href="/dashboard">
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-full transition"
            >
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </motion.button>
          </Link>
        </nav>

        {/* Main Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              Personalized Lessons
            </h1>
            <p className="text-gray-400 text-lg">Practice exercises targeting your weak areas</p>
          </motion.div>

          {assessments.length === 0 ? (
            // No assessments yet
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target size={40} />
              </div>
              <h2 className="text-2xl font-bold mb-4">Take an Assessment First</h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                We need to analyze your pronunciation to create personalized lessons for you.
              </p>
              <Link href="/">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full font-semibold hover:shadow-lg hover:shadow-emerald-500/50 transition"
                >
                  Take Assessment
                </motion.button>
              </Link>
            </motion.div>
          ) : (
            <>
              {/* Recommended Lessons (Based on Weak Areas) */}
              {weakCategories.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Target className="text-emerald-400" />
                    Recommended for You
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {weakCategories.map((cat, index) => (
                      <motion.div
                        key={cat.category}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => setSelectedCategory(cat.category)}
                        className="bg-gradient-to-br from-red-500/20 to-orange-500/20 border-2 border-red-500/50 rounded-xl p-6 cursor-pointer hover:scale-105 transition"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <BookOpen className="w-8 h-8 text-red-400" />
                          <span className="text-xs bg-red-500/30 px-2 py-1 rounded">Your score: {cat.average.toFixed(0)}%</span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">{cat.category}</h3>
                        <p className="text-gray-300 text-sm mb-4">
                          {lessonLibrary[cat.category]?.description || 'Targeted practice exercises'}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <span className={`px-2 py-1 rounded text-xs ${
                            lessonLibrary[cat.category]?.difficulty === 'Hard' ? 'bg-red-500/30' :
                            lessonLibrary[cat.category]?.difficulty === 'Medium' ? 'bg-yellow-500/30' :
                            'bg-green-500/30'
                          }`}>
                            {lessonLibrary[cat.category]?.difficulty || 'Medium'}
                          </span>
                          <span>•</span>
                          <span>{lessonLibrary[cat.category]?.exercises?.length || 0} exercises</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Lessons */}
              <div>
                <h2 className="text-2xl font-bold mb-6">All Lessons</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(lessonLibrary).map(([category, lesson], index) => {
                    const isWeak = weakCategories.some(w => w.category === category);
                    return (
                      <motion.div
                        key={category}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => setSelectedCategory(category)}
                        className={`${
                          isWeak
                            ? 'bg-slate-800/30 border-slate-700'
                            : 'bg-slate-800/50 border-slate-700'
                        } border rounded-xl p-6 cursor-pointer hover:border-emerald-500/50 hover:scale-105 transition`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <BookOpen className="w-8 h-8 text-blue-400" />
                          {isWeak && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                        </div>
                        <h3 className="text-xl font-bold mb-2">{lesson.title}</h3>
                        <p className="text-gray-300 text-sm mb-4">{lesson.description}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <span className={`px-2 py-1 rounded text-xs ${
                            lesson.difficulty === 'Hard' ? 'bg-red-500/30' :
                            lesson.difficulty === 'Medium' ? 'bg-yellow-500/30' :
                            'bg-green-500/30'
                          }`}>
                            {lesson.difficulty}
                          </span>
                          <span>•</span>
                          <span>{lesson.exercises.length} exercises</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Show selected lesson
  const lesson = lessonLibrary[selectedCategory];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-purple-500/30 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-emerald-500/20 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center px-6 md:px-12 py-6">
        <Link href="/">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent cursor-pointer"
          >
            ✨ Phonetix
          </motion.div>
        </Link>
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => setSelectedCategory(null)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-full transition"
        >
          <ArrowLeft size={16} />
          <span>Back to Lessons</span>
        </motion.button>
      </nav>

      {/* Lesson Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 md:px-12 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              {lesson.title}
            </h1>
            <p className="text-gray-300 text-lg mb-4">{lesson.description}</p>
            <span className={`px-3 py-1 rounded-full text-sm ${
              lesson.difficulty === 'Hard' ? 'bg-red-500/30 text-red-300' :
              lesson.difficulty === 'Medium' ? 'bg-yellow-500/30 text-yellow-300' :
              'bg-green-500/30 text-green-300'
            }`}>
              {lesson.difficulty} Difficulty
            </span>
          </div>

          {/* Exercises */}
          <div className="space-y-8">
            {lesson.exercises.map((exercise: any, index: number) => (
              <div key={index} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h2 className="text-2xl font-bold mb-4">{exercise.title}</h2>
                <p className="text-gray-400 mb-6">{exercise.instructions}</p>

                {/* Minimal Pairs */}
                {exercise.type === 'minimal-pairs' && (
                  <div className="space-y-3">
                    {exercise.pairs.map((pair: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg">
                        <span className="text-red-400 line-through flex-1">{pair.wrong}</span>
                        <span className="text-gray-500">→</span>
                        <span className="text-emerald-400 font-semibold flex-1">{pair.right}</span>
                        <span className="text-gray-500 text-sm font-mono">{pair.ipa}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Practice Sentences */}
                {exercise.type === 'practice-sentences' && (
                  <div className="space-y-3">
                    {exercise.sentences.map((sentence: string, i: number) => (
                      <div key={i} className="p-4 bg-slate-900/50 rounded-lg">
                        <p className="text-lg">{i + 1}. {sentence}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Practice Words */}
                {exercise.type === 'practice-words' && (
                  <div className="space-y-3">
                    {exercise.words.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg">
                        <span className="text-emerald-400 font-semibold flex-1">{item.word}</span>
                        <span className="text-gray-500 text-sm">{item.breakdown}</span>
                        <span className="text-gray-500 text-sm font-mono">{item.ipa}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Stress Practice */}
                {exercise.type === 'stress-practice' && (
                  <div className="space-y-3">
                    {exercise.words.map((item: any, i: number) => (
                      <div key={i} className="p-4 bg-slate-900/50 rounded-lg">
                        <p className="text-lg font-semibold text-emerald-400">{item.word}</p>
                        <p className="text-gray-400 text-sm mt-1">
                          {item.syllables} syllables • Stress on syllable {item.stress}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Linking Practice */}
                {exercise.type === 'linking-practice' && (
                  <div className="space-y-3">
                    {exercise.phrases.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg">
                        <span className="flex-1">{item.phrase.replace(/_/g, ' ')}</span>
                        <span className="text-gray-500">→</span>
                        <span className="text-emerald-400 font-semibold flex-1">{item.linked}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Intonation Practice */}
                {exercise.type === 'intonation-practice' && (
                  <div className="space-y-3">
                    {exercise.pairs.map((item: any, i: number) => (
                      <div key={i} className="p-4 bg-slate-900/50 rounded-lg space-y-2">
                        <p className="text-blue-400">{item.statement}</p>
                        <p className="text-emerald-400">{item.question}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reduction Practice */}
                {exercise.type === 'reduction-practice' && (
                  <div className="space-y-3">
                    {exercise.reductions.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg">
                        <span className="flex-1">{item.full}</span>
                        <span className="text-gray-500">→</span>
                        <span className="text-emerald-400 font-semibold flex-1">{item.reduced}</span>
                        <span className="text-gray-500 text-sm font-mono">{item.ipa}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tips Section */}
          <div className="mt-8 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/50 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Target className="text-emerald-400" />
              Pro Tips
            </h3>
            <ul className="space-y-2">
              {lesson.tips.map((tip: string, i: number) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-emerald-400 mt-1">•</span>
                  <span className="text-gray-300">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Next Steps */}
          <div className="mt-8 text-center">
            <p className="text-gray-400 mb-4">Practice these exercises daily for best results!</p>
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full font-semibold hover:shadow-lg hover:shadow-emerald-500/50 transition"
              >
                Take Another Assessment
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

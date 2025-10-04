/**
 * Duolingo-style Learning Path
 *
 * Structure:
 * - Units (main topics)
 *   - Skills (subtopics within unit)
 *     - Lessons (5-7 exercises per lesson)
 *       - Exercises (individual practice items)
 */

export interface Exercise {
  id: string;
  type: 'repeat' | 'minimal_pair' | 'sentence' | 'listen_choose';
  word: string;
  ipa: string;
  difficulty: 'easy' | 'medium' | 'hard';
  audioUrl?: string;
  options?: string[]; // For multiple choice
  translation?: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  exercises: Exercise[];
  xpReward: number;
}

export interface Skill {
  id: string;
  title: string;
  description: string;
  icon: string;
  lessons: Lesson[];
  totalXP: number;
}

export interface Unit {
  id: string;
  title: string;
  description: string;
  color: string;
  skills: Skill[];
}

export const LEARNING_PATH: Unit[] = [
  {
    id: 'unit-1',
    title: 'TH Sounds',
    description: 'Master the voiced (ð) and voiceless (θ) TH sounds',
    color: 'bg-blue-500',
    skills: [
      {
        id: 'skill-1-1',
        title: 'Initial TH',
        description: 'TH at the beginning of words',
        icon: '🎯',
        totalXP: 150,
        lessons: [
          {
            id: 'lesson-1-1-1',
            title: 'TH Basics',
            description: 'Learn θ sound at word start',
            xpReward: 50,
            exercises: [
              { id: 'ex-1', type: 'repeat', word: 'think', ipa: 'θ ɪ ŋ k', difficulty: 'easy' },
              { id: 'ex-2', type: 'repeat', word: 'three', ipa: 'θ ɹ i', difficulty: 'easy' },
              { id: 'ex-3', type: 'repeat', word: 'thank', ipa: 'θ æ ŋ k', difficulty: 'easy' },
              { id: 'ex-4', type: 'repeat', word: 'thick', ipa: 'θ ɪ k', difficulty: 'easy' },
              { id: 'ex-5', type: 'repeat', word: 'thing', ipa: 'θ ɪ ŋ', difficulty: 'easy' },
            ]
          },
          {
            id: 'lesson-1-1-2',
            title: 'TH in Action',
            description: 'Practice TH in sentences',
            xpReward: 50,
            exercises: [
              { id: 'ex-6', type: 'sentence', word: 'I think this is good', ipa: 'aɪ θɪŋk ðɪs ɪz ɡʊd', difficulty: 'medium' },
              { id: 'ex-7', type: 'repeat', word: 'Thursday', ipa: 'θ ɜː z d eɪ', difficulty: 'medium' },
              { id: 'ex-8', type: 'repeat', word: 'theory', ipa: 'θ ɪ ə ɹ i', difficulty: 'medium' },
              { id: 'ex-9', type: 'repeat', word: 'thought', ipa: 'θ ɔː t', difficulty: 'medium' },
              { id: 'ex-10', type: 'repeat', word: 'through', ipa: 'θ ɹ u', difficulty: 'hard' },
            ]
          }
        ]
      },
      {
        id: 'skill-1-2',
        title: 'Medial TH',
        description: 'TH in the middle of words',
        icon: '🎵',
        totalXP: 150,
        lessons: [
          {
            id: 'lesson-1-2-1',
            title: 'Middle TH',
            description: 'TH sound between syllables',
            xpReward: 50,
            exercises: [
              { id: 'ex-11', type: 'repeat', word: 'brother', ipa: 'b ɹ ʌ ð ə ɹ', difficulty: 'easy' },
              { id: 'ex-12', type: 'repeat', word: 'mother', ipa: 'm ʌ ð ə ɹ', difficulty: 'easy' },
              { id: 'ex-13', type: 'repeat', word: 'father', ipa: 'f ɑː ð ə ɹ', difficulty: 'easy' },
              { id: 'ex-14', type: 'repeat', word: 'another', ipa: 'ə n ʌ ð ə ɹ', difficulty: 'medium' },
              { id: 'ex-15', type: 'repeat', word: 'weather', ipa: 'w ɛ ð ə ɹ', difficulty: 'medium' },
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'unit-2',
    title: 'R/L Distinction',
    description: 'Differentiate between R and L sounds',
    color: 'bg-green-500',
    skills: [
      {
        id: 'skill-2-1',
        title: 'Initial R vs L',
        description: 'R and L at word start',
        icon: '🔊',
        totalXP: 150,
        lessons: [
          {
            id: 'lesson-2-1-1',
            title: 'R vs L Basics',
            description: 'Distinguish R from L',
            xpReward: 50,
            exercises: [
              { id: 'ex-16', type: 'repeat', word: 'right', ipa: 'ɹ aɪ t', difficulty: 'easy' },
              { id: 'ex-17', type: 'repeat', word: 'light', ipa: 'l aɪ t', difficulty: 'easy' },
              { id: 'ex-18', type: 'repeat', word: 'red', ipa: 'ɹ ɛ d', difficulty: 'easy' },
              { id: 'ex-19', type: 'repeat', word: 'read', ipa: 'ɹ i d', difficulty: 'easy' },
              { id: 'ex-20', type: 'repeat', word: 'lead', ipa: 'l i d', difficulty: 'easy' },
              { id: 'ex-21', type: 'repeat', word: 'lock', ipa: 'l ɑː k', difficulty: 'easy' },
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'unit-3',
    title: 'V/W/B Sounds',
    description: 'Perfect your V, W, and B pronunciation',
    color: 'bg-purple-500',
    skills: [
      {
        id: 'skill-3-1',
        title: 'V vs W',
        description: 'Distinguish V from W sounds',
        icon: '💪',
        totalXP: 150,
        lessons: [
          {
            id: 'lesson-3-1-1',
            title: 'V vs W Practice',
            description: 'Master the difference',
            xpReward: 50,
            exercises: [
              { id: 'ex-22', type: 'repeat', word: 'very', ipa: 'v ɛ ɹ i', difficulty: 'easy' },
              { id: 'ex-23', type: 'repeat', word: 'west', ipa: 'w ɛ s t', difficulty: 'easy' },
              { id: 'ex-24', type: 'repeat', word: 'vest', ipa: 'v ɛ s t', difficulty: 'easy' },
              { id: 'ex-25', type: 'repeat', word: 'vine', ipa: 'v aɪ n', difficulty: 'easy' },
              { id: 'ex-26', type: 'repeat', word: 'vote', ipa: 'v oʊ t', difficulty: 'medium' },
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'unit-4',
    title: 'Final Consonants',
    description: 'Practice ending sounds clearly',
    color: 'bg-red-500',
    skills: [
      {
        id: 'skill-4-1',
        title: 'Final Stops',
        description: 'Master p, t, k, b, d, g endings',
        icon: '🎬',
        totalXP: 150,
        lessons: [
          {
            id: 'lesson-4-1-1',
            title: 'Stop Sounds',
            description: 'Clear final consonants',
            xpReward: 50,
            exercises: [
              { id: 'ex-27', type: 'repeat', word: 'stop', ipa: 's t ɑː p', difficulty: 'easy' },
              { id: 'ex-28', type: 'repeat', word: 'cat', ipa: 'k æ t', difficulty: 'easy' },
              { id: 'ex-29', type: 'repeat', word: 'back', ipa: 'b æ k', difficulty: 'easy' },
              { id: 'ex-30', type: 'repeat', word: 'bad', ipa: 'b æ d', difficulty: 'easy' },
              { id: 'ex-31', type: 'repeat', word: 'big', ipa: 'b ɪ ɡ', difficulty: 'easy' },
            ]
          }
        ]
      }
    ]
  }
];

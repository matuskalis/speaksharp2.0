import { useState, useEffect } from 'react';

export interface UserProgress {
  xp: number;
  hearts: number;
  streak: number;
  lastPracticeDate: string;
  completedLessons: string[];
  completedSkills: string[];
  level: number;
}

const STORAGE_KEY = 'speaksharp_progress';
const MAX_HEARTS = 5;
const XP_PER_LEVEL = 500;

export function useProgress() {
  const [progress, setProgress] = useState<UserProgress>({
    xp: 0,
    hearts: MAX_HEARTS,
    streak: 0,
    lastPracticeDate: '',
    completedLessons: [],
    completedSkills: [],
    level: 1,
  });

  // Load progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setProgress(parsed);

      // Update streak
      updateStreak(parsed);
    }
  }, []);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const updateStreak = (currentProgress: UserProgress) => {
    const today = new Date().toDateString();
    const lastDate = new Date(currentProgress.lastPracticeDate).toDateString();

    if (today === lastDate) {
      return; // Already practiced today
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (lastDate === yesterdayStr) {
      // Extend streak
      setProgress(prev => ({
        ...prev,
        streak: prev.streak + 1,
        lastPracticeDate: today,
      }));
    } else if (lastDate !== today) {
      // Reset streak
      setProgress(prev => ({
        ...prev,
        streak: 1,
        lastPracticeDate: today,
      }));
    }
  };

  const addXP = (amount: number) => {
    setProgress(prev => {
      const newXP = prev.xp + amount;
      const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;

      return {
        ...prev,
        xp: newXP,
        level: newLevel,
      };
    });
  };

  const loseHeart = () => {
    setProgress(prev => ({
      ...prev,
      hearts: Math.max(0, prev.hearts - 1),
    }));
  };

  const gainHeart = () => {
    setProgress(prev => ({
      ...prev,
      hearts: Math.min(MAX_HEARTS, prev.hearts + 1),
    }));
  };

  const refillHearts = () => {
    setProgress(prev => ({
      ...prev,
      hearts: MAX_HEARTS,
    }));
  };

  const completeLesson = (lessonId: string, xpEarned: number) => {
    setProgress(prev => {
      if (prev.completedLessons.includes(lessonId)) {
        return prev; // Already completed
      }

      const newXP = prev.xp + xpEarned;
      const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;
      const today = new Date().toDateString();

      return {
        ...prev,
        xp: newXP,
        level: newLevel,
        completedLessons: [...prev.completedLessons, lessonId],
        lastPracticeDate: today,
      };
    });
  };

  const completeSkill = (skillId: string) => {
    setProgress(prev => {
      if (prev.completedSkills.includes(skillId)) {
        return prev;
      }

      return {
        ...prev,
        completedSkills: [...prev.completedSkills, skillId],
      };
    });
  };

  const resetProgress = () => {
    setProgress({
      xp: 0,
      hearts: MAX_HEARTS,
      streak: 0,
      lastPracticeDate: '',
      completedLessons: [],
      completedSkills: [],
      level: 1,
    });
  };

  const getXPForNextLevel = () => {
    return progress.level * XP_PER_LEVEL;
  };

  const getXPProgress = () => {
    const currentLevelXP = (progress.level - 1) * XP_PER_LEVEL;
    const xpInCurrentLevel = progress.xp - currentLevelXP;
    return (xpInCurrentLevel / XP_PER_LEVEL) * 100;
  };

  return {
    progress,
    addXP,
    loseHeart,
    gainHeart,
    refillHearts,
    completeLesson,
    completeSkill,
    resetProgress,
    getXPForNextLevel,
    getXPProgress,
    MAX_HEARTS,
  };
}

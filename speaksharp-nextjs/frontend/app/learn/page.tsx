'use client';

import { useState } from 'react';
import { useProgress } from '@/lib/useProgress';
import { LEARNING_PATH, Unit, Skill, Lesson } from '@/lib/drillsData';
import { useRouter } from 'next/navigation';
import { Heart, Flame, Trophy, Lock, Check, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LearnPage() {
  const router = useRouter();
  const { progress, MAX_HEARTS } = useProgress();
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);

  const isSkillUnlocked = (skill: Skill, unitIndex: number, skillIndex: number) => {
    // First skill of first unit is always unlocked
    if (unitIndex === 0 && skillIndex === 0) return true;

    // Check if previous skill is completed
    const previousUnitIndex = skillIndex === 0 ? unitIndex - 1 : unitIndex;
    const previousSkillIndex = skillIndex === 0
      ? (LEARNING_PATH[previousUnitIndex]?.skills.length || 0) - 1
      : skillIndex - 1;

    if (previousUnitIndex < 0) return true;

    const previousSkill = LEARNING_PATH[previousUnitIndex]?.skills[previousSkillIndex];
    if (!previousSkill) return true;

    // Check if all lessons of previous skill are completed
    return previousSkill.lessons.every(lesson =>
      progress.completedLessons.includes(lesson.id)
    );
  };

  const isSkillCompleted = (skill: Skill) => {
    return skill.lessons.every(lesson =>
      progress.completedLessons.includes(lesson.id)
    );
  };

  const getSkillProgress = (skill: Skill) => {
    const completed = skill.lessons.filter(lesson =>
      progress.completedLessons.includes(lesson.id)
    ).length;
    return (completed / skill.lessons.length) * 100;
  };

  const handleLessonClick = (lesson: Lesson) => {
    if (progress.hearts <= 0) {
      alert('No hearts left! Take a break and come back later, or practice to earn hearts.');
      return;
    }
    router.push(`/practice/${lesson.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-purple-500/30 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-emerald-500/20 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 blur-[100px] animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Header with progress */}
      <div className="relative z-10 sticky top-0 backdrop-blur-sm bg-slate-900/50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Flame className="text-orange-400" size={24} />
              <span className="font-bold text-lg text-white">{progress.streak}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {Array.from({ length: MAX_HEARTS }).map((_, i) => (
                  <Heart
                    key={i}
                    size={20}
                    className={i < progress.hearts ? 'fill-red-500 text-red-500' : 'text-gray-600'}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-emerald-400">Level {progress.level}</div>
              <div className="text-xs text-gray-400">{progress.xp} XP</div>
            </div>
            <Trophy className="text-yellow-400" size={28} />
          </div>
        </div>
      </div>

      {/* Learning Path */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          <Sparkles className="text-purple-400" size={32} />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Your Learning Path
          </h1>
        </motion.div>

        <div className="space-y-12">
          {LEARNING_PATH.map((unit, unitIndex) => (
            <div key={unit.id} className="relative">
              {/* Unit Header */}
              <div className="mb-6">
                <div className={`inline-block px-4 py-2 rounded-full ${unit.color} text-white font-bold shadow-lg`}>
                  Unit {unitIndex + 1}
                </div>
                <h2 className="text-2xl font-bold text-white mt-2">{unit.title}</h2>
                <p className="text-gray-300">{unit.description}</p>
              </div>

              {/* Skills in Unit */}
              <div className="space-y-8">
                {unit.skills.map((skill, skillIndex) => {
                  const unlocked = isSkillUnlocked(skill, unitIndex, skillIndex);
                  const completed = isSkillCompleted(skill);
                  const progressPercent = getSkillProgress(skill);

                  return (
                    <div key={skill.id} className="relative">
                      {/* Connection Line */}
                      {skillIndex > 0 && (
                        <div className="absolute left-1/2 transform -translate-x-1/2 -top-8 w-1 h-8 bg-white/20" />
                      )}

                      {/* Skill Card */}
                      <div className={`relative ${unlocked ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                        <div className={`p-6 rounded-2xl border-2 transition-all ${
                          completed
                            ? 'bg-green-500/20 border-green-400 shadow-lg shadow-green-500/30 backdrop-blur-sm'
                            : unlocked
                            ? 'bg-white/10 border-white/20 hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/20 backdrop-blur-sm'
                            : 'bg-white/5 border-white/10 backdrop-blur-sm'
                        }`}>
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="text-4xl">{skill.icon}</div>
                              <div>
                                <h3 className="text-xl font-bold text-white">{skill.title}</h3>
                                <p className="text-sm text-gray-300">{skill.description}</p>
                              </div>
                            </div>
                            {!unlocked && <Lock className="text-gray-400" size={24} />}
                            {completed && <Check className="text-green-400" size={28} />}
                          </div>

                          {/* Progress Bar */}
                          {unlocked && !completed && (
                            <div className="mb-4">
                              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-300"
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Lessons */}
                          {unlocked && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                              {skill.lessons.map((lesson) => {
                                const lessonCompleted = progress.completedLessons.includes(lesson.id);
                                return (
                                  <motion.button
                                    key={lesson.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleLessonClick(lesson)}
                                    className={`p-4 rounded-xl text-left transition-all ${
                                      lessonCompleted
                                        ? 'bg-green-500/20 border-2 border-green-400 shadow-lg shadow-green-500/20'
                                        : 'bg-white/5 border-2 border-white/20 hover:border-emerald-400/50 hover:bg-white/10'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="font-semibold text-white">{lesson.title}</div>
                                        <div className="text-xs text-gray-300 mt-1">{lesson.description}</div>
                                        <div className="text-xs text-emerald-400 font-medium mt-2">
                                          +{lesson.xpReward} XP
                                        </div>
                                      </div>
                                      {lessonCompleted && (
                                        <Check className="text-green-400 ml-2" size={20} />
                                      )}
                                    </div>
                                  </motion.button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

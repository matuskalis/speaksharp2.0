'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, Target, Award, Lock, ArrowRight, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';

interface Assessment {
  id: string;
  created_at: string;
  average_score: number;
  total_items: number;
  completed_items: number;
  results: any[];
  ai_feedback: any;
  test_version: string;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
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
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching assessments:', error);
      } else {
        setAssessments(data || []);
      }
      setLoadingData(false);
    };

    fetchAssessments();
  }, [user]);

  // Calculate stats
  const totalAssessments = assessments.length;
  const latestScore = assessments[0]?.average_score || 0;
  const averageScore = assessments.length > 0
    ? assessments.reduce((acc, a) => acc + a.average_score, 0) / assessments.length
    : 0;

  // Calculate improvement (compare latest to oldest)
  const improvement = assessments.length >= 2
    ? latestScore - assessments[assessments.length - 1].average_score
    : 0;

  // Get category breakdown from latest assessment
  const categoryPerformance = assessments[0]?.results
    ? (() => {
        const categories: { [key: string]: number[] } = {};
        assessments[0].results.forEach((r: any) => {
          if (!categories[r.category]) categories[r.category] = [];
          categories[r.category].push(r.score);
        });
        return Object.entries(categories).map(([category, scores]) => ({
          category,
          average: scores.reduce((a, b) => a + b, 0) / scores.length
        })).sort((a, b) => a.average - b.average);
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
        <div className="flex items-center gap-4">
          <Link href="/pricing">
            <motion.button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-full transition text-sm">
              Upgrade
            </motion.button>
          </Link>
          <div className="flex items-center gap-2 text-gray-300">
            <User size={18} />
            <span className="text-sm hidden sm:inline">{user.email}</span>
          </div>
        </div>
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
            Your Progress
          </h1>
          <p className="text-gray-400 text-lg">Track your pronunciation improvement over time</p>
        </motion.div>

        {assessments.length === 0 ? (
          // Empty State
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target size={40} />
            </div>
            <h2 className="text-2xl font-bold mb-4">No Assessments Yet</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Take your first pronunciation assessment to start tracking your progress!
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
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Award className="w-5 h-5 text-emerald-400" />
                  <span className="text-gray-400 text-sm">Latest Score</span>
                </div>
                <div className="text-3xl font-bold">{latestScore.toFixed(0)}%</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Target className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-400 text-sm">Average</span>
                </div>
                <div className="text-3xl font-bold">{averageScore.toFixed(0)}%</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className={`w-5 h-5 ${improvement >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
                  <span className="text-gray-400 text-sm">Improvement</span>
                </div>
                <div className={`text-3xl font-bold ${improvement >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {improvement >= 0 ? '+' : ''}{improvement.toFixed(0)}%
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-400 text-sm">Total Tests</span>
                </div>
                <div className="text-3xl font-bold">{totalAssessments}</div>
              </motion.div>
            </div>

            {/* Category Performance */}
            {categoryPerformance.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 mb-12"
              >
                <h2 className="text-2xl font-bold mb-6">Your Weakest Areas</h2>
                <div className="space-y-4">
                  {categoryPerformance.slice(0, 5).map((cat, index) => (
                    <div key={index}>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-300">{cat.category}</span>
                        <span className="text-gray-400">{cat.average.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            cat.average >= 80 ? 'bg-emerald-500' :
                            cat.average >= 60 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${cat.average}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Upgrade CTA */}
                <div className="mt-8 p-6 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/50 rounded-xl">
                  <div className="flex items-start gap-4">
                    <Lock className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-2">Get Personalized Lessons</h3>
                      <p className="text-gray-300 text-sm mb-4">
                        Upgrade to Learner tier to get custom practice exercises targeting these weak areas!
                      </p>
                      <Link href="/pricing">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full font-semibold text-sm hover:shadow-lg hover:shadow-emerald-500/50 transition inline-flex items-center gap-2"
                        >
                          Upgrade to Learner <ArrowRight size={16} />
                        </motion.button>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Assessment History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h2 className="text-2xl font-bold mb-6">Assessment History</h2>
              <div className="space-y-4">
                {assessments.map((assessment, index) => (
                  <motion.div
                    key={assessment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-emerald-500/50 transition"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg font-semibold">
                            {new Date(assessment.created_at).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span className="text-xs bg-slate-700 px-2 py-1 rounded">
                            {assessment.test_version}
                          </span>
                        </div>
                        <div className="text-gray-400 text-sm">
                          {assessment.completed_items}/{assessment.total_items} items completed
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-gray-400 text-sm mb-1">Score</div>
                          <div className={`text-3xl font-bold ${
                            assessment.average_score >= 80 ? 'text-emerald-400' :
                            assessment.average_score >= 60 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {assessment.average_score.toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Feedback Preview */}
                    {assessment.ai_feedback && (
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <p className="text-gray-300 text-sm italic">
                          "{assessment.ai_feedback.summary}"
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Take Another Assessment CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-12 text-center"
            >
              <Link href="/">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full text-lg font-semibold hover:shadow-lg hover:shadow-emerald-500/50 transition"
                >
                  Take Another Assessment
                </motion.button>
              </Link>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

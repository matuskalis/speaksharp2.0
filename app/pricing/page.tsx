'use client';

import { motion } from 'framer-motion';
import { Check, Star, Zap, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started',
    icon: Star,
    features: [
      'Unlimited standard assessments',
      'Basic AI feedback',
      'See your current scores',
      'Access to all 10 test sentences'
    ],
    notIncluded: [
      'No assessment history',
      'No personalized lessons',
      'No progress tracking',
      'No Native Fluency mode'
    ],
    cta: 'Start Free',
    highlighted: false,
    gradient: 'from-gray-600 to-gray-700'
  },
  {
    name: 'Learner',
    price: '$19.99',
    period: 'per month',
    description: 'Best for systematic improvement',
    icon: Zap,
    badge: 'Most Popular',
    features: [
      'Everything in Free, plus:',
      'Personalized lesson plans',
      'Custom practice exercises for YOUR weak sounds',
      'Assessment history & progress tracking',
      'Weekly practice recommendations',
      'Detailed improvement analytics',
      'Email support'
    ],
    notIncluded: [],
    cta: 'Start Learning',
    highlighted: true,
    gradient: 'from-emerald-500 to-blue-500'
  },
  {
    name: 'Professional',
    price: '$49.99',
    period: 'per month',
    description: 'For native-level fluency',
    icon: Crown,
    features: [
      'Everything in Learner, plus:',
      'Native Fluency Mode (strict grading)',
      'Hyper-detailed phoneme analysis',
      'Advanced metrics (stress, rhythm, intonation)',
      'Business English scenarios',
      'Premium personalized lessons',
      'Priority support'
    ],
    notIncluded: [],
    cta: 'Go Professional',
    highlighted: false,
    gradient: 'from-purple-500 to-pink-500'
  }
];

export default function PricingPage() {
  const router = useRouter();

  const handleCTA = (tierName: string) => {
    if (tierName === 'Free') {
      router.push('/');
    } else {
      // TODO: Implement Stripe checkout
      alert(`${tierName} tier coming soon! Stripe integration in progress.`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-purple-500/30 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-emerald-500/20 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center px-6 md:px-12 py-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push('/')}
          className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent cursor-pointer"
        >
          ✨ Phonetix
        </motion.div>
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => router.push('/')}
          className="px-4 md:px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-full transition text-sm md:text-base"
        >
          ← Back to Home
        </motion.button>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Choose Your Path to Fluency
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            From beginner to native-level speaker. We have a plan for everyone.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-2xl p-8 ${
                tier.highlighted
                  ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/20 scale-105'
                  : 'bg-slate-800/50 border border-slate-700'
              }`}
            >
              {/* Badge */}
              {tier.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                    {tier.badge}
                  </span>
                </div>
              )}

              {/* Icon */}
              <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${tier.gradient} flex items-center justify-center mb-4`}>
                <tier.icon className="w-6 h-6 text-white" />
              </div>

              {/* Tier Name */}
              <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
              <p className="text-gray-400 text-sm mb-6">{tier.description}</p>

              {/* Price */}
              <div className="mb-6">
                <span className="text-5xl font-bold">{tier.price}</span>
                <span className="text-gray-400 ml-2">/ {tier.period}</span>
              </div>

              {/* CTA Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleCTA(tier.name)}
                className={`w-full py-3 rounded-lg font-semibold mb-8 transition ${
                  tier.highlighted
                    ? 'bg-gradient-to-r from-emerald-500 to-blue-500 hover:shadow-lg hover:shadow-emerald-500/50'
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                {tier.cta}
              </motion.button>

              {/* Features */}
              <div className="space-y-3">
                {tier.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </div>
                ))}
                {tier.notIncluded.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3 opacity-50">
                    <div className="w-5 h-5 flex-shrink-0 mt-0.5 text-gray-600">✕</div>
                    <span className="text-sm text-gray-500">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-20 max-w-3xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Can I switch plans anytime?</h3>
              <p className="text-gray-400">Yes! Upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">What's the difference between Standard and Native Fluency mode?</h3>
              <p className="text-gray-400">Standard mode is great for learners to intermediate speakers. Native Fluency mode uses much stricter grading and catches subtle errors that separate advanced speakers from native-level fluency.</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Do you offer refunds?</h3>
              <p className="text-gray-400">Yes! Try any paid plan risk-free for 7 days. If you're not satisfied, we'll refund you in full.</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">How do personalized lessons work?</h3>
              <p className="text-gray-400">After each assessment, we analyze your weak areas and generate custom practice exercises targeting YOUR specific pronunciation challenges. Focus on what matters most for your improvement.</p>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-20 text-center"
        >
          <h2 className="text-3xl font-bold mb-6">Ready to Master English Pronunciation?</h2>
          <p className="text-xl text-gray-300 mb-8">Start with our free tier and upgrade when you're ready.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/')}
            className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full text-lg font-semibold hover:shadow-lg hover:shadow-emerald-500/50 transition"
          >
            Start Your Free Assessment
          </motion.button>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800 mt-20 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-400 text-sm">
          <p>© 2025 Phonetix. Powered by Azure Speech Services & OpenAI.</p>
          <p className="text-xs text-gray-700 mt-2">v1.2</p>
        </div>
      </footer>
    </div>
  );
}

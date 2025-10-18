# Database Setup - Next Steps

**Date:** October 16, 2025
**Status:** ✅ Code complete, ⏸️ Database tables needed

---

## ✅ What We Just Built

### 1. **Environment Variables Added**
- ✅ Local `.env.local` updated with your Supabase credentials
- ✅ Railway environment variables configured
- ✅ Railway redeployed (~2-3 minutes)

### 2. **Auto-Save Assessment Feature** (Commit: `3429ffa`)

Added functionality to automatically save completed assessments to database:

```typescript
// app/page.tsx - New code
import { createClient } from '@/lib/supabase/client';

// Automatically saves when AI feedback is generated
useEffect(() => {
  const saveAssessment = async () => {
    if (!user || !aiFeedback || assessmentResults.length === 0) return;

    const supabase = createClient();
    await supabase.from('assessments').insert({
      user_id: user.id,
      average_score: averageScore,
      total_items: 10,
      completed_items: scores.length,
      results: assessmentResults,
      ai_feedback: aiFeedback,
      test_version: 'v1.1'
    });
  };

  saveAssessment();
}, [aiFeedback, user, assessmentResults, scores]);
```

**How it works:**
- User completes 10-sentence assessment
- AI feedback is generated
- If user is logged in → automatically saves to database
- If user is not logged in → assessment works normally (no save)

### 3. **TypeScript Fixes**
- Fixed type annotations in `lib/auth-context.tsx`
- Added `Session` and `AuthChangeEvent` types
- Build passes with no errors

---

## ⚠️ CRITICAL: Database Tables Don't Exist Yet!

Your Supabase project is configured, but the database tables haven't been created yet.

**Current Status:**
- ✅ Supabase account created
- ✅ Project created: `https://zkmfganmbsiidexwebot.supabase.co`
- ✅ API credentials added to Railway
- ❌ Database tables not created
- ❌ Can't save assessments yet (table doesn't exist)

---

## 🚀 Next Step: Create Database Tables (2 minutes)

### Go to Supabase Dashboard:

1. **Open:** https://supabase.com/dashboard
2. **Select:** Your project (should be named "phonetix" or similar)
3. **Click:** **SQL Editor** in left sidebar
4. **Click:** **New Query** button

### Paste This SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create assessments table
CREATE TABLE assessments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Assessment scores
  average_score NUMERIC(5,2),
  total_items INTEGER,
  completed_items INTEGER,

  -- Detailed results (JSON)
  results JSONB,

  -- AI-generated feedback (JSON)
  ai_feedback JSONB,

  -- Metadata
  test_version VARCHAR(10) DEFAULT 'v1.1'
);

-- Create index for faster queries
CREATE INDEX idx_assessments_user_id ON assessments(user_id);
CREATE INDEX idx_assessments_created_at ON assessments(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own assessments
CREATE POLICY "Users can view own assessments"
  ON assessments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own assessments
CREATE POLICY "Users can insert own assessments"
  ON assessments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own assessments
CREATE POLICY "Users can update own assessments"
  ON assessments
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create user_profiles table (optional - for future features)
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- User preferences
  display_name VARCHAR(255),
  native_language VARCHAR(50),
  target_accent VARCHAR(50) DEFAULT 'American',

  -- Subscription (for future)
  subscription_tier VARCHAR(20) DEFAULT 'free',
  subscription_status VARCHAR(20) DEFAULT 'active'
);

-- Enable RLS on profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Click **Run** (or press Cmd+Enter)

You should see: **"Success. No rows returned"**

---

## ✅ After Running SQL, You Can:

### Test Authentication (Production):
1. Visit https://www.matuskalis.com (or your Railway domain)
2. Click **"Sign In / Sign Up"**
3. Create a test account
4. Check your email and click verification link
5. Sign in
6. You should see your email in the nav bar

### Test Assessment Save:
1. While signed in, complete the 10-sentence assessment
2. Wait for AI feedback to appear
3. Check browser console - should see: `"Assessment saved successfully!"`
4. Go to Supabase Dashboard → **Table Editor** → `assessments` table
5. You should see your saved assessment!

### View Saved Data:
In Supabase Dashboard → Table Editor:
- **`assessments`** table - All completed assessments
- **`user_profiles`** table - User profiles (auto-created on signup)

---

## 🔐 What Row Level Security (RLS) Does

**Security is built-in:**
- Users can ONLY see their own assessments
- No user can access another user's data
- Enforced at database level (can't bypass)

**Example:**
```typescript
// This will ONLY return the logged-in user's assessments
const { data } = await supabase
  .from('assessments')
  .select('*')
  // RLS automatically filters to current user's data
```

Even if someone tries to hack the query, they can't access other users' data!

---

## 📊 What Data Gets Saved

Every time an authenticated user completes an assessment:

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "created_at": "2025-10-16T10:30:00Z",
  "average_score": 85.5,
  "total_items": 10,
  "completed_items": 10,
  "results": [
    {
      "text": "I think the weather is getting better",
      "category": "TH Sounds",
      "score": 92,
      "difficulty": "easy",
      "expectedIPA": "aɪ θ ɪ ŋ k...",
      "actualIPA": "aɪ θ ɪ ŋ k...",
      "recognizedText": "I think the weather is getting better"
    }
    // ... 9 more items
  ],
  "ai_feedback": {
    "summary": "Great job overall!",
    "strengths": ["Excellent TH sounds", "Clear pronunciation"],
    "improvements": [
      {
        "sound": "R sounds",
        "issue": "Slightly too hard",
        "practice": "Try softening the R in 'really'"
      }
    ],
    "encouragement": "Keep up the excellent work!"
  },
  "test_version": "v1.1"
}
```

---

## 🎯 After Database Setup

Once tables are created, you can:

1. **Track User Progress**
   - See all past assessments
   - Track improvement over time
   - Identify weak areas

2. **Build Dashboard** (Next Task)
   - Display assessment history
   - Show progress charts
   - Highlight areas needing practice

3. **Generate Personalized Lessons**
   - Analyze user's weak phonemes
   - Create custom practice sentences
   - Target specific improvement areas

---

## 🐛 Troubleshooting

### "relation 'assessments' does not exist"
- ✅ Run the SQL in Supabase SQL Editor
- ✅ Make sure you clicked "Run"
- ✅ Check for error messages in SQL Editor

### "permission denied for table assessments"
- ✅ RLS policies were created successfully
- ✅ User is signed in (check browser console)
- ✅ Refresh the page

### "Assessment saved successfully!" but no data in table
- ✅ Make sure you're signed in
- ✅ Complete the full 10-sentence assessment
- ✅ Wait for AI feedback to appear
- ✅ Check Supabase Table Editor → `assessments` table

---

## 📝 Summary

**Completed:**
- ✅ Supabase credentials configured (local & Railway)
- ✅ Auto-save feature implemented
- ✅ TypeScript errors fixed
- ✅ Code deployed to Railway

**Next (Your Action):**
- ⏸️ Run SQL in Supabase to create tables (2 minutes)
- ⏸️ Test authentication on production site
- ⏸️ Complete assessment while signed in
- ⏸️ Verify data appears in Supabase

**After That:**
- Build user dashboard to show assessment history
- Create personalized lesson generation engine
- Add Stripe for premium subscriptions

---

**Last Updated:** October 16, 2025
**Railway Deployment:** In progress (~2-3 minutes)
**See Full Guide:** `SUPABASE_SETUP_GUIDE.md`

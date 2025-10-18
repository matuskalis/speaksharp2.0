# Supabase Setup Guide - Complete Walkthrough

**Time Required:** ~10 minutes
**Cost:** FREE (up to 50,000 monthly active users)

---

## 🎯 Why Supabase?

For your personalized lessons feature, you need:
- ✅ User authentication (sign up, sign in, sign out)
- ✅ Database to save assessment results
- ✅ User progress tracking
- ✅ Free tier with generous limits

Supabase provides all of this in one platform!

---

## 📝 Step 1: Create Supabase Account (2 min)

1. **Go to:** https://supabase.com
2. **Click:** "Start your project" (green button in top right)
3. **Choose sign-up method:**
   - **GitHub** (recommended - 1-click)
   - **Email** (requires verification)
4. **Confirm your email** if using email signup

---

## 🏗️ Step 2: Create Your First Project (3 min)

1. **Click:** "New Project" button
2. **Organization:** Keep default (or create new org)
3. **Fill in project details:**

```
Project Name: phonetix
Database Password: [Create a STRONG password - SAVE THIS!]
Region: us-east-1 (or closest to you)
Pricing Plan: Free
```

4. **Click:** "Create new project"
5. **Wait:** ~2 minutes while database provisions (green checkmark when done)

---

## 🔑 Step 3: Get Your API Credentials (1 min)

### Option A: Quick Copy (Home Screen)
1. On your project homepage, you'll see:
   - **Project URL**
   - **anon public key**
2. Click the copy icons to copy each

### Option B: Settings Menu
1. **Click:** Settings (gear icon) in left sidebar
2. **Click:** "API" in settings menu
3. **Find these values:**

```
Project URL
https://xxxxxxxxxxxxx.supabase.co
└─ Copy this entire URL

Project API keys → anon public
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
└─ Copy this entire key (it's long - ~200+ characters)
```

---

## 💻 Step 4: Update Local Environment (1 min)

1. **Open:** `/Users/matuskalis/speaksharp/.env.local`
2. **Replace these lines:**

```bash
# BEFORE
NEXT_PUBLIC_SUPABASE_URL=YOUR_PROJECT_URL_HERE
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE

# AFTER (with your actual values)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **Save the file**

---

## 🗄️ Step 5: Create Database Tables (2 min)

1. **In Supabase Dashboard:**
   - Click **SQL Editor** (left sidebar)
   - Click **New Query**

2. **Copy and paste this SQL:**

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

3. **Click:** "Run" (or press Cmd+Enter)
4. **You should see:** "Success. No rows returned"

---

## 🚀 Step 6: Add to Railway (2 min)

1. **Go to:** https://railway.app
2. **Select your project:** phonetix
3. **Click:** Your frontend service
4. **Click:** "Variables" tab
5. **Add these 2 variables:**

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: [paste your Supabase URL]

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [paste your anon key]
```

6. **Railway auto-redeploys** (~2-3 minutes)

---

## ✅ Step 7: Test It Works (1 min)

### Local Test:
```bash
cd /Users/matuskalis/speaksharp
npm run dev
```

1. Open http://localhost:3000
2. Click "Sign In / Sign Up"
3. Create a test account
4. Check your email for verification link
5. Click link, sign in
6. You should see your email in the nav bar!

### Production Test (after Railway deploys):
1. Visit https://www.matuskalis.com
2. Same steps as above
3. Should work exactly the same!

---

## 🎉 What You Can Do Now

With Supabase set up, you can:

### ✅ User Authentication
- Users create accounts
- Email verification
- Password reset (configure in Supabase → Authentication → Email Templates)
- Session management (auto-refresh)

### ✅ Save Assessment Data
```typescript
// In your app code
const { error } = await supabase
  .from('assessments')
  .insert({
    user_id: user.id,
    average_score: 85,
    total_items: 10,
    results: [...],
    ai_feedback: {...}
  })
```

### ✅ Query User Progress
```typescript
// Get user's assessment history
const { data } = await supabase
  .from('assessments')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
```

### ✅ Build Dashboard
- Show all past assessments
- Track improvement over time
- Identify weak areas
- Generate personalized lessons

---

## 🔐 Security Features (Already Enabled)

✅ **Row Level Security (RLS)**
- Users can only see their own data
- No user can access another user's assessments
- Enforced at database level

✅ **Email Verification**
- Users must verify email before signing in
- Prevents fake accounts

✅ **Secure Sessions**
- JWT tokens auto-refresh
- Sessions expire after 1 week of inactivity

---

## 📊 Monitor Your Database

**Supabase Dashboard → Table Editor**
- See all your tables
- View data in real-time
- Edit records manually (for testing)

**Supabase Dashboard → Authentication**
- See all registered users
- Manually verify emails
- Ban/unban users

**Supabase Dashboard → Database → Logs**
- See all SQL queries
- Monitor performance
- Debug issues

---

## 🆓 Free Tier Limits

You get **FREE**:
- ✅ 50,000 monthly active users
- ✅ 500 MB database space
- ✅ 1 GB file storage
- ✅ 2 GB bandwidth
- ✅ 50,000 monthly email sends (auth)
- ✅ Unlimited API requests

**This is MORE than enough for:**
- 1,000+ users
- 10,000+ assessments
- Years of operation

You'll only need to upgrade if you go viral! 🚀

---

## 🐛 Troubleshooting

### "Invalid API key"
- ✅ Copy the **anon public** key (not service_role)
- ✅ Make sure you copied the entire key (200+ chars)
- ✅ No spaces before/after the key

### "Project URL not found"
- ✅ Include `https://` in the URL
- ✅ Make sure it ends with `.supabase.co`

### "Tables not found"
- ✅ Run the SQL in Step 5 again
- ✅ Check SQL Editor for error messages
- ✅ Refresh the Table Editor

### "Email not sending"
- ✅ Supabase → Authentication → Email Templates
- ✅ Make sure "Confirm signup" is enabled
- ✅ Check spam folder

---

## 📚 Next Steps

Once Supabase is set up:

1. **Test authentication locally**
2. **Deploy to Railway with env vars**
3. **Implement "save assessment" feature**
4. **Build user dashboard**
5. **Create lesson generation engine**

---

**Created:** October 16, 2025
**Estimated Setup Time:** 10 minutes
**Difficulty:** Easy (copy-paste)

**Need help?** Supabase has excellent docs: https://supabase.com/docs

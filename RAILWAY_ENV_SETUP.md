# Railway Environment Variables Setup

## Required Variables for Production

Add these environment variables in Railway Dashboard:

**Railway Dashboard → Your Service → Variables tab**

---

## 1. Supabase Authentication

```bash
NEXT_PUBLIC_SUPABASE_URL=https://aatvtrtvgxzskqzfvcch.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdHZ0cnR2Z3h6c2txemZ2Y2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNzk0NTIsImV4cCI6MjA3Mjg1NTQ1Mn0.BA3mfpoPydNppsHS1zcCsRn_026XK4HlwUo1VB-_caU
```

**Why needed:** User authentication and database access

---

## 2. Anthropic AI (Optional but Recommended)

```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**Why needed:** AI-powered feedback generation
**Get key:** https://console.anthropic.com/

---

## 3. Backend URL (Already Set)

```bash
BACKEND_URL=https://speaksharp20-production-1a8d.up.railway.app
```

**Why needed:** Pronunciation assessment backend
**Status:** ✅ Already configured

---

## How to Add Variables in Railway

### Step 1: Open Railway Dashboard
1. Go to https://railway.app/
2. Select your project: `phonetix`
3. Select your service (frontend)

### Step 2: Add Variables
1. Click "Variables" tab
2. Click "New Variable"
3. Add each variable:
   - Variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - Value (paste the value above)
4. Click "Add"

### Step 3: Redeploy
1. After adding all variables
2. Railway will automatically redeploy
3. Wait for deployment to complete (~2-3 minutes)

---

## Verification

After deployment, check:

1. **Auth works:**
   - Visit your site
   - Click "Sign In / Sign Up"
   - Create account → Should receive verification email

2. **AI feedback works:**
   - Complete an assessment
   - Should see AI-generated feedback (not fallback)

3. **No console errors:**
   - Open browser DevTools
   - Check for Supabase or environment variable errors

---

## Troubleshooting

### "Supabase client is not configured"
- ✅ Add `NEXT_PUBLIC_SUPABASE_URL`
- ✅ Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ Redeploy

### "AI feedback shows fallback message"
- ✅ Add `ANTHROPIC_API_KEY`
- ✅ Verify key is valid at console.anthropic.com
- ✅ Redeploy

### "Cannot connect to backend"
- ✅ Verify `BACKEND_URL` is set
- ✅ Check backend is running: curl https://speaksharp20-production-1a8d.up.railway.app/api/test

---

## Local Development

For local development, these are already in `.env.local`:

```bash
# Already configured in .env.local
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# ANTHROPIC_API_KEY=sk-ant-... (uncomment and add your key)
```

---

**Last Updated:** October 16, 2025
**Next Step:** Add variables to Railway, then redeploy

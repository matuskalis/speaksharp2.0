# Phonetix Railway Deployment - Fix Azure 400 Error

## Issue
Azure Speech API was returning "400 Bad Request" due to incorrect pronunciation assessment configuration.

## Fix Applied
Removed `enableMiscue: false` from the pronunciation config in `/app/api/score/route.ts`

## Railway Environment Variables Needed

Make sure these are set in your phonetix Railway project:

```
AZURE_SPEECH_KEY=your-azure-key-here
AZURE_SPEECH_REGION=eastus
NODE_ENV=production
```

## Deploy Steps

1. Commit the fix
2. Push to GitHub
3. Railway auto-deploys
4. Test at: https://phonetix-production.up.railway.app

## If Still Getting 400 Error

Check Railway logs for the actual Azure error message:
- Go to Railway Dashboard → phonetix project → Deployments → View Logs
- Look for "Azure API error" in the logs
- The full error message will show what's wrong

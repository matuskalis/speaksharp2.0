# Railway Environment Variables

Set these in your Railway dashboard after deployment:

## Required Variables

```
AZURE_SPEECH_KEY=your-azure-speech-key-here
AZURE_SPEECH_REGION=eastus
```

## Optional Variables (with defaults)

```
ENVIRONMENT=production
DEBUG=False
API_HOST=0.0.0.0
API_PORT=8001
CORS_ORIGINS=https://speaksharp.app,https://www.speaksharp.app,https://matuskalis.com
```

## How to Set Variables in Railway:

1. Go to your Railway project dashboard
2. Click on your service
3. Go to "Variables" tab
4. Add each variable with its value
5. Railway will automatically redeploy with new variables

## Getting Azure Speech Key:

If you don't have Azure credentials yet:
1. Sign up for Azure: https://azure.microsoft.com/free/
2. Create a Speech resource
3. Copy the key and region
4. You get $200 free credits to start

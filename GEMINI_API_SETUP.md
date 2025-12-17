# Gemini API Key Setup Guide

## Issue: Quota Exceeded

If you see errors like:
```
[429 Too Many Requests] You exceeded your current quota
Quota exceeded for metric: generate_content_free_tier_requests
```

This means you've hit the API limits. Here's how to fix it:

---

## Solution 1: Get a New API Key (Recommended)

### Step 1: Go to Google AI Studio
1. Visit: https://aistudio.google.com/app/apikey
2. Sign in with your Google account

### Step 2: Create New API Key
1. Click "Create API key"
2. Select a Google Cloud project (or create new)
3. Copy the API key (starts with `AIza...`)

### Step 3: Update Your .env File
1. Open `/Users/deepaknaik/code/devflow/.env`
2. Replace the old key:
   ```bash
   GEMINI_API_KEY=YOUR_NEW_KEY_HERE
   ```
3. Save the file

### Step 4: Restart Dev Server
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

---

## Solution 2: Switch to Gemini 1.5 Flash (Already Done!)

I've already updated the code to use `gemini-1.5-flash` instead of the experimental model.

**Why this helps:**
- ✅ Better free tier limits (15 requests/min vs lower for experimental)
- ✅ More stable and reliable
- ✅ Still supports multi-language (Hindi, Marathi, English, Hinglish)
- ✅ 1,500 requests per day (free tier)

---

## Gemini API Free Tier Limits

| Model | Requests/Min | Requests/Day | Tokens/Min |
|-------|--------------|--------------|------------|
| **gemini-1.5-flash** ✅ | 15 | 1,500 | 1M |
| gemini-2.0-flash-exp | Lower | Limited | Limited |

**We're now using gemini-1.5-flash for better reliability!**

---

## How to Check Your Quota

1. Visit: https://ai.dev/usage?tab=rate-limit
2. View your current usage and limits
3. See when quotas reset (usually daily)

---

## After Getting New Key

1. Update `.env` with new key
2. Restart server: `npm run dev`
3. Try adding an entry
4. Should work! ✅

---

## Testing

Once you've updated the key, test it:

```bash
npx tsx src/ai/test-gemini.ts
```

You should see:
```
✅ GEMINI_API_KEY found
✅ Success!
Result: { detectedLanguage: "en", category: "task", ... }
```

---

## Pro Tips

1. **Don't share your API key** - Keep it secret in `.env`
2. **Monitor usage** - Check https://ai.dev/usage regularly
3. **Rate limiting** - Free tier is generous but has limits
4. **Paid tier** - For production, consider Google Cloud billing

---

## Current Model

✅ **Using: `gemini-1.5-flash`**
- Stable and reliable
- Great free tier limits
- Multi-language support
- Perfect for development

---

**Next:** Update your `.env` file with the new API key and restart the server!

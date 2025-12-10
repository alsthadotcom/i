# Vercel Deployment Fix Guide

## Issues Fixed

1. ✅ Changed from `process.env` to `import.meta.env` (Vite's standard)
2. ✅ Updated all environment variable names to use `VITE_` prefix
3. ✅ Added TypeScript definitions for environment variables
4. ✅ Simplified Vite configuration

## Required Actions in Vercel

### 1. Set Environment Variables

Go to your Vercel project → Settings → Environment Variables and add:

| Variable Name | Description | Example |
|--------------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | `eyJhbGciOiJIUzI1...` |

| `VITE_OPENROUTER_API_KEY` | Your OpenRouter API key | `sk-or-v1-...` |

**Important:** 
- Set these for **Production**, **Preview**, and **Development** environments
- The `VITE_` prefix is required for Vite to expose these variables to the client

### 2. Redeploy

After setting the environment variables:

1. Go to Deployments tab
2. Click on the latest deployment
3. Click the three dots (•••) menu
4. Select "Redeploy"
5. Check "Use existing Build Cache" is **unchecked** (force fresh build)

### 3. Verify Build

The build should now succeed. Check the build logs for:
- ✅ No TypeScript errors
- ✅ No "Missing Supabase credentials" errors
- ✅ Successful Vite build completion

## Local Development

For local development, copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your actual credentials.

## Troubleshooting

### Still seeing blank page?

1. **Check browser console** - Open DevTools and look for errors
2. **Verify environment variables** - Make sure all 4 variables are set in Vercel
3. **Check build logs** - Look for any warnings or errors during build
4. **Clear cache** - Force a fresh deployment without build cache

### Environment variables not working?

- Ensure variable names start with `VITE_`
- Redeploy after adding/changing variables
- Check that variables are set for the correct environment (Production/Preview)

### TypeScript errors during build?

Run locally first:
```bash
npm run build
```

This will show any TypeScript errors that need to be fixed.

## Migration Summary

All files have been updated to use Vite's standard environment variable approach:

- ✅ `services/supabase.ts` - Updated to use `import.meta.env.VITE_SUPABASE_*`
- ✅ `services/gemini.ts` - Updated to use `import.meta.env.VITE_OPENROUTER_API_KEY`
- ✅ `services/analyzeBusinessModel.ts` - Updated to use `import.meta.env.VITE_OPENROUTER_API_KEY`
- ✅ `vite.config.ts` - Simplified, removed custom `define` section
- ✅ `src/vite-env.d.ts` - Added TypeScript definitions
- ✅ `package.json` - Added TypeScript check to build script

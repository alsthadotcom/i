# 🚀 Quick Start Guide - IDA Marketplace

## Prerequisites Completed ✅
- ✅ Database schema created
- ✅ TypeScript types defined
- ✅ Service layer implemented
- ✅ All components integrated
- ✅ AI scoring updated to 6-metric system

## 3-Step Setup

### 1️⃣ Apply Database Schema (5 minutes)

1. Open your **new Supabase project** dashboard
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Open `supabase_schema.sql` in your code editor
5. **Copy all** the SQL code
6. **Paste** into Supabase SQL Editor
7. Click **Run** (or press Ctrl/Cmd + Enter)
8. ✅ You should see "Success. No rows returned"

### 2️⃣ Create Storage Bucket (2 minutes)

1. In Supabase dashboard, go to **Storage** (left sidebar)
2. Click **Create a new bucket**
3. Bucket name: `idea-assets`
4. **Public bucket**: Toggle ON
5. Click **Create bucket**
6. ✅ Bucket created! Folders will be auto-created on first upload

### 3️⃣ Update Environment Variables (1 minute)

1. Open `.env.local` in your project root
2. Update these values:

```env
# Get these from Supabase Dashboard → Settings → API
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Your existing API keys (keep these)
GEMINI_API_KEY=your-existing-key
OPENROUTER_API_KEY=your-existing-key
```

3. **Save** the file

## 🎯 Start the Application

```bash
npm run dev
```

Visit: `http://localhost:3000`

## ✅ Test the Integration

### Test 1: Sign Up
1. Go to `/pages/signup.html`
2. Create an account with:
   - First Name: John
   - Last Name: Doe
   - Username: johndoe (will auto-format to @johndoe)
   - Email: john@example.com
   - Password: password123
3. ✅ Should create user and redirect to marketplace

### Test 2: Sell an Idea
1. Click "Add new listing" in marketplace
2. Fill in:
   - Title: "AI-Powered Task Manager"
   - Description: "Revolutionary task management with AI"
   - Upload a PDF document
3. Wait for AI analysis (shows 6 metrics)
4. Set MVP: Yes → Digital/Saas → URL: https://demo.example.com
5. Set Price: $999
6. Click "Publish Listing"
7. ✅ Should save and redirect to marketplace

### Test 3: View Marketplace
1. Go to `/pages/marketplace.html`
2. ✅ Should see your idea listed
3. Click on the idea
4. ✅ Should show detail page with all 6 AI metrics

### Test 4: Search
1. In marketplace, type "AI" in search box
2. Click "Search"
3. ✅ Should filter results

## 🔍 Verify Database

Check your Supabase dashboard:

1. **Table Editor** → `user_info`
   - Should see your user record
   - Username should be `@johndoe`

2. **Table Editor** → `idea_listing`
   - Should see your idea
   - Check document_url is populated
   - Check MVP fields

3. **Table Editor** → `ai_scoring`
   - Should see AI scores for your idea
   - All 6 metrics should be present

4. **Storage** → `idea-assets`
   - Should see uploaded documents in `documents/` folder

## 🎊 You're All Set!

Your IDA Marketplace is now fully integrated with Supabase and ready to use!

## 📚 What's Been Integrated

- ✅ User authentication with database records
- ✅ Idea listing with file uploads
- ✅ AI scoring with 6 metrics
- ✅ Marketplace with search
- ✅ Idea details page
- ✅ MVP support (Digital & Physical)
- ✅ Document management (1 main + 3 additional)

## 🆘 Troubleshooting

### "Missing Supabase credentials" error
- Check `.env.local` has correct SUPABASE_URL and SUPABASE_ANON_KEY
- Restart dev server after updating env vars

### "Failed to upload document" error
- Verify storage bucket `idea-assets` exists
- Check bucket is set to Public
- Verify you're logged in

### "Failed to create idea listing" error
- Check SQL schema was applied successfully
- Verify user_info record exists for your user
- Check browser console for detailed error

### AI analysis not working
- Verify OPENROUTER_API_KEY is set in `.env.local`
- Check you uploaded a PDF file
- Look for errors in browser console

## 📞 Need Help?

Check the `DATABASE_INTEGRATION_STATUS.md` file for:
- Detailed component documentation
- Database schema overview
- Security features
- Testing checklist

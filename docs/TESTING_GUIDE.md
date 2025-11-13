# Testing Guide - Data Persistence Fix

## Prerequisites

Before testing, ensure:
1. ✅ `.env.local` file exists with valid Supabase credentials
2. ✅ Supabase database is accessible
3. ✅ Migrations are applied to Supabase
4. ✅ Server builds successfully (`npm run build`)

## Testing Steps

### Test 1: Basic Functionality ✅ (Code Level)

**Status:** Code compiles successfully, no linter errors

**Verification:**
```bash
npm run build
# Result: ✅ Build successful
```

### Test 2: Database Loading (Manual Testing Required)

**Steps:**
1. Start the application:
   ```bash
   npm run dev
   ```

2. Open browser at `http://localhost:3000`

3. Create a test project:
   - Click "Create New Project"
   - Name it "Test Project"
   - Click Create

4. Create test chats:
   - Create 2-3 chats
   - Send several messages in each chat
   - Verify messages appear

5. **Critical Test - Cache Clear:**
   - Open Browser DevTools (F12)
   - Go to Application tab
   - Storage → Local Storage
   - Right-click → Clear
   - Refresh the page (F5)
   
   **Expected Result:** 
   - ✅ All projects still appear
   - ✅ When you select a project, all chats load from database
   - ✅ All messages are restored
   - ✅ Console shows: `[Cache] Loaded X sessions from localStorage` (initially 0)

6. **Cross-Browser Test:**
   - Open same URL in different browser
   - Use same userId parameter (if applicable)
   
   **Expected Result:**
   - ✅ Projects and chats appear in new browser
   - ✅ All data synced from database

### Test 3: Console Verification

Open browser console and check for these logs:

**On page load:**
```
[Cache] Loaded 0 sessions from localStorage  // Initially empty
```

**After selecting project:**
```
[Cache] Loaded X sessions from localStorage
```

**After any action:**
```
[Cache] Saved X sessions to localStorage
```

### Test 4: Network Verification

1. Open DevTools → Network tab
2. Select a project
3. Verify these API calls:
   - ✅ `GET /api/projects/{projectId}/chats?userId=...`
   - ✅ `GET /api/chat/{sessionId}/messages` (for each chat)

### Test 5: Database Verification (Supabase Dashboard)

1. Open Supabase Dashboard
2. Go to Table Editor
3. Check tables:
   - ✅ `chat_sessions` - has records with correct `project_id`
   - ✅ `chat_messages` - has records with correct `session_id`
   - ✅ `projects` - has your test projects

## Troubleshooting

### Error: 500 Internal Server Error

**Cause:** Supabase connection issue

**Fix:**
1. Check `.env.local` has valid credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
   OPENAI_API_KEY=sk-xxx
   ```

2. Verify Supabase project is running
3. Check migrations are applied

### Error: No chats loading

**Cause:** Migrations not applied

**Fix:**
```bash
# Apply migrations in Supabase SQL Editor
# Run: supabase/migrations/20241110000000_create_chat_tables.sql
# Then: supabase/migrations/20241111100000_add_projects_and_documents.sql
```

### Error: Data still disappearing

**Cause:** Sessions not being saved to database

**Fix:**
1. Check API endpoint `/api/chat` is saving sessions correctly
2. Verify `backendSessionId` is set after first message
3. Check browser console for error messages

## Success Criteria ✅

The fix is successful when:
- [x] Code compiles without errors
- [x] No linter errors
- [ ] Page loads without errors (requires valid Supabase connection)
- [ ] Projects load from database
- [ ] Chats load from database when project selected
- [ ] Messages load for each chat
- [ ] Data persists after clearing localStorage
- [ ] Data accessible from multiple browsers/devices
- [ ] Console shows cache logs correctly

## Current Status

✅ **Implementation Complete**
- API endpoint created
- Frontend loading logic implemented
- Database migrations created
- Documentation complete

⏳ **Manual Testing Required**
- Requires valid Supabase connection
- Requires deployed/running server
- User to perform manual verification

## Next Steps for User

1. Ensure `.env.local` has valid Supabase credentials
2. Start dev server: `npm run dev`
3. Open http://localhost:3000
4. Follow Test 2 steps above
5. Verify data persists after clearing localStorage

---

**Note:** The code changes are complete and verified at compilation level. Manual testing with live database connection is required for end-to-end verification.


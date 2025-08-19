# Live Broadcasting System - Manual Database Deployment

## 🎯 Deploy to Supabase Dashboard

### Step 1: Access Supabase
1. Go to https://supabase.com/dashboard
2. Login and select project: `ssdzlzlubzcknkoflgyf`
3. Click "SQL Editor" in sidebar
4. Create new query

### Step 2: Copy & Paste the SQL
Copy the ENTIRE contents of `/app/live-streaming-schema.sql` and paste into the SQL editor.

### Step 3: Execute
Click "Run" to execute all the SQL statements.

## 📋 Verification Steps

After running the SQL, verify the tables were created:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('live_streams', 'stream_viewers', 'stream_chat_messages');

-- Check table structure
\d live_streams
\d stream_viewers  
\d stream_chat_messages
```

## 🚀 Expected Results

After successful deployment:
- 3 new tables created: `live_streams`, `stream_viewers`, `stream_chat_messages`
- All RLS policies applied
- Indexes created for performance
- Realtime subscriptions enabled

## ✅ Success Confirmation

When deployment is complete:
1. All streaming APIs will return 200/201 responses instead of 500 errors
2. You can create and manage live streams from the mobile app
3. Real-time chat and viewer tracking will work

## 🆘 If Issues Occur

If you encounter any errors:
1. Copy the error message
2. Try running the SQL in smaller chunks
3. Check if the `profiles` table exists (required dependency)
4. Verify you have proper database permissions
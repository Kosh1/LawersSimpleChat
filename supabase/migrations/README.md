# Database Migrations

This directory contains SQL migrations for the Supabase database.

## Migration Order

Migrations should be applied in chronological order based on the timestamp in the filename:

1. **20241110000000_create_chat_tables.sql** - Creates base chat tables (chat_sessions, chat_messages)
2. **20241111100000_add_projects_and_documents.sql** - Adds projects system (projects, project_documents, links chat_sessions to projects)

## Applying Migrations

### For New Supabase Instances

Run migrations in order:

```bash
# Using Supabase CLI
supabase db push

# Or manually in Supabase SQL Editor
# Copy and paste each migration file in order
```

### For Existing Instances

If you already have chat_sessions and chat_messages tables:
- Skip migration #1 (20241110000000_create_chat_tables.sql)
- Only run migration #2 (20241111100000_add_projects_and_documents.sql)

The migrations use `create table if not exists` and `add column if not exists` to be idempotent and safe to run multiple times.

## Schema Overview

### chat_sessions
- Primary table for chat conversations
- Contains initial message and metadata
- Links to user_id and project_id

### chat_messages
- Individual messages within a session
- Links to chat_sessions via session_id
- Contains role (user/assistant/system) and content

### projects
- Project folders that organize chats
- Contains name, slug, user_id
- Acts as workspace for related chats

### project_documents
- Shared documents within a project
- Automatically included in all chats within the project
- Contains extracted text and metadata

## Important Notes

1. **Always backup your database before running migrations**
2. **Test migrations in a development environment first**
3. **Migrations are designed to be idempotent** (safe to run multiple times)
4. **Database is now the source of truth** - localStorage is used only as a cache for performance

## Data Persistence

With the new architecture:
- ✅ Data persists across browser clears
- ✅ Data accessible from multiple devices
- ✅ No data loss on redeployment
- ✅ localStorage used only as cache for speed


-- Create chat_sessions table
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  initial_message text not null,
  created_at timestamptz not null default timezone('utc', now()),
  utm jsonb,
  document_type text
);

-- Create indexes for chat_sessions
create index if not exists chat_sessions_user_id_idx on public.chat_sessions (user_id);
create index if not exists chat_sessions_created_at_idx on public.chat_sessions (created_at desc);

-- Create chat_messages table
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default timezone('utc', now())
);

-- Create indexes for chat_messages
create index if not exists chat_messages_session_id_idx on public.chat_messages (session_id, created_at asc);
create index if not exists chat_messages_created_at_idx on public.chat_messages (created_at desc);

-- Add comments for documentation
comment on table public.chat_sessions is 'Stores chat sessions with initial metadata';
comment on table public.chat_messages is 'Stores individual messages within chat sessions';
comment on column public.chat_sessions.utm is 'UTM tracking parameters as JSON';
comment on column public.chat_messages.role is 'Message role: user, assistant, or system';


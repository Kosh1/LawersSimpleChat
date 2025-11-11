# AI Legal Assistant UK

A chat-first Next.js application that lets users talk directly with an AI legal assistant for UK matters. The interface mirrors popular LLM chat experiences, keeping the backend conversation logic intact while focusing the frontend entirely on messaging.

## Features

- 💬 Chat-centred UX with persistent conversation history
- 🤖 OpenAI-powered legal assistant tuned for UK law
- 📁 Project folders (“дела”) with shared document context across chats
- 📄 Document ingestion with automatic text extraction
- 💾 Local session storage layered over Supabase persistence
- ➕ One-click new chat creation
- 📱 Responsive layout with dark mode support
- 🔒 Confidential conversations backed by Supabase persistence

## Tech Stack

- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Database**: Supabase
- **AI**: OpenAI GPT-4
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- OpenAI API key
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd lawer-chat-bot
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
```

4. Configure your environment variables in `.env.local`:
```env
OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

5. Set up Supabase database with the following tables:
- `projects`
- `project_documents`
- `chat_sessions` (with `project_id` reference)
- `chat_messages`

6. Run the development server:
```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Schema

### projects
- `id` (uuid, primary key)
- `user_id` (uuid, optional)
- `name` (text)
- `slug` (text, optional, unique per user)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### project_documents
- `id` (uuid, primary key)
- `project_id` (uuid, foreign key → projects.id)
- `name` (text)
- `mime_type` (text)
- `size` (bigint)
- `text` (text)
- `truncated` (boolean)
- `raw_text_length` (integer)
- `strategy` (text)
- `uploaded_at` (timestamptz)
- `checksum` (text, optional)
- `created_at` (timestamptz)

### chat_sessions
- `id` (uuid, primary key)
- `user_id` (uuid, optional)
- `project_id` (uuid, optional foreign key → projects.id)
- `initial_message` (text)
- `created_at` (timestamp)
- `utm` (jsonb, optional)
- `document_type` (text, optional)

### chat_messages
- `id` (uuid, primary key)
- `session_id` (uuid, foreign key)
- `role` (text: 'user' | 'assistant')
- `content` (text)
- `created_at` (timestamp)

## API Endpoints

- `GET /api/projects?userId=<id>` — List user projects
- `POST /api/projects` — Create project folder
- `GET /api/projects/[projectId]` — Fetch project meta
- `PATCH /api/projects/[projectId]` — Update project name/slug
- `DELETE /api/projects/[projectId]` — Delete project
- `GET /api/projects/[projectId]/documents` — List shared documents
- `POST /api/projects/[projectId]/documents` — Upload and extract document
- `DELETE /api/projects/[projectId]/documents/[documentId]` — Remove document
- `GET /api/projects/[projectId]/chats` — List chats within project
- `POST /api/projects/[projectId]/chats` — Create empty chat session
- `POST /api/chat` — Main chat endpoint with project-aware context

## Migration & Backfill

1. Apply the SQL migration in `supabase/migrations/20241111100000_add_projects_and_documents.sql`.
2. Backfill existing chat sessions into default projects:
   ```sql
   with distinct_users as (
     select coalesce(user_id::text, 'anonymous') as user_key
     from public.chat_sessions
     group by user_key
   ),
   created_projects as (
     insert into public.projects (name, user_id)
     select
       case when user_key = 'anonymous' then 'Импортированные дела' else 'Импортированные дела' end,
       nullif(user_key, 'anonymous')::uuid
     from distinct_users
     returning id, coalesce(user_id::text, 'anonymous') as user_key
   )
   update public.chat_sessions cs
   set project_id = cp.id
   from created_projects cp
   where coalesce(cs.user_id::text, 'anonymous') = cp.user_key
     and cs.project_id is null;
   ```
3. Optionally attach shared documents by re-uploading key files to each project via the UI or API.

After migration, run through manual regression:
- Create a new project, upload documents, and verify they are visible in any chat within the folder.
- Start multiple chats in the same project and confirm responses include shared document context.
- Delete a shared document and ensure it no longer appears in chat context.
- Switch between projects on desktop and mobile widths to confirm UI responsiveness.

## Deployment

### Vercel

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

```bash
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@ailegalassistant.uk or create an issue in the repository.

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getSupabase } from '@/lib/supabase';
import type { Database } from '@/lib/types';

function getProjectIdFromRequest(req: NextRequest) {
  const segments = req.nextUrl.pathname.split('/').filter(Boolean);
  const projectsIndex = segments.lastIndexOf('projects');
  if (projectsIndex >= 0 && segments.length > projectsIndex + 1) {
    return segments[projectsIndex + 1];
  }
  return null;
}

export async function GET(req: NextRequest) {
  const projectId = getProjectIdFromRequest(req);
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  try {
    const supabase = getSupabase();

    if (userId) {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', userId)
        .maybeSingle();

      if (projectError || !project) {
        return NextResponse.json({ error: 'Проект не найден или нет доступа.' }, { status: 404 });
      }
    }

    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[project-chats][GET] Supabase error:', error);
      return NextResponse.json({ error: 'Не удалось загрузить чаты проекта.' }, { status: 500 });
    }

    return NextResponse.json({ chats: data ?? [] });
  } catch (error) {
    console.error('[project-chats][GET] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const projectId = getProjectIdFromRequest(req);
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const userId = typeof body?.userId === 'string' ? body.userId.trim() : null;
    const initialMessage =
      typeof body?.initialMessage === 'string' && body.initialMessage.trim()
        ? body.initialMessage.trim()
        : 'Новый чат';

    const supabase = getSupabase();

    if (userId) {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', userId)
        .maybeSingle();

      if (projectError || !project) {
        return NextResponse.json({ error: 'Проект не найден или нет доступа.' }, { status: 404 });
      }
    }

    const now = new Date().toISOString();
    const newSessionId = uuidv4();

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert<Database['public']['Tables']['chat_sessions']['Insert']>([
        {
          id: newSessionId,
          user_id: userId ?? null,
          project_id: projectId,
          initial_message: initialMessage,
          created_at: now,
          utm: null,
          document_type: null,
        },
      ])
      .select('*')
      .single();

    if (error || !data) {
      console.error('[project-chats][POST] Supabase error:', error);
      return NextResponse.json({ error: 'Не удалось создать чат.' }, { status: 500 });
    }

    await supabase.from('projects').update({ updated_at: now }).eq('id', projectId).limit(1);

    return NextResponse.json({ chat: data }, { status: 201 });
  } catch (error) {
    console.error('[project-chats][POST] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


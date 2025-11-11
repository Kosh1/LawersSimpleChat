import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getSupabase } from '@/lib/supabase';
import { mapProject } from '@/lib/projects';
import { slugify } from '@/lib/utils';
import type { Database } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from<'projects'>('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[projects][GET] Supabase error:', error);
      return NextResponse.json({ error: 'Не удалось загрузить проекты.' }, { status: 500 });
    }

    const projects = (data ?? []).map(mapProject);
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('[projects][GET] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const providedSlug = typeof body?.slug === 'string' ? body.slug.trim() : '';
    const userId = typeof body?.userId === 'string' && body.userId.trim() ? body.userId.trim() : null;

    if (!name) {
      return NextResponse.json({ error: 'Название проекта обязательно.' }, { status: 400 });
    }

    const supabase = getSupabase();
    const baseSlug = providedSlug || slugify(name);
    let slugCandidate = baseSlug || uuidv4();

    if (userId) {
      slugCandidate = await ensureProjectSlugIsUnique(supabase, slugCandidate, userId);
    }

    const now = new Date().toISOString();
    const newProject: Database['public']['Tables']['projects']['Insert'] = {
      id: uuidv4(),
      user_id: userId,
      name,
      slug: slugCandidate,
      created_at: now,
      updated_at: now,
    };
    const projectRows: Database['public']['Tables']['projects']['Insert'][] = [newProject];

    const { data, error } = await supabase
      .from<'projects'>('projects')
      .insert(projectRows)
      .select('*')
      .single();

    if (error || !data) {
      console.error('[projects][POST] Supabase error:', error);
      return NextResponse.json({ error: 'Не удалось создать проект.' }, { status: 500 });
    }

    return NextResponse.json({ project: mapProject(data) }, { status: 201 });
  } catch (error) {
    console.error('[projects][POST] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function ensureProjectSlugIsUnique(
  supabase: ReturnType<typeof getSupabase>,
  slugCandidate: string,
  userId: string,
) {
  let candidate = slugCandidate;
  let attempts = 0;

  while (attempts < 5) {
    const { data, error } = await supabase
      .from<'projects'>('projects')
      .select('id')
      .eq('user_id', userId)
      .eq('slug', candidate)
      .maybeSingle();

    if (error) {
      console.warn('[projects][slug] Supabase lookup error:', error);
      break;
    }

    if (!data) {
      return candidate;
    }

    attempts += 1;
    candidate = `${slugCandidate}-${attempts + 1}`;
  }

  return `${slugCandidate}-${uuidv4().slice(0, 8)}`;
}


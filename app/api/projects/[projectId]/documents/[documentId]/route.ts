import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string; documentId: string } },
) {
  const { projectId, documentId } = params;
  const body = await req.json().catch(() => ({}));
  const userId = typeof body?.userId === 'string' ? body.userId.trim() : null;

  if (!projectId || !documentId) {
    return NextResponse.json({ error: 'projectId и documentId обязательны.' }, { status: 400 });
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

    const { error } = await supabase
      .from('project_documents')
      .delete()
      .eq('id', documentId)
      .eq('project_id', projectId);

    if (error) {
      console.error('[project-document][DELETE] Supabase error:', error);
      return NextResponse.json({ error: 'Не удалось удалить документ.' }, { status: 500 });
    }

    const now = new Date().toISOString();
    await supabase.from('projects').update({ updated_at: now }).eq('id', projectId).limit(1);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[project-document][DELETE] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getSupabase } from '@/lib/supabase';
import { extractTextFromDocument } from '@/lib/document-processing';
import { mapProjectDocument } from '@/lib/projects';

export const runtime = 'nodejs';

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

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  try {
    const supabase = getSupabase() as any;
    const { data, error } = await supabase
      .from('project_documents')
      .select('*')
      .eq('project_id', projectId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('[project-documents][GET] Supabase error:', error);
      return NextResponse.json({ error: 'Не удалось получить документы проекта.' }, { status: 500 });
    }

    const documents = (data ?? []).map(mapProjectDocument);
    return NextResponse.json({ documents });
  } catch (error) {
    console.error('[project-documents][GET] Unexpected error:', error);
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
    const formData = await req.formData();
    const file = formData.get('file');
    const userIdRaw = formData.get('userId');
    const userId = typeof userIdRaw === 'string' ? userIdRaw.trim() : null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Файл не найден в запросе.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || 'application/octet-stream';
    const filename = file.name || 'uploaded-document';

    if (buffer.length === 0) {
      return NextResponse.json({ error: 'Пустой файл не может быть обработан.' }, { status: 400 });
    }

    const extraction = await extractTextFromDocument(buffer, mimeType, filename);

    if (!extraction.text) {
      return NextResponse.json(
        { error: 'Не удалось извлечь текст из документа. Попробуйте другой файл или формат.' },
        { status: 422 },
      );
    }

    const supabase = getSupabase() as any;
    const now = new Date().toISOString();

    const newDocument = {
      id: uuidv4(),
      project_id: projectId,
      name: filename,
      mime_type: mimeType,
      size: file.size,
      text: extraction.text,
      truncated: extraction.truncated,
      raw_text_length: extraction.rawTextLength,
      strategy: extraction.strategy,
      uploaded_at: now,
      checksum: null,
      created_at: now,
    };

    const { data, error } = await supabase
      .from('project_documents')
      .insert([newDocument])
      .select('*')
      .single();

    if (error || !data) {
      console.error('[project-documents][POST] Supabase error:', error);
      return NextResponse.json({ error: 'Не удалось сохранить документ.' }, { status: 500 });
    }

    // Touch project updated_at
    let projectUpdate = supabase
      .from('projects')
      .update({ updated_at: now })
      .eq('id', projectId);
    if (userId) {
      projectUpdate = projectUpdate.eq('user_id', userId);
    }
    await projectUpdate;

    return NextResponse.json(
      {
        document: mapProjectDocument(data),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('[project-documents][POST] Unexpected error:', error);
    return NextResponse.json(
      {
        error:
          'Во время обработки документа произошла ошибка. Попробуйте ещё раз или обратитесь в поддержку, если проблема повторяется.',
      },
      { status: 500 },
    );
  }
}


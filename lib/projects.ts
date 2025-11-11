import type { Database, Project, ProjectDocument, SessionDocument } from './types';

type ProjectRow = Database['public']['Tables']['projects']['Row'];
type ProjectDocumentRow = Database['public']['Tables']['project_documents']['Row'];

export function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    user_id: row.user_id ?? undefined,
    name: row.name,
    slug: row.slug ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapProjectDocument(row: ProjectDocumentRow): ProjectDocument {
  return {
    id: row.id,
    project_id: row.project_id,
    name: row.name,
    mimeType: row.mime_type,
    size: row.size,
    text: row.text,
    truncated: row.truncated,
    rawTextLength: row.raw_text_length,
    strategy: (row.strategy as SessionDocument['strategy']) ?? 'text',
    uploadedAt: row.uploaded_at,
  };
}

export function projectDocumentToSessionDocument(row: ProjectDocumentRow): SessionDocument {
  return {
    id: row.id,
    name: row.name,
    mimeType: row.mime_type,
    size: row.size,
    text: row.text,
    truncated: row.truncated,
    rawTextLength: row.raw_text_length,
    strategy: (row.strategy as SessionDocument['strategy']) ?? 'text',
    uploadedAt: row.uploaded_at,
  };
}


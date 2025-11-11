export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SessionDocument {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  text: string;
  truncated: boolean;
  rawTextLength: number;
  strategy: 'text' | 'pdf' | 'docx' | 'vision' | 'llm-file';
  uploadedAt: string;
}

export interface ChatRequestDocument {
  id: string;
  name: string;
  text: string;
}

export interface ChatSession {
  id: string;
  user_id?: string;
  initial_message: string;
  created_at: string;
  utm?: UTMData | null;
  document_type?: string;
}

export interface UTMData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  landing_type?: string;
}

// Supabase database types
export interface Database {
  public: {
    Tables: {
      chat_sessions: {
        Row: {
          id: string;
          user_id: string | null;
          initial_message: string;
          created_at: string;
          utm: any | null;
          document_type: string | null;
        };
        Insert: {
          id: string;
          user_id?: string | null;
          initial_message: string;
          created_at?: string;
          utm?: any | null;
          document_type?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          initial_message?: string;
          created_at?: string;
          utm?: any | null;
          document_type?: string | null;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          session_id: string;
          role: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          role: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          role?: string;
          content?: string;
          created_at?: string;
        };
      };
    };
  };
}
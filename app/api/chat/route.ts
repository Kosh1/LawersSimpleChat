import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/lib/supabase/server';
import { getUKLawyerPrompt } from '@/lib/prompts';
import type { ChatMessage, ChatRequestDocument, UTMData, AIResponseMetadata, SelectedModel } from '@/lib/types';
import { projectDocumentToSessionDocument } from '@/lib/projects';
import { generateAIResponse } from '@/lib/ai-service';

// Ленивая инициализация OpenAI - только при наличии API ключа
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function POST(req: NextRequest) {
  try {
    const {
      messages,
      sessionId,
      userId,
      documents,
      projectId,
      selectedModel,
    }: {
      messages: ChatMessage[];
      sessionId?: string;
      userId?: string;
      documents?: ChatRequestDocument[];
      projectId?: string;
      selectedModel?: SelectedModel;
    } = await req.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    // Extract UTM parameters
    const url = new URL(req.url);
    const utm: UTMData = {};
    url.searchParams.forEach((value, key) => {
      if (key.startsWith('utm_')) {
        utm[key as keyof UTMData] = value;
      }
    });

    const lawyerPrompt = getUKLawyerPrompt();

    const supabase = await createClient();
    let resolvedProjectId = projectId;
    if (!resolvedProjectId && sessionId) {
      try {
        const { data: sessionRow } = await supabase
          .from('chat_sessions')
          .select('project_id')
          .eq('id', sessionId)
          .maybeSingle();
        if (sessionRow?.project_id) {
          resolvedProjectId = sessionRow.project_id;
        }
      } catch (error) {
        console.error('Failed to resolve project for session:', error);
      }
    }

    const sharedDocuments =
      resolvedProjectId != null
        ? await loadProjectDocumentsForContext(supabase, resolvedProjectId)
        : [];

    const combinedDocuments = mergeDocumentsForContext(sharedDocuments, documents);

    // Format messages for OpenAI
    const formattedMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: lawyerPrompt },
      ...messages.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      }))
    ];

    const documentContext = buildDocumentContext(combinedDocuments);
    if (documentContext) {
      formattedMessages.splice(1, 0, {
        role: "system",
        content: documentContext,
      });
    }

    console.log('Sending request to AI service with messages:', formattedMessages)

    // Получаем последнее сообщение пользователя для анализа
    const lastUserMessage = messages[messages.length - 1]?.content || '';

    // --- AI Service call with automatic fallback and chunking ---
    // OpenRouter будет использован первым, если selectedModel указан и OpenRouter доступен
    // В противном случае используется OpenAI с fallback между моделями
    const openaiClient = getOpenAIClient();
    if (!openaiClient) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }
    const aiResponse = await generateAIResponse(
      openaiClient,
      formattedMessages,
      lastUserMessage,
      undefined, // forceModel - используем автоматический выбор
      selectedModel // selectedModel для OpenRouter
    );

    const assistantMessage = aiResponse.content;
    
    // Логирование метаданных ответа
    const metadata: AIResponseMetadata = {
      modelUsed: aiResponse.modelUsed,
      fallbackOccurred: aiResponse.fallbackOccurred,
      fallbackReason: aiResponse.fallbackReason,
      chunksCount: aiResponse.chunksCount,
      totalTokens: aiResponse.totalTokens,
      finishReason: aiResponse.finishReason,
      responseTimeMs: aiResponse.responseTimeMs,
      provider: aiResponse.provider, // Добавляем информацию о провайдере
    };
    
    console.log('AI Response metadata:', metadata);
    
    // Предупреждение если ответ был обрезан даже после chunking
    if (aiResponse.finishReason === 'length') {
      console.warn('Response was truncated even after chunking. Consider reviewing chunking limits.');
    }
    
    // Ensure we have a valid response
    if (!assistantMessage || assistantMessage.trim() === '') {
      console.error('AI Service returned empty response', metadata);
      throw new Error('Empty response from AI Service');
    }

    let currentSessionId = sessionId;

    // Create new session only if it doesn't exist
    if (!currentSessionId) {
      const newSessionId = uuidv4();
      try {
        const newChatSession = {
          id: newSessionId,
          user_id: userId ?? null,
          project_id: resolvedProjectId ?? null,
          initial_message: messages[0].content,
          created_at: new Date().toISOString(),
          utm: utm || null,
        };
        const { error: sessionError } = await supabase
          .from('chat_sessions')
          .insert([
            {
              id: newChatSession.id,
              user_id: newChatSession.user_id,
              project_id: newChatSession.project_id,
              initial_message: newChatSession.initial_message,
              created_at: newChatSession.created_at,
              utm: newChatSession.utm,
            },
          ]);
        if (sessionError) {
          console.error('Error creating session:', sessionError);
        } else {
          currentSessionId = newSessionId;
        }
      } catch (error) {
        console.error('Error with Supabase session creation:', error);
      }
    }

    // Save messages to database
    try {
      if (currentSessionId) {
        const messageRows = [
          {
            session_id: currentSessionId,
            role: 'user',
            content: messages[messages.length - 1].content,
            created_at: new Date().toISOString(),
          },
          {
            session_id: currentSessionId,
            role: 'assistant',
            content: assistantMessage,
            created_at: new Date().toISOString(),
          },
        ];
        const { error: messageError } = await supabase
          .from('chat_messages')
          .insert(messageRows);

        if (messageError) {
          console.error('Error saving messages:', messageError);
        }
      }
    } catch (error) {
      console.error('Error with Supabase message saving:', error);
    }

    return NextResponse.json({
      message: assistantMessage,
      sessionId: currentSessionId,
      projectId: resolvedProjectId,
      metadata, // Включаем метаданные в ответ
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    
    // Provide more specific error information for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

const MAX_CONTEXT_DOCUMENTS = 20;
const MAX_CHARACTERS_PER_DOCUMENT = 50000;

function buildDocumentContext(documents?: ChatRequestDocument[]) {
  if (!Array.isArray(documents) || documents.length === 0) {
    return null;
  }

  const prepared = documents
    .slice(0, MAX_CONTEXT_DOCUMENTS)
    .map((doc: any, index: number) => {
      if (!doc || typeof doc.text !== 'string' || !doc.text.trim()) {
        return null;
      }
      const name = doc.name?.trim() || `Document ${index + 1}`;
      const text = doc.text.length > MAX_CHARACTERS_PER_DOCUMENT
        ? `${doc.text.slice(0, MAX_CHARACTERS_PER_DOCUMENT)}\n\n[Текст усечён для контекста]`
        : doc.text;
      return `Источник: ${name}\n\n${text}`;
    })
    .filter((entry: any): entry is string => Boolean(entry));

  if (prepared.length === 0) {
    return null;
  }

  return `Пользователь загрузил вспомогательные документы. При ответах опирайся на их содержание, но перепроверяй факты. Если данные противоречат законодательству, объясни это. Документы:\n\n${prepared.join('\n\n---\n\n')}`;
}

async function loadProjectDocumentsForContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
) {
  try {
    const { data, error } = await supabase
      .from('project_documents')
      .select('*')
      .eq('project_id', projectId)
      .order('uploaded_at', { ascending: false })
      .limit(MAX_CONTEXT_DOCUMENTS);

    if (error) {
      console.error('Failed to load project documents for context:', error);
      return [];
    }

    return (data ?? []).map(projectDocumentToSessionDocument);
  } catch (error) {
    console.error('Unexpected error while loading project documents:', error);
    return [];
  }
}

function mergeDocumentsForContext(
  sharedDocuments: ReturnType<typeof projectDocumentToSessionDocument>[],
  requestDocuments?: ChatRequestDocument[],
): ChatRequestDocument[] {
  const merged = new Map<string, ChatRequestDocument>();

  sharedDocuments.forEach((doc: any) => {
    if (doc.text?.trim()) {
      merged.set(doc.id, {
        id: doc.id,
        name: doc.name,
        text: doc.text,
      });
    }
  });

  if (Array.isArray(requestDocuments)) {
    requestDocuments.forEach((doc: any) => {
      if (doc?.id && doc.text?.trim()) {
        merged.set(doc.id, {
          id: doc.id,
          name: doc.name,
          text: doc.text,
        });
      }
    });
  }

  return Array.from(merged.values()).slice(0, MAX_CONTEXT_DOCUMENTS);
}

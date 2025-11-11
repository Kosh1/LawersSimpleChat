import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { getSupabase } from '@/lib/supabase';
import { getUKLawyerPrompt } from '@/lib/prompts';
import type { ChatMessage, UTMData } from '@/lib/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { messages, sessionId, userId }: { 
      messages: ChatMessage[], 
      sessionId?: string, 
      userId?: string 
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

    // Format messages for OpenAI
    const formattedMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: lawyerPrompt },
      ...messages.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      }))
    ];

    console.log('Sending request to OpenAI with messages:', formattedMessages)

    // --- OpenAI API call ---
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1", 
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const choice = completion.choices[0];
    let assistantMessage = choice.message?.content || '';

    let currentSessionId = sessionId;

    // Create new session only if it doesn't exist
    if (!currentSessionId) {
      const newSessionId = uuidv4();
      try {
        const supabase = getSupabase();
        const { error: sessionError } = await (supabase as any)
          .from('chat_sessions')
          .insert([
            {
              id: newSessionId,
              user_id: userId || null,
              initial_message: messages[0].content,
              created_at: new Date().toISOString(),
              utm: utm || null,
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
      const supabase = getSupabase();
      const { error: messageError } = await (supabase as any)
        .from('chat_messages')
        .insert([
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
          }
        ]);
      
      if (messageError) {
        console.error('Error saving messages:', messageError);
      }
    } catch (error) {
      console.error('Error with Supabase message saving:', error);
    }

    return NextResponse.json({
      message: assistantMessage,
      sessionId: currentSessionId,
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * OpenRouter client wrapper
 * OpenRouter provides a unified API for accessing multiple AI models
 * Compatible with OpenAI SDK
 */

import OpenAI from 'openai';

/**
 * Creates an OpenRouter client instance
 * OpenRouter uses OpenAI-compatible API with a different base URL
 */
export function createOpenRouterClient(): OpenAI | null {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.warn('[OpenRouter] API key not found, OpenRouter will not be available');
    return null;
  }

  return new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000',
      'X-Title': 'Lawyer Chat Bot',
    },
  });
}

/**
 * Checks if OpenRouter is available (API key is configured)
 */
export function isOpenRouterAvailable(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}


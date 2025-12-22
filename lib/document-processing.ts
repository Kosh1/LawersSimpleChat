// NOTE: На Cloudflare Edge Runtime Node.js-специфичные библиотеки недоступны
// Используем динамические импорты и fallback через OpenAI API
// 
// Функция для получения расширения файла без использования модуля 'path'
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot >= 0 ? filename.substring(lastDot).toLowerCase() : '';
}

// Динамический импорт OpenAI
let openaiModule: typeof import('openai') | null = null;
async function getOpenAIModule() {
  if (!openaiModule) {
    openaiModule = await import('openai');
  }
  return openaiModule;
}

// Ленивая инициализация OpenAI - только при наличии API ключа
async function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  const OpenAI = (await getOpenAIModule()).default;
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

const MAX_DOCUMENT_TEXT_LENGTH = 18000;
const MIN_TEXT_LENGTH_FOR_SUCCESS = 80;

export type ExtractedDocument = {
  text: string;
  rawTextLength: number;
  truncated: boolean;
  strategy: 'text' | 'pdf' | 'docx' | 'doc' | 'vision' | 'llm-file';
};

export async function extractTextFromDocument(buffer: Buffer, mimeType: string, filename: string): Promise<ExtractedDocument> {
  const extension = getFileExtension(filename);

  if (isPlainText(mimeType, extension)) {
    const text = buffer.toString('utf-8');
    return normalizeResult(text, 'text');
  }

  if (isDocx(mimeType, extension)) {
    const docxResult = await extractDocx(buffer);
    if (docxResult) {
      return normalizeResult(docxResult, 'docx');
    }
    const llmResult = await extractWithFileAttachment(buffer, filename);
    return normalizeResult(llmResult, 'llm-file');
  }

  if (isDoc(mimeType, extension)) {
    const docResult = await extractDoc(buffer);
    if (docResult) {
      return normalizeResult(docResult, 'doc');
    }
    const llmResult = await extractWithFileAttachment(buffer, filename);
    return normalizeResult(llmResult, 'llm-file');
  }

  if (isPdf(mimeType, extension)) {
    const pdfResult = await extractPdf(buffer);
    if (pdfResult && pdfResult.length >= MIN_TEXT_LENGTH_FOR_SUCCESS) {
      return normalizeResult(pdfResult, 'pdf');
    }
    const llmResult = await extractWithFileAttachment(buffer, filename);
    return normalizeResult(llmResult, 'llm-file');
  }

  if (isImage(mimeType, extension)) {
    const visionResult = await extractWithVision(buffer, mimeType, filename);
    return normalizeResult(visionResult, 'vision');
  }

  const llmResult = await extractWithFileAttachment(buffer, filename);
  return normalizeResult(llmResult, 'llm-file');
}

function isPlainText(mimeType: string, extension: string) {
  return mimeType.startsWith('text/') || ['.txt', '.md', '.csv', '.json'].includes(extension);
}

function isDocx(mimeType: string, extension: string) {
  return (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    extension === '.docx'
  );
}

function isDoc(mimeType: string, extension: string) {
  return mimeType === 'application/msword' || extension === '.doc';
}

function isPdf(mimeType: string, extension: string) {
  return mimeType === 'application/pdf' || extension === '.pdf';
}

function isImage(mimeType: string, extension: string) {
  return mimeType.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.heic'].includes(extension);
}

async function extractDocx(_buffer: Buffer) {
  // На Edge Runtime Node.js-специфичные библиотеки недоступны
  // Всегда возвращаем пустую строку, чтобы использовать fallback через OpenAI API
  return '';
}

async function extractDoc(_buffer: Buffer) {
  // На Edge Runtime Node.js-специфичные библиотеки недоступны
  // Всегда возвращаем пустую строку, чтобы использовать fallback через OpenAI API
  return '';
}

async function extractPdf(_buffer: Buffer) {
  // На Edge Runtime Node.js-специфичные библиотеки недоступны
  // Всегда возвращаем пустую строку, чтобы использовать fallback через OpenAI API
  return '';
}

async function extractWithVision(buffer: Buffer, mimeType: string, filename: string) {
  const openai = await getOpenAIClient();
  if (!openai) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  const base64 = buffer.toString('base64');
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_VISION_MODEL ?? 'gpt-4.1-mini',
    temperature: 0,
    max_tokens: 2000,
    messages: [
      {
        role: 'system',
        content:
          'You are a precise transcription assistant. Extract all legible text from provided legal document images. Preserve the original wording and paragraph structure when possible.',
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Transcribe the text content from this document image: ${filename}. Return only the text.`,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64}`,
            },
          },
        ],
      },
    ],
  });

  return extractContentFromCompletion(completion.choices[0].message?.content);
}

async function extractWithFileAttachment(buffer: Buffer, filename: string) {
  const openai = await getOpenAIClient();
  if (!openai) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  const { toFile } = await import('openai/uploads');
  const upload = await openai.files.create({
    file: await toFile(buffer, filename),
    purpose: 'assistants',
  });

  try {
    const response = await openai.responses.create({
      model: process.env.OPENAI_EXTRACTION_MODEL ?? 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: 'You are a meticulous legal transcription assistant. Extract the complete plain text from provided documents without adding commentary.',
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `Read the attached document "${filename}" and return only its textual content.`,
            },
            {
              type: 'input_file',
              file_id: upload.id,
            },
          ],
        },
      ],
      temperature: 0,
    });

    const text = response.output_text ?? '';
    return text.trim();
  } finally {
    try {
      await openai.files.del(upload.id);
    } catch (error) {
      console.warn('Failed to delete uploaded file from OpenAI:', error);
    }
  }
}

function extractContentFromCompletion(content: unknown): string {
  if (!content) return '';
  if (typeof content === 'string') {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((item: any) => {
        if (typeof item === 'string') {
          return item;
        }
        if (item && typeof item === 'object' && 'text' in item) {
          return String(item.text);
        }
        return '';
      })
      .join('\n')
      .trim();
  }

  return '';
}

function normalizeResult(rawText: string, strategy: ExtractedDocument['strategy']): ExtractedDocument {
  const cleaned = rawText.replace(/\u0000/g, '').trim();
  const truncated = cleaned.length > MAX_DOCUMENT_TEXT_LENGTH;
  const text = truncated ? cleaned.slice(0, MAX_DOCUMENT_TEXT_LENGTH) : cleaned;
  return {
    text,
    rawTextLength: cleaned.length,
    truncated,
    strategy,
  };
}

// Функция ensureOpenAIKey удалена - теперь используется getOpenAIClient()


/**
 * Конфигурация моделей AI с приоритизацией и параметрами
 * 
 * ВАЖНО: Измените имена моделей в соответствии с вашим доступом к OpenAI API
 * 
 * ============================================
 * ПОЛНЫЙ СПИСОК АКТУАЛЬНЫХ ИМЕН МОДЕЛЕЙ:
 * ============================================
 * 
 * GPT-5 (если доступны):
 * - 'gpt-5' - основная модель GPT-5
 * - 'gpt-5-mini' - облегченная версия GPT-5
 * - 'gpt-5-nano' - максимально быстрая версия
 * - 'gpt-5-chat-latest' - последняя chat версия
 * 
 * O1 Reasoning Models (есть ограничения):
 * - 'o1-preview' - preview версия O1
 * - 'o1-mini' - облегченная версия O1
 * - 'o1-2024-12-17' - версия с датой
 * ВАЖНО для O1: не поддерживают temperature, используют developer вместо system messages
 * 
 * GPT-4o (текущие стабильные):
 * - 'gpt-4o' - основная модель GPT-4o
 * - 'gpt-4o-2024-11-20' - версия от ноября 2024
 * - 'gpt-4o-2024-08-06' - версия от августа 2024
 * - 'gpt-4o-mini' - облегченная версия
 * - 'gpt-4o-mini-2024-07-18' - версия mini с датой
 * 
 * GPT-4 Turbo:
 * - 'gpt-4-turbo' - основная turbo модель
 * - 'gpt-4-turbo-2024-04-09' - версия от апреля 2024
 * - 'gpt-4-turbo-preview' - preview версия
 * - 'gpt-4-0125-preview' - preview от января 2024
 * 
 * GPT-4 (базовые):
 * - 'gpt-4' - базовая GPT-4
 * - 'gpt-4-0613' - версия от июня 2023
 * 
 * Проверить доступные модели: https://platform.openai.com/playground
 */

export type ModelName = 'primary' | 'reasoning' | 'fallback';

export interface ModelConfig {
  /** Имя модели для OpenAI API */
  name: string;
  /** Максимальное количество токенов для ответа */
  maxTokens: number;
  /** Максимальное контекстное окно (токенов) */
  contextWindow: number;
  /** Температура (0-2), undefined если модель не поддерживает */
  temperature?: number;
  /** Параметр для O1 моделей: max_completion_tokens вместо max_tokens */
  useMaxCompletionTokens?: boolean;
  /** Усилие reasoning (только для моделей с поддержкой) */
  reasoningEffort?: 'low' | 'medium' | 'high';
  /** Уровень детализации (только для моделей с поддержкой) */
  verbosity?: 'low' | 'medium' | 'high';
  /** Поддерживает ли system messages */
  supportsSystemMessages: boolean;
  /** Использовать developer message вместо system (для O1) */
  useDeveloperMessage?: boolean;
  /** Приоритет (чем меньше число, тем выше приоритет) */
  priority: number;
  /** Описание модели */
  description: string;
}

/**
 * Конфигурация всех доступных моделей
 * 
 * ============================================
 * ВЫБЕРИТЕ ОДИН ИЗ ВАРИАНТОВ КОНФИГУРАЦИИ:
 * ============================================
 * 
 * ВАРИАНТ 1: GPT-5 (если у вас есть доступ)
 * ВАРИАНТ 2: O1 Reasoning Models (o1-preview, o1-mini)
 * ВАРИАНТ 3: GPT-4o (текущие стабильные модели)
 * 
 * Раскомментируйте нужный вариант ниже!
 */

// ============================================
// ВАРИАНТ 1: GPT-5 MODELS (если доступны)
// ============================================
export const MODEL_CONFIGS: Record<ModelName, ModelConfig> = {
  'primary': {
    name: 'gpt-5', // Полное имя: 'gpt-5' или 'gpt-5-chat-latest'
    maxTokens: 32000,
    contextWindow: 400000,
    temperature: undefined, // GPT-5 НЕ поддерживает temperature - только дефолтное значение
    useMaxCompletionTokens: true, // КРИТИЧНО: новые модели требуют max_completion_tokens вместо max_tokens
    reasoningEffort: 'medium',
    verbosity: 'medium',
    supportsSystemMessages: true,
    priority: 1,
    description: 'GPT-5 основная модель с балансом скорости и качества',
  },
  'reasoning': {
    name: 'gpt-5', // Полное имя: 'gpt-5' или 'gpt-5-mini' для reasoning
    maxTokens: 32000,
    contextWindow: 400000,
    temperature: undefined, // GPT-5 НЕ поддерживает temperature - только дефолтное значение
    useMaxCompletionTokens: true, // КРИТИЧНО: новые модели требуют max_completion_tokens вместо max_tokens
    reasoningEffort: 'high',
    verbosity: 'high',
    supportsSystemMessages: true,
    priority: 0,
    description: 'GPT-5 режим глубокого анализа для сложных юридических задач',
  },
  'fallback': {
    name: 'gpt-4.1', // Полное имя: 'gpt-4-turbo' или 'gpt-4-turbo-2024-04-09'
    maxTokens: 32000,
    contextWindow: 128000,
    temperature: 0.7,
    // useMaxCompletionTokens НЕ нужен для gpt-4.1 - работает с обычным max_tokens
    supportsSystemMessages: true,
    priority: 2,
    description: 'GPT-4.1 - быстрая и надежная fallback модель',
  },
};

// ============================================
// ВАРИАНТ 2: O1 REASONING MODELS
// Раскомментируйте этот блок если хотите использовать O1
// ============================================
/*
export const MODEL_CONFIGS: Record<ModelName, ModelConfig> = {
  'primary': {
    name: 'gpt-4o', // Полное имя: 'gpt-4o' или 'gpt-4o-2024-08-06' или 'gpt-4o-2024-11-20'
    maxTokens: 16000,
    contextWindow: 128000,
    temperature: 0.7,
    supportsSystemMessages: true,
    priority: 1,
    description: 'GPT-4o основная быстрая модель для обычных задач',
  },
  'reasoning': {
    name: 'o1-preview', // Полное имя: 'o1-preview' или 'o1-mini' или 'o1-2024-12-17'
    maxTokens: 32000,
    contextWindow: 128000,
    // О1 НЕ поддерживает temperature!
    temperature: undefined,
    useMaxCompletionTokens: true, // O1 использует max_completion_tokens
    supportsSystemMessages: false, // O1 не поддерживает system messages
    useDeveloperMessage: true, // O1 использует developer message
    priority: 0,
    description: 'O1-preview для глубокого reasoning и сложных юридических задач',
  },
  'fallback': {
    name: 'gpt-4-turbo', // Полное имя: 'gpt-4-turbo' или 'gpt-4-turbo-2024-04-09' или 'gpt-4-turbo-preview'
    maxTokens: 16000,
    contextWindow: 128000,
    temperature: 0.7,
    supportsSystemMessages: true,
    priority: 2,
    description: 'GPT-4 Turbo - надежная fallback модель',
  },
};
*/

// ============================================
// ВАРИАНТ 3: GPT-4O MODELS (стабильные, доступны всем)
// Раскомментируйте этот блок если хотите использовать GPT-4o
// ============================================
/*
export const MODEL_CONFIGS: Record<ModelName, ModelConfig> = {
  'primary': {
    name: 'gpt-4o', // Полное имя: 'gpt-4o' или 'gpt-4o-2024-08-06' или 'gpt-4o-2024-11-20'
    maxTokens: 16000,
    contextWindow: 128000,
    temperature: 0.7,
    supportsSystemMessages: true,
    priority: 1,
    description: 'GPT-4o основная стабильная модель для большинства задач',
  },
  'reasoning': {
    name: 'gpt-4o', // Полное имя: 'gpt-4o' - та же модель с детальными промптами
    maxTokens: 16000,
    contextWindow: 128000,
    temperature: 0.7,
    supportsSystemMessages: true,
    priority: 0,
    description: 'GPT-4o для сложных юридических задач с детальным анализом',
  },
  'fallback': {
    name: 'gpt-4-turbo', // Полное имя: 'gpt-4-turbo' или 'gpt-4-turbo-2024-04-09' или 'gpt-4-turbo-preview'
    maxTokens: 16000,
    contextWindow: 128000,
    temperature: 0.7,
    supportsSystemMessages: true,
    priority: 2,
    description: 'GPT-4 Turbo - проверенная fallback модель',
  },
};
*/

/**
 * Ключевые слова для определения необходимости глубокого reasoning
 */
export const REASONING_KEYWORDS = [
  'проанализируй',
  'анализ',
  'стратегия',
  'стратегию',
  'риски',
  'рисков',
  'подготовь',
  'подготовить',
  'жалоб',
  'жалобу',
  'апелляц',
  'кассац',
  'иск',
  'ходатайств',
  'заявлени',
  'обоснова',
  'аргумент',
  'доказательств',
  'правов',
  'норм',
  'статей',
  'статью',
  'законодательств',
  'судебн',
  'процессуальн',
  'дополнени',
  'не менее',
  'слов',
  'токенов',
  'больш',
  'глубок',
  'детальн',
  'подробн',
];

/**
 * Минимальная длина запроса (в символах) для использования thinking модели
 */
export const MIN_QUERY_LENGTH_FOR_THINKING = 200;

/**
 * Минимальная ожидаемая длина ответа (в словах) для использования thinking модели
 */
export const MIN_EXPECTED_RESPONSE_WORDS = 5000;

/**
 * Определяет, нужна ли модель с глубоким reasoning
 * @param userMessage - сообщение пользователя
 * @returns true если нужна thinking модель
 */
export function shouldUseThinkingModel(userMessage: string): boolean {
  const messageLower = userMessage.toLowerCase();
  
  // Проверка на длину запроса
  if (userMessage.length > MIN_QUERY_LENGTH_FOR_THINKING) {
    return true;
  }
  
  // Проверка на ключевые слова
  const hasReasoningKeywords = REASONING_KEYWORDS.some(keyword => 
    messageLower.includes(keyword)
  );
  
  if (hasReasoningKeywords) {
    return true;
  }
  
  // Проверка на запрос большого количества текста
  const wordsMatch = messageLower.match(/(\d+)\s*(слов|токен|знак)/);
  if (wordsMatch) {
    const requestedAmount = parseInt(wordsMatch[1], 10);
    if (requestedAmount >= MIN_EXPECTED_RESPONSE_WORDS) {
      return true;
    }
  }
  
  return false;
}

/**
 * Получает конфигурацию модели по имени
 */
export function getModelConfig(modelName: ModelName): ModelConfig {
  return MODEL_CONFIGS[modelName];
}

/**
 * Определяет, какую модель использовать для запроса
 * @param userMessage - сообщение пользователя
 * @param forceModel - принудительный выбор модели
 * @returns имя модели для использования
 */
export function selectModel(
  userMessage: string,
  forceModel?: ModelName
): ModelName {
  if (forceModel) {
    return forceModel;
  }
  
  // Если нужен глубокий анализ - используем reasoning модель
  if (shouldUseThinkingModel(userMessage)) {
    return 'reasoning';
  }
  
  // Иначе используем основную модель
  return 'primary';
}

/**
 * Получает список моделей для fallback в порядке приоритета
 * @param primaryModel - основная модель
 * @returns массив моделей для fallback
 */
export function getFallbackModels(primaryModel: ModelName): ModelName[] {
  const allModels: ModelName[] = ['reasoning', 'primary', 'fallback'];
  
  // Убираем основную модель и сортируем по приоритету
  return allModels
    .filter(m => m !== primaryModel)
    .sort((a, b) => {
      const configA = MODEL_CONFIGS[a];
      const configB = MODEL_CONFIGS[b];
      return configA.priority - configB.priority;
    });
}


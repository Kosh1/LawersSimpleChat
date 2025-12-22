import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Проверяем наличие переменных окружения (могут отсутствовать во время сборки)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Если переменные отсутствуют, возвращаем null вместо падения
  // Это позволит сборке пройти успешно, а ошибки будут во время выполнения
  if (!supabaseUrl || !supabaseAnonKey) {
    // Во время сборки просто вернем заглушку
    // В реальном времени это не должно происходить
    throw new Error('Supabase environment variables are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}


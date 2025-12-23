# GitHub Actions Workflows

## Deploy to Yandex Cloud

Workflow для автоматического деплоя в Yandex Cloud Object Storage при пуше в ветки `main` или `master`.

### Настройка

1. **Создайте секреты в GitHub:**
   - `YC_KEY_ID` - Access Key ID для Yandex Cloud
   - `YC_SECRET_KEY` - Secret Access Key для Yandex Cloud
   - `YC_BUCKET_NAME` - Имя S3-бакета в Yandex Cloud
   - `NEXT_PUBLIC_SUPABASE_URL` - URL вашего Supabase проекта
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon Key для Supabase
   - `NEXT_PUBLIC_SITE_URL` - URL вашего сайта
   - `OPENROUTER_API_KEY` - API ключ OpenRouter (опционально)
   - `OPENAI_API_KEY` - API ключ OpenAI (опционально)

2. **Для статического экспорта Next.js:**
   
   Если вы хотите деплоить статический сайт в S3, добавьте в `next.config.mjs`:
   ```js
   const nextConfig = {
     output: 'export',
     // ... остальная конфигурация
   };
   ```
   
   ⚠️ **Важно:** Статический экспорт отключает API routes и серверные функции. Если вам нужны API routes, рассмотрите альтернативные варианты деплоя (Yandex Cloud Functions, сервер и т.д.).

3. **Настройка бакета:**
   - Создайте бакет в Yandex Cloud Object Storage
   - Настройте публичный доступ для статических файлов
   - Настройте CORS, если необходимо

### Использование

Workflow автоматически запускается при пуше в ветки `main` или `master`. 

Процесс:
1. Проверка кода
2. Установка зависимостей
3. Сборка проекта
4. Деплой в Yandex Cloud Object Storage


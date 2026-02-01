# GitHub Actions Workflows

## Deploy to Yandex Cloud

Workflow для автоматического деплоя в Yandex Cloud Object Storage при пуше в ветки `main` или `master`.

### Настройка

Откройте **Settings** → **Security** → **Secrets and variables** → **Actions**.

1. **Variables** (вкладка Variables — не секреты, используются при сборке):
   - `NEXT_PUBLIC_SUPABASE_URL` — URL проекта Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Anon Key Supabase
   - `NEXT_PUBLIC_SITE_URL` — URL сайта (например `https://your-domain.com`)
   - `OPENROUTER_API_KEY` — API ключ OpenRouter
   - `OPENAI_API_KEY` — API ключ OpenAI (опционально)
   - `NEXT_PUBLIC_PROXY_URL` — URL прокси (опционально)
   - `NEXT_PUBLIC_ENABLE_SIGNUP` — `true` или `false` (опционально, по умолчанию `false`)

2. **Secrets** (вкладка Secrets — конфиденциальные данные):
   - `YC_SA_JSON` — JSON-ключ сервисного аккаунта Yandex Cloud (целиком)
   - `YC_CLOUD_ID` — Cloud ID
   - `YC_FOLDER_ID` — Folder ID
   - `YC_REGISTRY_ID` — ID Container Registry
   - `YC_SERVICE_ACCOUNT_ID` — ID сервисного аккаунта для Serverless Container

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


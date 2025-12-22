# Быстрый деплой на Cloudflare Pages

## Проблема с локальной сборкой

Из-за конфликтов зависимостей (esbuild) локальная сборка через `npx @cloudflare/next-on-pages` может не работать. Рекомендуется использовать **автоматический деплой через GitHub**.

## Автоматический деплой через GitHub (рекомендуется)

### Шаг 1: Убедитесь, что код в GitHub

```bash
git add .
git commit -m "Add Cloudflare Pages support"
git push
```

### Шаг 2: Создайте проект в Cloudflare Pages

1. Войдите в [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Перейдите в **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
3. Авторизуйтесь через GitHub
4. Выберите репозиторий `lawer-chat-bot`

### Шаг 3: Настройте Build settings

В настройках сборки укажите:

- **Framework preset**: `Next.js`
- **Build command**: `npm run build && npx @cloudflare/next-on-pages@latest`
  
  **Важно**: Файл `.npmrc` в корне репозитория содержит `legacy-peer-deps=true`, что автоматически применяется при установке зависимостей на Cloudflare Pages.
- **Build output directory**: `.vercel/output/static`
- **Root directory**: `/` (оставьте пустым)
- **Node.js version**: `18` или `20`

### Шаг 4: Настройте переменные окружения

В разделе **Environment variables** добавьте все переменные из `.env.local`:

- `OPENAI_API_KEY`
- `OPENROUTER_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (укажите домен Cloudflare Pages, например `https://your-project.pages.dev`)
- `NEXT_PUBLIC_ENABLE_SIGNUP`
- `NEXT_PUBLIC_PROXY_URL` (опционально)

**Важно**: Добавьте переменные для всех окружений (Production, Preview, Development).

### Шаг 5: Деплой

1. Нажмите **Save and Deploy**
2. Cloudflare автоматически выполнит сборку и деплой
3. После завершения вы получите URL вида `https://your-project.pages.dev`

## Альтернативный вариант: Исправление локальной сборки

Если нужно исправить локальную сборку, попробуйте:

```bash
# Очистить зависимости
rm -rf node_modules package-lock.json

# Переустановить
npm install

# Установить Cloudflare зависимости
npm install --save-dev @cloudflare/next-on-pages@latest wrangler@latest --legacy-peer-deps

# Попробовать сборку
npm run build:cf
```

Если это не помогает, используйте автоматический деплой через GitHub (рекомендуется).

## Проверка после деплоя

После успешного деплоя проверьте:

1. ✅ Главная страница загружается
2. ✅ Аутентификация работает (Supabase)
3. ✅ API routes работают (`/api/chat`, `/api/projects`)
4. ✅ Загрузка документов работает (может использовать OpenAI fallback на Cloudflare)

## Откат на Vercel

Если нужно вернуться на Vercel:

1. Измените DNS записи обратно на Vercel
2. Vercel проект остается активным и заработает сразу

Подробнее см. [docs/CLOUDFLARE_MIGRATION.md](docs/CLOUDFLARE_MIGRATION.md)


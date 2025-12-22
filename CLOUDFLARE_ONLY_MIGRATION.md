# Миграция на Cloudflare Pages (чистая версия)

Этот проект полностью настроен для деплоя на Cloudflare Pages. Все упоминания Vercel удалены.

## ✅ Что было сделано

### 1. Удалены файлы Vercel
- ❌ `vercel.json` - удален

### 2. Обновлена конфигурация
- ✅ `next.config.mjs` - убрана условная логика для Vercel, оставлена только для Cloudflare
- ✅ `package.json` - добавлены скрипты для Cloudflare Pages (`build:cf`, `pages:dev`, `pages:deploy`)
- ✅ `wrangler.toml` - создан конфиг для Cloudflare Pages

### 3. Обновлена документация
- ✅ `README.md` - обновлена секция Deployment для Cloudflare Pages
- ✅ `docs/CLOUDFLARE_MIGRATION.md` - переписан как основная документация для Cloudflare
- ✅ `docs/PROXY_SETUP.md` - заменены упоминания Vercel на Cloudflare Pages
- ✅ `docs/DATA_PERSISTENCE_FIX.md` - обновлены упоминания платформы

### 4. Обновлены файлы конфигурации
- ✅ `app/layout.tsx` - обновлен metadataBase для Cloudflare Pages домена
- ✅ `nginx-proxy.conf` - заменены упоминания Vercel на Cloudflare Pages

### 5. Резервная копия
- ✅ Создана полная копия проекта: `/Users/ilakoseev/lawer-chat-bot-vercel-backup`

## 🚀 Деплой на Cloudflare Pages

### Настройки в Cloudflare Dashboard

1. **Build command**: `npm run build && npx @cloudflare/next-on-pages@latest`
2. **Build output directory**: `.vercel/output/static`
3. **Deploy command**: `echo "Cloudflare Pages will automatically deploy from .vercel/output/static"`
4. **Node.js version**: 18 или 20

### Переменные окружения

Установите в Cloudflare Pages Dashboard → Settings → Environment variables:

- `OPENAI_API_KEY`
- `OPENROUTER_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (укажите домен Cloudflare Pages)
- `NEXT_PUBLIC_ENABLE_SIGNUP`
- `NEXT_PUBLIC_PROXY_URL` (опционально)

### Команды для локальной разработки

```bash
# Обычная разработка
npm run dev

# Сборка для Cloudflare Pages
npm run build:cf

# Локальный запуск с Cloudflare Workers runtime
npm run pages:dev

# Деплой на Cloudflare Pages
npm run pages:deploy
```

## 📝 Важные замечания

1. **Директория `.vercel/output/static`** - это стандартное имя, которое создает `@cloudflare/next-on-pages`. Не связано с платформой Vercel.

2. **Обработка документов** - на Cloudflare Pages Node.js-специфичные библиотеки могут не работать, поэтому автоматически используется fallback через OpenAI API.

3. **Middleware и API routes** - работают через Cloudflare Workers runtime, полностью совместимы.

## 🔄 Откат к версии для Vercel

Если нужно вернуться к версии для Vercel:
1. Используйте резервную копию: `/Users/ilakoseev/lawer-chat-bot-vercel-backup`
2. Или восстановите `vercel.json` из git истории

## 📚 Дополнительная документация

- `docs/CLOUDFLARE_MIGRATION.md` - полная документация по деплою
- `DEPLOY_CLOUDFLARE.md` - быстрая инструкция по деплою
- `CLOUDFLARE_STATUS.md` - статус миграции


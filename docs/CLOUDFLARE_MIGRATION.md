# Миграция на Cloudflare Pages

Этот документ описывает процесс миграции проекта с Vercel на Cloudflare Pages и обратно.

## Текущая конфигурация

- **Vercel**: Основная платформа развертывания (сохраняется для отката)
- **Cloudflare Pages**: Новая платформа развертывания

## Особенности и ограничения

### Совместимость с Cloudflare Workers

Проект использует следующие компоненты, которые могут работать по-разному на Cloudflare Pages:

1. **API Routes с `runtime = 'nodejs'`**
   - На Cloudflare Pages все API routes работают в Cloudflare Workers runtime
   - Node.js-специфичные библиотеки (`pdf-parse`, `mammoth`, `word-extractor`) могут не работать
   - **Решение**: Автоматически используется fallback через OpenAI API для обработки документов

2. **Buffer API**
   - Поддерживается через полифиллы в `@cloudflare/next-on-pages`

3. **Middleware**
   - Работает на Cloudflare Pages

4. **Supabase SSR**
   - Полностью совместим с Cloudflare Pages

## Настройка Cloudflare Pages

### 1. Установка зависимостей

```bash
npm install --save-dev @cloudflare/next-on-pages wrangler
```

**Примечание**: Если возникают проблемы с установкой из-за конфликтов зависимостей, попробуйте:
- Удалить `node_modules` и `package-lock.json`
- Выполнить `npm install` заново
- Затем установить Cloudflare зависимости

### 2. Переменные окружения

Настройте переменные окружения в Cloudflare Pages Dashboard:

1. Перейдите в ваш проект Cloudflare Pages
2. Откройте **Settings** → **Environment variables**
3. Добавьте следующие переменные для **Production**, **Preview** и **Development**:

```env
# OpenAI API Key (used as fallback if OpenRouter fails)
OPENAI_API_KEY=your_openai_api_key_here

# OpenRouter API Key (primary AI provider)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://your-cloudflare-pages-domain.pages.dev

# Authentication Configuration
NEXT_PUBLIC_ENABLE_SIGNUP=false

# Proxy Configuration (optional)
# NEXT_PUBLIC_PROXY_URL=https://proxy.your-domain.com
```

**Важно**: 
- `NEXT_PUBLIC_SITE_URL` должен указывать на домен Cloudflare Pages
- Все переменные с префиксом `NEXT_PUBLIC_` должны быть одинаковыми на всех платформах

### 3. Настройка деплоя

#### Вариант A: Автоматический деплой через GitHub

1. Подключите репозиторий к Cloudflare Pages
2. Настройте Build settings:
   - **Build command**: `npm run build:cf`
   - **Build output directory**: `.vercel/output/static` (создается автоматически после сборки)
   - **Root directory**: `/` (или оставьте пустым)
   - **Node.js version**: `18` или выше

#### Вариант B: Ручной деплой через Wrangler CLI

```bash
# Локальная сборка
npm run build:cf

# Локальная разработка
npm run pages:dev

# Деплой на Cloudflare Pages
npm run pages:deploy
```

### 4. Настройка домена

1. В Cloudflare Pages Dashboard перейдите в **Custom domains**
2. Добавьте ваш домен
3. Следуйте инструкциям по обновлению DNS записей

**Совет**: Для тестирования используйте разные поддомены:
- `cf.yourdomain.com` → Cloudflare Pages
- Основной домен → Vercel (до переключения)

## Откат на Vercel

Если нужно вернуться на Vercel:

### Быстрый откат (переключение DNS)

1. В настройках DNS вашего домена измените A/CNAME записи обратно на Vercel
2. Vercel проект остается активным и работает сразу после обновления DNS

### Полный откат

1. Убедитесь, что `vercel.json` находится в репозитории (он уже там)
2. Проверьте переменные окружения в Vercel Dashboard
3. При необходимости выполните новый деплой на Vercel

## Сравнение платформ

| Характеристика | Vercel | Cloudflare Pages |
|----------------|--------|------------------|
| Node.js runtime API routes | ✅ Полная поддержка | ⚠️ Workers runtime (ограничения) |
| Обработка документов (pdf-parse, mammoth) | ✅ Работает | ⚠️ Fallback через OpenAI API |
| Middleware | ✅ Работает | ✅ Работает |
| Supabase SSR | ✅ Работает | ✅ Работает |
| Edge Functions | ✅ Vercel Edge | ✅ Cloudflare Workers |
| Географическое распределение | ✅ Глобально | ✅ Глобально (лучшее покрытие) |
| Стоимость | Зависит от плана | Зависит от плана |

## Тестирование

После деплоя на Cloudflare Pages обязательно протестируйте:

1. ✅ Аутентификация (Supabase)
2. ✅ Загрузка и обработка документов
3. ✅ API routes (чаты, проекты)
4. ✅ Middleware
5. ✅ Статические страницы

### Обработка документов на Cloudflare

На Cloudflare Pages обработка документов работает следующим образом:

1. **Попытка использовать локальные библиотеки** (pdf-parse, mammoth, word-extractor)
2. **Если библиотеки недоступны или выдают ошибку** → автоматически используется OpenAI API через `extractWithFileAttachment()`

Это означает, что:
- На Vercel: используется быстрая локальная обработка
- На Cloudflare: используется OpenAI API (может быть медленнее, но работает)

## Рекомендации

1. **Тестирование перед переключением DNS**: Используйте preview-домены Cloudflare Pages для тестирования
2. **Мониторинг**: Следите за ошибками в Cloudflare Dashboard после миграции
3. **Производительность**: Сравните время обработки документов на обеих платформах
4. **Резервное копирование**: Держите Vercel проект активным минимум месяц после миграции

## Полезные команды

```bash
# Сборка для Cloudflare Pages
npm run build:cf

# Локальная разработка с Cloudflare Workers
npm run pages:dev

# Деплой на Cloudflare Pages
npm run pages:deploy

# Обычная сборка для Vercel
npm run build

# Локальная разработка
npm run dev
```

## Troubleshooting

### Ошибки при сборке для Cloudflare

Если возникают ошибки при сборке:

1. Проверьте версию Node.js (рекомендуется 18+)
2. Очистите кэш: `rm -rf .next .vercel node_modules`
3. Переустановите зависимости: `npm install`
4. Попробуйте сборку заново: `npm run build:cf`

### API routes не работают

- Убедитесь, что переменные окружения настроены правильно
- Проверьте логи в Cloudflare Dashboard
- Проверьте, что Supabase URL и ключи корректны

### Обработка документов не работает

- Проверьте `OPENAI_API_KEY` в переменных окружения
- Проверьте логи - должны быть предупреждения о fallback на OpenAI API
- Убедитесь, что у вас достаточно квоты OpenAI API

## Контакты и поддержка

При возникновении проблем:
1. Проверьте логи в Cloudflare Dashboard
2. Сравните с рабочей версией на Vercel
3. Обратитесь к документации Cloudflare Pages: https://developers.cloudflare.com/pages/


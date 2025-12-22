# ✅ Чеклист настроек Cloudflare Pages

## 🔴 КРИТИЧЕСКИ ВАЖНО: Исправьте эти настройки СЕЙЧАС

### 1. Build Command

**ТЕКУЩЕЕ (неправильное):**
```
npm run build
```

**ПРАВИЛЬНОЕ:**
```
npm run build && npx @cloudflare/next-on-pages@latest
```

**Где изменить:**
- Cloudflare Dashboard → Ваш проект Pages → Settings → Builds & deployments
- Поле **"Build command"**

### 2. Deploy Command

**ТЕКУЩЕЕ (неправильное):**
```
npx wrangler deploy
```

**ПРАВИЛЬНОЕ:**
```
(пусто - удалите команду или оставьте поле пустым)
```

**Где изменить:**
- Cloudflare Dashboard → Ваш проект Pages → Settings → Builds & deployments
- Поле **"Deploy command"** или **"Post-build command"**

Если поле нельзя оставить пустым, используйте:
```
echo "Deployment handled automatically"
```

### 3. Build Output Directory

**Должно быть:**
```
.vercel/output/static
```

## 📋 Полный список настроек

После исправления настройки должны быть такими:

- ✅ **Framework preset**: `Next.js` (или `None`)
- ✅ **Build command**: `npm run build && npx @cloudflare/next-on-pages@latest`
- ✅ **Build output directory**: `.vercel/output/static`
- ✅ **Root directory**: `/` (пусто)
- ✅ **Node.js version**: `18` или `20`
- ✅ **Deploy command**: **ПУСТО** (удалено)

## ⚠️ Почему это важно

1. **Build command без `@cloudflare/next-on-pages`** - не создаст правильную структуру для Cloudflare Pages
2. **Deploy command `npx wrangler deploy`** - это команда для Workers, не для Pages. Cloudflare Pages автоматически деплоит результат сборки.

## ✅ После исправления

1. Сохраните изменения в Cloudflare Dashboard
2. Cloudflare автоматически запустит новый деплой
3. Или нажмите "Retry deployment" в последнем деплое
4. Деплой должен пройти успешно!


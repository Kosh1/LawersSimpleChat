# Быстрый старт: Настройка прокси-сервера

## Шаг 1: Настройка Nginx на российском сервере

1. Скопируйте `docs/nginx-proxy.conf` на ваш сервер
2. Отредактируйте файл:
   - Замените `YOUR_DOMAIN` на ваш домен (например, `proxy.jhelper.ru`)
   - Замените `your-app.vercel.app` на URL вашего Vercel приложения
3. Установите конфигурацию:
   ```bash
   sudo cp docs/nginx-proxy.conf /etc/nginx/sites-available/jhelper-proxy
   sudo ln -s /etc/nginx/sites-available/jhelper-proxy /etc/nginx/sites-enabled/
   ```
4. Настройте SSL (Let's Encrypt):
   ```bash
   sudo certbot --nginx -d proxy.jhelper.ru
   ```
5. Добавьте зоны кэширования в `/etc/nginx/nginx.conf` (см. комментарии в docs/nginx-proxy.conf)
6. Перезапустите Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## Шаг 2: Настройка переменных окружения

В Vercel Dashboard → Settings → Environment Variables добавьте:

```
NEXT_PUBLIC_PROXY_URL=https://proxy.jhelper.ru
```

Или в `.env.local` для локальной разработки:

```env
NEXT_PUBLIC_PROXY_URL=https://proxy.jhelper.ru
```

## Шаг 3: Деплой

После добавления переменной окружения Vercel автоматически пересоберет приложение.

## Проверка работы

1. Откройте DevTools → Network
2. Проверьте, что все запросы к `/api/*` идут через ваш прокси-домен
3. Проверьте заголовок `X-Cache-Status` в ответах (должен быть `HIT` или `MISS`)

## Что происходит

- Все API запросы автоматически идут через прокси
- Статические ресурсы также загружаются через прокси
- Nginx кэширует статические ресурсы на 1 год
- API запросы не кэшируются, но идут через стабильное соединение

## Подробная документация

См. `docs/PROXY_SETUP.md` для детальной настройки и troubleshooting.


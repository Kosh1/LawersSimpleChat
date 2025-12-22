# Настройка прокси-сервера в России

Этот документ описывает настройку Nginx прокси-сервера в России для улучшения доступности приложения для пользователей из России/СНГ.

## Архитектура

```
Пользователь (Россия) → Российский Nginx сервер → Cloudflare Pages
```

## Установка и настройка

### 1. Установка Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

### 2. Настройка SSL сертификата (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d YOUR_DOMAIN
```

### 3. Копирование конфигурации

1. Скопируйте `nginx-proxy.conf` на сервер
2. Замените `YOUR_DOMAIN` на ваш домен (например, `proxy.jhelper.ru`)
3. Замените `your-app.pages.dev` на URL вашего Cloudflare Pages приложения
4. Скопируйте файл в `/etc/nginx/sites-available/your-site`
5. Создайте симлинк: `sudo ln -s /etc/nginx/sites-available/your-site /etc/nginx/sites-enabled/`

### 4. Настройка зон кэширования

Добавьте в `/etc/nginx/nginx.conf` в блок `http`:

```nginx
http {
    # ... существующие настройки ...
    
    proxy_cache_path /var/cache/nginx/static levels=1:2 keys_zone=STATIC_CACHE:10m max_size=1g inactive=365d use_temp_path=off;
    proxy_cache_path /var/cache/nginx/images levels=1:2 keys_zone=IMAGE_CACHE:10m max_size=500m inactive=30d use_temp_path=off;
    proxy_cache_path /var/cache/nginx/html levels=1:2 keys_zone=HTML_CACHE:10m max_size=100m inactive=1h use_temp_path=off;
}
```

Создайте директории для кэша:

```bash
sudo mkdir -p /var/cache/nginx/{static,images,html}
sudo chown -R www-data:www-data /var/cache/nginx
```

### 5. Проверка и перезапуск

```bash
# Проверка конфигурации
sudo nginx -t

# Перезапуск Nginx
sudo systemctl restart nginx

# Проверка статуса
sudo systemctl status nginx
```

### 6. Настройка переменных окружения

В Cloudflare Pages Dashboard или `.env.local` добавьте:

```env
NEXT_PUBLIC_PROXY_URL=https://YOUR_DOMAIN
```

## Мониторинг

### Просмотр логов

```bash
# Access лог
sudo tail -f /var/log/nginx/proxy-access.log

# Error лог
sudo tail -f /var/log/nginx/proxy-error.log
```

### Проверка кэша

Заголовок `X-Cache-Status` покажет статус кэша:
- `HIT` - данные из кэша
- `MISS` - данные с Cloudflare Pages
- `UPDATING` - обновление кэша в фоне

## Оптимизация

### Настройка кэша

Измените время кэширования в `nginx-proxy.conf`:
- Статические ресурсы: `365d` (1 год)
- Изображения: `30d` (1 месяц)
- HTML: `5m` (5 минут)

### Настройка таймаутов

Если возникают проблемы с таймаутами, увеличьте значения:
- `proxy_connect_timeout`
- `proxy_send_timeout`
- `proxy_read_timeout`

## Troubleshooting

### Проблема: 502 Bad Gateway

1. Проверьте, что Cloudflare Pages URL правильный
2. Проверьте SSL сертификат на Cloudflare Pages
3. Проверьте логи: `sudo tail -f /var/log/nginx/proxy-error.log`

### Проблема: Кэш не работает

1. Проверьте права на директории кэша
2. Проверьте, что зоны кэша добавлены в `nginx.conf`
3. Проверьте заголовок `X-Cache-Status` в ответах

### Проблема: Медленная работа

1. Увеличьте размеры буферов
2. Проверьте использование диска для кэша
3. Оптимизируйте настройки кэширования


# Инструкция по Настройке Supabase

## Что Нужно Сделать в Supabase

### Шаг 1: Проверить Существующие Таблицы

1. Откройте **Supabase Dashboard**
2. Выберите ваш проект
3. Перейдите в **Table Editor** (левое меню)
4. Посмотрите, какие таблицы уже существуют

### Шаг 2: Определить, Какие Миграции Применять

#### Вариант A: Таблицы `chat_sessions` и `chat_messages` УЖЕ СУЩЕСТВУЮТ

Если вы видите эти таблицы, значит они были созданы ранее.

**Действия:**
- ✅ **ПРОПУСТИТЕ** миграцию `20241110000000_create_chat_tables.sql`
- ✅ **ПРИМЕНИТЕ** миграцию `20241111100000_add_projects_and_documents.sql` (если еще не применена)

#### Вариант B: Таблиц `chat_sessions` и `chat_messages` НЕТ

Это маловероятно, но если их нет:

**Действия:**
- ✅ **ПРИМЕНИТЕ** миграцию `20241110000000_create_chat_tables.sql`
- ✅ **ПРИМЕНИТЕ** миграцию `20241111100000_add_projects_and_documents.sql`

---

## Как Применить Миграции

### Метод 1: Через SQL Editor (Рекомендуется)

1. Откройте **Supabase Dashboard**
2. Перейдите в **SQL Editor** (левое меню)
3. Нажмите **New Query**

#### Если нужна первая миграция:

4. Скопируйте содержимое файла:
   ```
   supabase/migrations/20241110000000_create_chat_tables.sql
   ```

5. Вставьте в SQL Editor
6. Нажмите **Run** или `Ctrl+Enter`
7. Должно появиться: ✅ **Success. No rows returned**

#### Проверка второй миграции:

8. Проверьте, есть ли колонка `project_id` в таблице `chat_sessions`:
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'chat_sessions' 
   AND column_name = 'project_id';
   ```

9. Если результат **пустой** (колонки нет), примените вторую миграцию:
   ```
   supabase/migrations/20241111100000_add_projects_and_documents.sql
   ```

10. Скопируйте содержимое и нажмите **Run**

### Метод 2: Через Supabase CLI (Альтернатива)

Если у вас установлен Supabase CLI:

```bash
# Войти в Supabase
supabase login

# Связать проект (если еще не связан)
supabase link --project-ref your-project-ref

# Применить миграции
supabase db push
```

---

## Проверка После Применения

### 1. Проверьте Таблицы

В **Table Editor** должны быть следующие таблицы:

```
✅ chat_sessions
   - id
   - user_id
   - project_id ← ВАЖНО! Должна быть эта колонка
   - initial_message
   - created_at
   - utm
   - document_type

✅ chat_messages
   - id
   - session_id
   - role
   - content
   - created_at

✅ projects
   - id
   - user_id
   - name
   - slug
   - created_at
   - updated_at

✅ project_documents
   - id
   - project_id
   - name
   - mime_type
   - size
   - text
   - truncated
   - raw_text_length
   - strategy
   - uploaded_at
   - checksum
   - created_at
```

### 2. Проверьте Данные

Выполните запрос в SQL Editor:

```sql
-- Проверить существующие чаты
SELECT COUNT(*) as total_sessions FROM chat_sessions;

-- Проверить существующие сообщения
SELECT COUNT(*) as total_messages FROM chat_messages;

-- Проверить проекты
SELECT COUNT(*) as total_projects FROM projects;
```

Если у вас уже были чаты, вы должны увидеть числа больше 0.

### 3. Проверьте Связи

```sql
-- Проверить, что чаты привязаны к проектам
SELECT 
  COUNT(*) as sessions_with_project
FROM chat_sessions 
WHERE project_id IS NOT NULL;

-- Если результат = 0, это нормально для старых чатов
-- Они будут привязаны при первом использовании
```

---

## Миграция Существующих Данных (Опционально)

Если у вас есть старые чаты БЕЗ `project_id`, вы можете создать для них проект:

```sql
-- Создать проект "Импортированные дела" для существующих чатов
WITH new_project AS (
  INSERT INTO projects (name, user_id)
  VALUES ('Импортированные дела', NULL)
  RETURNING id
)
UPDATE chat_sessions
SET project_id = (SELECT id FROM new_project)
WHERE project_id IS NULL;
```

Это привяжет все старые чаты к одному проекту.

---

## Частые Ошибки

### Ошибка: "relation chat_sessions already exists"

**Решение:** Это нормально! Таблица уже существует. Пропустите первую миграцию.

### Ошибка: "column project_id already exists"

**Решение:** Вторая миграция уже применена. Все в порядке!

### Ошибка: "permission denied"

**Решение:** Убедитесь, что используете правильные credentials и роль имеет права на CREATE TABLE.

---

## Итоговый Чеклист

После применения миграций проверьте:

- [ ] Таблица `chat_sessions` существует
- [ ] В `chat_sessions` есть колонка `project_id`
- [ ] Таблица `chat_messages` существует
- [ ] Таблица `projects` существует
- [ ] Таблица `project_documents` существует
- [ ] Существующие данные не потеряны
- [ ] Нет ошибок в SQL Editor

---

## Следующий Шаг

После применения миграций:

1. Запустите приложение: `npm run dev`
2. Откройте `http://localhost:3000`
3. Следуйте инструкциям из `TESTING_GUIDE.md`

---

## Нужна Помощь?

Если возникли проблемы:
1. Проверьте логи в Supabase Dashboard → Logs
2. Скопируйте текст ошибки
3. Проверьте, что используете правильный Supabase URL и API Key

**Важно:** Все миграции используют `IF NOT EXISTS` и `IF NOT EXISTS`, поэтому безопасно запускать их несколько раз.


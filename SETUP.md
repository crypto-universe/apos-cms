# 🚀 Полное руководство по настройке

Это подробное руководство по настройке всех функций ApostropheCMS с улучшениями UI/UX, HTMX и AI интеграцией.

## 📋 Содержание

1. [Быстрый старт](#быстрый-старт)
2. [Настройка Claude AI](#настройка-claude-ai)
3. [Настройка Newsletter (рассылка)](#настройка-newsletter)
4. [Настройка SMTP](#настройка-smtp)
5. [Безопасность](#безопасность)
6. [Тестирование](#тестирование)
7. [Production развертывание](#production-развертывание)
8. [Troubleshooting](#troubleshooting)

---

## Быстрый старт

### 1. Клонирование и установка

```bash
# Клонируйте репозиторий
git clone <repository-url>
cd apos-cms

# Установите зависимости
npm install

# Скопируйте пример конфигурации
cp .env.example .env
```

### 2. Минимальная настройка

Отредактируйте `.env` файл:

```env
# Минимум для запуска
NODE_ENV=development

# Для AI функций (опционально)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# Для рассылки (опционально)
UNSUBSCRIBE_SECRET=your-random-secret
```

### 3. Запуск

```bash
# Development режим с автоперезагрузкой
npm run dev

# Production режим
npm run build
npm run serve
```

Сайт будет доступен по адресу: `http://localhost:3000`

---

## Настройка Claude AI

### Получение API ключа

1. Перейдите на https://console.anthropic.com/
2. Зарегистрируйтесь или войдите в аккаунт
3. Создайте новый API ключ в разделе "API Keys"
4. Скопируйте ключ (начинается с `sk-ant-api03-`)

### Добавление ключа в проект

Отредактируйте `.env`:

```env
ANTHROPIC_API_KEY=sk-ant-api03-ваш-ключ-здесь
```

### Проверка работы

1. Запустите проект: `npm run dev`
2. Войдите в админ панель
3. На странице должна появиться плавающая кнопка AI (правый нижний угол)
4. Нажмите на кнопку и протестируйте генерацию текста

### Демо режим

Если `ANTHROPIC_API_KEY` не установлен, AI модуль работает в демо-режиме:
- Показывает интерфейс
- Возвращает тестовые сообщения
- Не делает реальных API вызовов

Для production обязательно установите реальный ключ!

### Лимиты и цены

Claude AI работает на платной основе:
- **Sonnet 3.5**: ~$3 per 1M input tokens, ~$15 per 1M output tokens
- **Рекомендация**: Установите лимиты в Anthropic Console
- **Мониторинг**: Отслеживайте использование в консоли Anthropic

---

## Настройка Newsletter

### MongoDB настройка (автоматическая)

Newsletter модуль автоматически создает коллекцию в MongoDB:
- **Коллекция**: `newsletterSubscribers`
- **Индекс**: Уникальный по полю `email`
- **Создается**: При первом запуске приложения

Проверить можно через MongoDB shell:

```bash
# Подключение к MongoDB
mongo

# Выбор базы данных (обычно t-a)
use t-a

# Проверка коллекции
db.newsletterSubscribers.find().pretty()

# Проверка индекса
db.newsletterSubscribers.getIndexes()
```

### Генерация секретного ключа

Для токенов отписки нужен секретный ключ:

```bash
# В Linux/Mac
openssl rand -hex 32

# Или через Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Добавьте в `.env`:

```env
UNSUBSCRIBE_SECRET=сгенерированный-ключ-здесь
```

### API Endpoints

После настройки доступны:

```bash
# Подписка
POST /api/newsletter/subscribe
Body: { email: "user@example.com" }

# Отписка
GET /api/newsletter/unsubscribe?email=user@example.com&token=xxxxx

# Статистика (только для админов)
GET /api/newsletter/stats
```

### Тестирование подписки

1. Откройте главную страницу
2. Прокрутите вниз к footer
3. Введите email в форму подписки
4. Нажмите "Подписка"
5. Должно появиться сообщение об успехе

Проверьте в MongoDB:

```javascript
db.newsletterSubscribers.find({ email: "test@example.com" })
```

---

## Настройка SMTP

Для отправки приветственных писем нужен SMTP сервер.

### Вариант 1: Gmail

**Шаг 1**: Включите 2FA в Google Account

**Шаг 2**: Создайте App Password
1. https://myaccount.google.com/apppasswords
2. Выберите "Mail" и устройство
3. Скопируйте сгенерированный пароль

**Шаг 3**: Настройте `.env`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=сгенерированный-app-password
SMTP_FROM="Ваше Имя <your-email@gmail.com>"
```

### Вариант 2: SendGrid

**Шаг 1**: Зарегистрируйтесь на https://sendgrid.com/

**Шаг 2**: Создайте API Key
1. Settings → API Keys → Create API Key
2. Full Access или Mail Send access
3. Скопируйте ключ

**Шаг 3**: Настройте `.env`

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=ваш-sendgrid-api-key
SMTP_FROM="Ваше Имя <verified@email.com>"
```

**Важно**: Верифицируйте домен или email в SendGrid!

### Вариант 3: Mailgun

**Шаг 1**: Зарегистрируйтесь на https://www.mailgun.com/

**Шаг 2**: Получите SMTP credentials
1. Domains → Выберите домен
2. Domain Settings → SMTP credentials

**Шаг 3**: Настройте `.env`

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=ваш-mailgun-smtp-password
SMTP_FROM="Ваше Имя <noreply@your-domain.com>"
```

### Вариант 4: Mailtrap (для тестирования)

Отличный вариант для development:

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=ваш-mailtrap-user
SMTP_PASS=ваш-mailtrap-password
```

Все письма попадут в Mailtrap inbox, не отправляясь реальным получателям.

### Тестирование отправки

```bash
# 1. Запустите приложение
npm run dev

# 2. Подпишитесь на рассылку через форму

# 3. Проверьте логи в консоли:
# ✅ Welcome email sent to user@example.com. Message ID: ...

# 4. Проверьте почту получателя
```

### Отключение email (optional)

Если SMTP не настроен:
- Подписка работает (сохраняется в БД)
- Email не отправляется
- В логах: "⚠️ SMTP не настроен"

---

## Безопасность

### Защита .env файла

```bash
# Проверьте что .env в .gitignore
cat .gitignore | grep .env

# Если нет, добавьте:
echo ".env" >> .gitignore

# Убедитесь что .env НЕ закоммичен:
git status
```

### Сильные секреты

```bash
# Генерируйте случайные строки для секретов:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Используйте разные секреты для development и production!
```

### Rate Limiting (рекомендуется)

Добавьте в production для защиты от злоупотреблений:

```bash
npm install express-rate-limit --save
```

В `modules/ai-assistant/index.js`:

```javascript
const rateLimit = require('express-rate-limit');

// В handlers → addRoutes
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов на IP
  message: 'Слишком много запросов, попробуйте позже'
});

// Применить ко всем AI endpoints
self.apos.app.use('/api/ai/', aiLimiter);
```

### HTTPS в production

Всегда используйте HTTPS в production:
- Через reverse proxy (Nginx, Apache)
- Через CDN (Cloudflare)
- Через платформу (Heroku, Vercel)

### Environment Variables

Никогда не храните в коде:
- ✅ API ключи
- ✅ Пароли
- ✅ Секретные ключи
- ✅ База данных credentials

Всегда используйте `.env` или environment variables платформы.

---

## Тестирование

### Проверка AI модуля

```bash
# 1. Установите тестовый ключ в .env
ANTHROPIC_API_KEY=sk-ant-api03-test

# 2. Запустите приложение
npm run dev

# 3. Войдите как админ

# 4. Откройте AI панель (кнопка в правом нижнем углу)

# 5. Попробуйте генерацию:
# - Тип: Статья
# - Промпт: "Напиши о веб-разработке"
# - Генерировать

# 6. Проверьте результат
```

### Проверка Newsletter

```bash
# 1. Откройте главную страницу
# 2. Прокрутите к footer
# 3. Подпишитесь с тестовым email
# 4. Проверьте MongoDB:

mongo
use t-a
db.newsletterSubscribers.find().pretty()

# 5. Проверьте email (если SMTP настроен)
```

### Проверка HTMX

```bash
# 1. Откройте DevTools (F12)
# 2. Вкладка Console
# 3. Подпишитесь на newsletter
# 4. В консоли должны быть:
# - HTMX Request starting: /api/newsletter/subscribe
# - HTMX Content swapped: /api/newsletter/subscribe
```

---

## Production развертывание

### Checklist перед деплоем

- [ ] `NODE_ENV=production` установлен
- [ ] Все секреты сгенерированы и уникальны
- [ ] HTTPS настроен
- [ ] MongoDB доступна и backup настроен
- [ ] SMTP настроен и протестирован
- [ ] Rate limiting включен
- [ ] Логи настроены (PM2, Winston, etc.)
- [ ] Мониторинг настроен
- [ ] `.env` не в git репозитории

### Build

```bash
# Production build
NODE_ENV=production npm run build

# Запуск
NODE_ENV=production npm run serve
```

### PM2 (рекомендуется)

```bash
# Установка PM2
npm install -g pm2

# Запуск с PM2
pm2 start app.js --name "apos-cms"

# Автозапуск при перезагрузке
pm2 startup
pm2 save

# Логи
pm2 logs apos-cms

# Мониторинг
pm2 monit
```

### Environment Variables на платформах

**Heroku:**
```bash
heroku config:set ANTHROPIC_API_KEY=sk-ant-xxx
heroku config:set SMTP_HOST=smtp.sendgrid.net
# ... и т.д.
```

**Vercel:**
```bash
vercel env add ANTHROPIC_API_KEY
# Или через веб-интерфейс
```

**Docker:**
```dockerfile
ENV ANTHROPIC_API_KEY=sk-ant-xxx
ENV SMTP_HOST=smtp.sendgrid.net
```

---

## Troubleshooting

### AI модуль не работает

**Проблема**: Кнопка AI не появляется

**Решение**:
1. Проверьте авторизацию (войдите как админ)
2. Проверьте `body.classList.contains('apos-logged-in')`
3. Очистите кэш браузера
4. Проверьте консоль браузера на ошибки

**Проблема**: "ANTHROPIC_API_KEY не установлен"

**Решение**:
1. Проверьте `.env` файл
2. Убедитесь что ключ начинается с `sk-ant-`
3. Перезапустите приложение после изменения `.env`
4. Проверьте: `console.log(process.env.ANTHROPIC_API_KEY)`

**Проблема**: "Failed to generate text"

**Решение**:
1. Проверьте баланс в Anthropic Console
2. Проверьте лимиты API
3. Проверьте интернет соединение
4. Проверьте логи сервера

### Newsletter не работает

**Проблема**: Email не добавляется в БД

**Решение**:
1. Проверьте MongoDB соединение
2. Проверьте логи: `db.newsletterSubscribers.find()`
3. Проверьте формат email
4. Проверьте индекс: `db.newsletterSubscribers.getIndexes()`

**Проблема**: Письмо не приходит

**Решение**:
1. Проверьте SMTP настройки в `.env`
2. Проверьте логи сервера
3. Проверьте спам папку
4. Тестируйте с Mailtrap сначала
5. Проверьте верификацию домена (SendGrid, Mailgun)

**Проблема**: "SMTP не настроен"

**Решение**:
- Это нормально если SMTP не требуется
- Подписка работает, просто без email
- Настройте SMTP если нужна отправка

### HTMX не работает

**Проблема**: Форма перезагружает страницу

**Решение**:
1. Проверьте что htmx загружен: `window.htmx`
2. Проверьте атрибуты: `hx-post`, `hx-target`
3. Очистите кэш браузера
4. Проверьте консоль на ошибки

**Проблема**: Индикатор загрузки не появляется

**Решение**:
1. Проверьте CSS: `.htmx-indicator`
2. Проверьте `hx-indicator="#id"` атрибут
3. Проверьте стили в DevTools

### Build ошибки

**Проблема**: "Cannot find module"

**Решение**:
```bash
# Удалите node_modules и переустановите
rm -rf node_modules package-lock.json
npm install
```

**Проблема**: SCSS ошибки

**Решение**:
1. Проверьте синтаксис SCSS
2. Проверьте импорты: `@import '../../../asset/...'`
3. Очистите кэш: `rm -rf public/apos-frontend`

---

## Дополнительная информация

### Полезные команды

```bash
# Проверка логов
npm run dev | grep "✅"

# Подключение к MongoDB
mongo
use t-a
show collections

# Экспорт подписчиков
# Добавьте endpoint или используйте mongo export
mongoexport --db=t-a --collection=newsletterSubscribers --out=subscribers.json

# Проверка environment variables
node -e "console.log(process.env.ANTHROPIC_API_KEY)"
```

### Документация

- ApostropheCMS: https://docs.apostrophecms.org/
- HTMX: https://htmx.org/docs/
- Anthropic Claude: https://docs.anthropic.com/
- MongoDB: https://docs.mongodb.com/

### Поддержка

- GitHub Issues: [создайте issue](https://github.com/your-repo/issues)
- Email: support@agenc.io

---

**Версия:** 2.0.0
**Дата:** 2025-11-05
**Автор:** AI-Enhanced Development Team

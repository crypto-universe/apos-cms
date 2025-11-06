# Multi-AI Provider System

## 🚀 Обзор

Apostrophe CMS теперь поддерживает работу с несколькими AI провайдерами одновременно:

- **Anthropic Claude** - передовые модели Claude 3.5, 3 Opus, Sonnet, Haiku
- **OpenAI GPT** - GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo
- **Google Gemini** - Gemini 2.5 Pro, Gemini 2.0 Flash, Gemini 1.5
- **Zhipu AI ChatGLM** - GLM-4 Plus, GLM-4, GLM-4 Air, GLM-4 Flash

## 📦 Установленные пакеты

```json
{
  "@anthropic-ai/sdk": "latest",
  "openai": "latest",
  "@google/genai": "latest"
}
```

## ⚙️ Настройка

### 1. Скопируйте .env.example в .env

```bash
cp .env.example .env
```

### 2. Добавьте API ключи

Откройте `.env` и добавьте ключи для нужных провайдеров:

```bash
# --- Anthropic Claude ---
# Получите ключ: https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# --- OpenAI GPT ---
# Получите ключ: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-xxxxx

# --- Google Gemini ---
# Получите ключ: https://ai.google.dev/
GOOGLE_API_KEY=xxxxx

# --- Zhipu AI ChatGLM ---
# Получите ключ: https://open.bigmodel.cn/
ZHIPU_API_KEY=xxxxx

# По умолчанию используемый провайдер
DEFAULT_AI_PROVIDER=claude
```

### 3. Получение API ключей

#### Anthropic Claude
1. Зарегистрируйтесь на https://console.anthropic.com/
2. Перейдите в API Keys
3. Создайте новый ключ
4. Скопируйте ключ (начинается с `sk-ant-`)

#### OpenAI GPT
1. Зарегистрируйтесь на https://platform.openai.com/
2. Перейдите в API keys
3. Создайте новый Secret key
4. Скопируйте ключ (начинается с `sk-`)

#### Google Gemini
1. Перейдите на https://ai.google.dev/
2. Нажмите "Get API key"
3. Создайте API key в Google Cloud Console
4. Скопируйте ключ

#### Zhipu AI ChatGLM
1. Зарегистрируйтесь на https://open.bigmodel.cn/
2. Перейдите в раздел API Keys
3. Создайте новый ключ
4. Скопируйте ключ

## 🎯 Использование

### В коде модулей

```javascript
// Используя AI Provider Manager напрямую
const aiManager = self.apos.aiProviderManager;

// Генерация текста с default провайдером
const text = await aiManager.generateText('Напиши статью о AI', {
  temperature: 0.7,
  maxTokens: 2048
});

// Генерация с конкретным провайдером
const text = await aiManager.generateText('Напиши статью о AI', {
  provider: 'openai',
  model: 'gpt-4o',
  temperature: 0.7
});

// Генерация с несколькими провайдерами (параллельно)
const results = await aiManager.generateWithMultipleProviders(
  'Напиши статью о AI',
  ['claude', 'openai', 'gemini']
);

// Консенсус (лучший ответ из нескольких)
const bestText = await aiManager.generateWithConsensus(
  'Напиши статью о AI',
  ['claude', 'openai', 'gemini']
);
```

### В AI Assistant модуле

```javascript
// API endpoints теперь принимают параметр provider и model

// POST /api/ai/generate-text
{
  "prompt": "Напиши статью о веб-разработке",
  "context": "Для начинающих разработчиков",
  "type": "article",
  "provider": "openai",    // опционально
  "model": "gpt-4o-mini"   // опционально
}

// POST /api/ai/improve-text
{
  "text": "Текст для улучшения",
  "instructions": "Сделай более формальным",
  "provider": "gemini",    // опционально
  "model": "gemini-2.0-flash"  // опционально
}

// GET /api/ai/providers
// Возвращает список доступных провайдеров
```

## 🔧 Доступные модели

### Claude (Anthropic)

| Модель | Описание | Рекомендовано для |
|--------|----------|-------------------|
| `claude-3-5-sonnet-20241022` | ⭐ Лучшая модель | Все задачи |
| `claude-3-opus-20240229` | Самая мощная | Сложные задачи |
| `claude-3-sonnet-20240229` | Сбалансированная | Общие задачи |
| `claude-3-haiku-20240307` | Быстрая | Простые задачи |

### OpenAI GPT

| Модель | Описание | Рекомендовано для |
|--------|----------|-------------------|
| `gpt-4o` | ⭐ Новейшая модель | Все задачи |
| `gpt-4o-mini` | Быстрая и дешевая | Простые задачи |
| `gpt-4-turbo` | Мощная | Сложные задачи |
| `gpt-4` | Стандартная | Общие задачи |
| `gpt-3.5-turbo` | Экономичная | Базовые задачи |

### Google Gemini

| Модель | Описание | Рекомендовано для |
|--------|----------|-------------------|
| `gemini-2.5-pro` | ⭐ Самая мощная | Сложные задачи |
| `gemini-2.0-flash` | Быстрая | Общие задачи |
| `gemini-1.5-pro` | Стабильная | Все задачи |
| `gemini-1.5-flash` | Экономичная | Простые задачи |

### Zhipu AI ChatGLM

| Модель | Описание | Рекомендовано для |
|--------|----------|-------------------|
| `glm-4-plus` | ⭐ Премиум модель | Сложные задачи |
| `glm-4` | Стандартная | Общие задачи |
| `glm-4-air` | Легкая | Быстрые ответы |
| `glm-4-flash` | Сверхбыстрая | Простые задачи |

## 💡 Лучшие практики

### 1. Выбор провайдера

- **Claude** - лучше для длинных текстов, анализа, сложных задач
- **OpenAI GPT** - универсальный, хорошая поддержка API
- **Gemini** - отличный для multimodal задач, быстрый
- **ChatGLM** - хорош для китайского языка, экономичный

### 2. Выбор модели

- **Простые задачи** (alt-text, заголовки): используйте быстрые модели (`haiku`, `gpt-4o-mini`, `flash`)
- **Средние задачи** (статьи, FAQ): используйте сбалансированные (`sonnet`, `gpt-4o`, `gemini-2.0-flash`)
- **Сложные задачи** (SEO анализ, длинные тексты): используйте мощные (`opus`, `gpt-4`, `gemini-2.5-pro`)

### 3. Стоимость

Приблизительные цены (на токены):

- **Самые дешевые**: `gpt-3.5-turbo`, `glm-4-flash`, `haiku`
- **Средние**: `gpt-4o-mini`, `gemini-2.0-flash`, `glm-4-air`
- **Дорогие**: `claude-3-opus`, `gpt-4`, `gemini-2.5-pro`

### 4. Fallback стратегия

```javascript
// Система автоматически использует fallback
try {
  // Пытаемся использовать Claude
  const text = await aiManager.generateText(prompt, { provider: 'claude' });
} catch (error) {
  // Автоматически переключается на другой доступный провайдер
  // или показывает demo-режим
}
```

## 🔍 Проверка доступности провайдеров

```javascript
// Получить список доступных провайдеров
const providers = aiManager.getAvailableProviders();
console.log(providers);
// [
//   { id: 'claude', name: 'Anthropic Claude', models: [...], icon: '🤖' },
//   { id: 'openai', name: 'OpenAI GPT', models: [...], icon: '🧠' }
// ]

// Проверить конкретный провайдер
const status = await aiManager.checkProvider('openai');
console.log(status);
// { available: true, error: null }
```

## 🎨 Пример использования в разных модулях

### Related Content Widget

```javascript
// В modules/related-content-widget/index.js
const relatedArticles = await self.findRelatedWithAI(currentArticle, maxItems, 'gemini');
```

### FAQ Generator

```javascript
// В modules/faq-generator/index.js
const faqItems = await self.generateFAQFromArticle(articleId, maxQuestions, 'openai');
```

### Intelligent Search

```javascript
// В modules/intelligent-search/index.js
const aiEnhancements = await self.getAIEnhancements(query, results, 'claude');
```

## 🚨 Troubleshooting

### Ошибка: "API key not set"

**Решение**: Добавьте соответствующий API ключ в `.env` файл

### Ошибка: "Rate limit exceeded"

**Решение**:
1. Используйте другой провайдер временно
2. Подождите несколько минут
3. Обновите план на платформе провайдера

### Ошибка: "Model not found"

**Решение**: Проверьте имя модели в документации провайдера

### Demo-режим работает, но AI нет

**Решение**:
1. Проверьте `.env` файл - ключи должны быть без кавычек
2. Перезапустите сервер после изменения `.env`
3. Проверьте логи в консоли

## 📊 Мониторинг использования

```javascript
// Получить статистику
const stats = aiManager.getProviderStats();
console.log(stats);
```

## 🔐 Безопасность

1. **Никогда не коммитьте .env** - добавьте в `.gitignore`
2. **Используйте переменные окружения** в production
3. **Ротируйте ключи регулярно** (каждые 3-6 месяцев)
4. **Ограничьте права API ключей** на платформах провайдеров
5. **Мониторьте использование** для обнаружения аномалий

## 📚 Дополнительные ресурсы

- [Anthropic API Docs](https://docs.anthropic.com/)
- [OpenAI API Docs](https://platform.openai.com/docs/api-reference)
- [Google Gemini Docs](https://ai.google.dev/docs)
- [Zhipu AI Docs](https://open.bigmodel.cn/dev/api)

## 💬 Поддержка

Если у вас возникли проблемы:

1. Проверьте логи в консоли
2. Убедитесь что API ключи корректны
3. Проверьте баланс на платформе провайдера
4. Изучите документацию провайдера

---

**Happy AI-powered coding! 🚀**

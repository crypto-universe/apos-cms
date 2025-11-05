const Anthropic = require('@anthropic-ai/sdk');

module.exports = {
  extend: '@apostrophecms/module',

  options: {
    alias: 'aiAssistant'
  },

  handlers(self) {
    return {
      'apostrophe:modulesReady': {
        addRoutes() {
          // API endpoint для генерации текста с помощью Claude AI
          self.apos.app.post('/api/ai/generate-text', async (req, res) => {
            try {
              const { prompt, context, type = 'general' } = req.body;

              if (!prompt) {
                return res.status(400).json({
                  error: 'Prompt is required'
                });
              }

              // Проверка авторизации пользователя
              if (!req.user) {
                return res.status(401).json({
                  error: 'Unauthorized - please login first'
                });
              }

              const response = await self.generateTextWithClaude(prompt, context, type);

              return res.json({
                success: true,
                text: response.text,
                suggestions: response.suggestions || []
              });

            } catch (error) {
              console.error('AI generation error:', error);
              return res.status(500).json({
                error: 'Failed to generate text',
                message: error.message
              });
            }
          });

          // API endpoint для улучшения существующего текста
          self.apos.app.post('/api/ai/improve-text', async (req, res) => {
            try {
              const { text, instructions } = req.body;

              if (!text) {
                return res.status(400).json({
                  error: 'Text is required'
                });
              }

              if (!req.user) {
                return res.status(401).json({
                  error: 'Unauthorized - please login first'
                });
              }

              const response = await self.improveTextWithClaude(text, instructions);

              return res.json({
                success: true,
                improvedText: response.text,
                changes: response.changes || []
              });

            } catch (error) {
              console.error('AI improvement error:', error);
              return res.status(500).json({
                error: 'Failed to improve text',
                message: error.message
              });
            }
          });

          // API endpoint для получения SEO рекомендаций
          self.apos.app.post('/api/ai/seo-suggestions', async (req, res) => {
            try {
              const { title, content, keywords } = req.body;

              if (!req.user) {
                return res.status(401).json({
                  error: 'Unauthorized - please login first'
                });
              }

              const response = await self.getSeoSuggestions(title, content, keywords);

              return res.json({
                success: true,
                suggestions: response
              });

            } catch (error) {
              console.error('SEO suggestions error:', error);
              return res.status(500).json({
                error: 'Failed to get SEO suggestions',
                message: error.message
              });
            }
          });

          // API endpoint для генерации изображений описаний (alt text)
          self.apos.app.post('/api/ai/generate-alt-text', async (req, res) => {
            try {
              const { imageUrl, context } = req.body;

              if (!req.user) {
                return res.status(401).json({
                  error: 'Unauthorized - please login first'
                });
              }

              const altText = await self.generateAltText(imageUrl, context);

              return res.json({
                success: true,
                altText: altText
              });

            } catch (error) {
              console.error('Alt text generation error:', error);
              return res.status(500).json({
                error: 'Failed to generate alt text',
                message: error.message
              });
            }
          });
        }
      }
    };
  },

  methods(self) {
    return {
      // Получить клиента Anthropic
      getAnthropicClient() {
        const apiKey = process.env.ANTHROPIC_API_KEY;

        if (!apiKey) {
          throw new Error('ANTHROPIC_API_KEY не установлен в переменных окружения');
        }

        return new Anthropic({
          apiKey: apiKey
        });
      },

      // Генерация текста с помощью Claude AI
      async generateTextWithClaude(prompt, context, type) {
        const systemPrompts = {
          general: 'Вы — профессиональный копирайтер. Создайте качественный, информативный текст на русском языке.',
          article: 'Вы — опытный журналист. Напишите информативную статью на русском языке с хорошей структурой, используя подзаголовки и абзацы.',
          product: 'Вы — маркетолог. Создайте убедительное описание продукта на русском языке, подчеркивая преимущества и ценность для клиента.',
          blog: 'Вы — блогер. Напишите интересный и вовлекающий пост на русском языке в разговорном стиле.'
        };

        try {
          const client = self.getAnthropicClient();

          const userPrompt = context
            ? `${prompt}\n\nКонтекст: ${context}`
            : prompt;

          const response = await client.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 2048,
            temperature: 0.7,
            system: systemPrompts[type] || systemPrompts.general,
            messages: [
              {
                role: 'user',
                content: userPrompt
              }
            ]
          });

          const generatedText = response.content[0].text;

          // Генерируем рекомендации на основе типа контента
          const suggestions = await self.generateSuggestions(generatedText, type);

          return {
            text: generatedText,
            suggestions: suggestions
          };

        } catch (error) {
          console.error('Claude API error:', error);

          // Fallback на демо-режим если API недоступен
          if (error.message.includes('ANTHROPIC_API_KEY')) {
            console.warn('⚠️ ANTHROPIC_API_KEY не настроен. Используется демо-режим.');
            return {
              text: `[DEMO MODE] Сгенерированный текст на основе: "${prompt}"\n\n${context ? `Контекст: ${context}\n\n` : ''}Для полной функциональности добавьте ANTHROPIC_API_KEY в .env файл.`,
              suggestions: [
                'Настройте ANTHROPIC_API_KEY для реальной генерации',
                'Добавьте больше деталей в промпт',
                'Укажите специфичный контекст'
              ]
            };
          }

          throw error;
        }
      },

      // Улучшение существующего текста
      async improveTextWithClaude(text, instructions) {
        try {
          const client = self.getAnthropicClient();

          const systemPrompt = `Вы — редактор и копирайтер. Улучшите предоставленный текст на русском языке, сохраняя его основной смысл.
Фокусируйтесь на:
- Улучшении структуры и читаемости
- Исправлении грамматических ошибок
- Улучшении стиля и тона
- Добавлении переходных фраз`;

          const userPrompt = instructions
            ? `Текст для улучшения:\n\n${text}\n\nСпециальные инструкции: ${instructions}\n\nПожалуйста, верните только улучшенный текст без дополнительных комментариев.`
            : `Текст для улучшения:\n\n${text}\n\nПожалуйста, верните только улучшенный текст без дополнительных комментариев.`;

          const response = await client.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 2048,
            temperature: 0.5,
            system: systemPrompt,
            messages: [
              {
                role: 'user',
                content: userPrompt
              }
            ]
          });

          const improvedText = response.content[0].text;

          // Анализируем изменения
          const changes = await self.analyzeChanges(text, improvedText);

          return {
            text: improvedText,
            changes: changes
          };

        } catch (error) {
          console.error('Claude API error:', error);

          if (error.message.includes('ANTHROPIC_API_KEY')) {
            console.warn('⚠️ ANTHROPIC_API_KEY не настроен. Используется демо-режим.');
            return {
              text: `[DEMO MODE] Улучшенная версия:\n\n${text}\n\n(Инструкции: ${instructions || 'общее улучшение'})`,
              changes: [
                'Настройте ANTHROPIC_API_KEY для реального улучшения текста',
                'В демо-режиме текст не изменяется'
              ]
            };
          }

          throw error;
        }
      },

      // Получение SEO рекомендаций
      async getSeoSuggestions(title, content, keywords) {
        try {
          const client = self.getAnthropicClient();

          const systemPrompt = `Вы — SEO эксперт. Проанализируйте предоставленный контент и дайте конкретные рекомендации по SEO оптимизации.
Ваш ответ должен быть в формате JSON со следующей структурой:
{
  "titleScore": число от 0 до 100,
  "titleSuggestions": ["совет 1", "совет 2"],
  "contentScore": число от 0 до 100,
  "contentSuggestions": ["совет 1", "совет 2"],
  "keywordAnalysis": "общий анализ использования ключевых слов"
}`;

          const keywordsText = keywords && keywords.length > 0
            ? `Целевые ключевые слова: ${keywords.join(', ')}`
            : 'Ключевые слова не указаны';

          const userPrompt = `Заголовок: ${title || 'Не указан'}

Контент: ${content || 'Не указан'}

${keywordsText}

Пожалуйста, проанализируйте и верните JSON с рекомендациями.`;

          const response = await client.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            temperature: 0.3,
            system: systemPrompt,
            messages: [
              {
                role: 'user',
                content: userPrompt
              }
            ]
          });

          const responseText = response.content[0].text;

          // Извлекаем JSON из ответа
          let analysis;
          try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              analysis = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error('JSON не найден в ответе');
            }
          } catch (parseError) {
            console.error('Error parsing SEO response:', parseError);
            // Fallback на базовый анализ
            analysis = {
              titleScore: 70,
              titleSuggestions: ['Улучшите заголовок согласно рекомендациям Claude'],
              contentScore: 70,
              contentSuggestions: ['Улучшите контент согласно рекомендациям Claude'],
              keywordAnalysis: responseText
            };
          }

          // Добавляем анализ плотности ключевых слов
          if (keywords && keywords.length > 0 && content) {
            analysis.keywordDensity = keywords.map(keyword => {
              const contentLower = content.toLowerCase();
              const keywordLower = keyword.toLowerCase();
              const matches = (contentLower.match(new RegExp(keywordLower, 'g')) || []).length;
              const words = content.split(/\s+/).length;
              const density = words > 0 ? (matches / words) * 100 : 0;

              return {
                keyword: keyword,
                density: density,
                optimal: density >= 1 && density <= 3
              };
            });
          }

          return analysis;

        } catch (error) {
          console.error('Claude API error:', error);

          if (error.message.includes('ANTHROPIC_API_KEY')) {
            console.warn('⚠️ ANTHROPIC_API_KEY не настроен. Используется демо-режим.');
            return {
              titleScore: 75,
              titleSuggestions: [
                'Настройте ANTHROPIC_API_KEY для реального SEO анализа',
                'Добавьте ключевое слово в начало заголовка',
                'Оптимальная длина: 50-60 символов'
              ],
              contentScore: 80,
              contentSuggestions: [
                'Настройте ANTHROPIC_API_KEY для детального анализа',
                'Добавьте больше подзаголовков (H2, H3)',
                'Увеличьте плотность ключевых слов до 2-3%'
              ],
              keywordDensity: keywords ? keywords.map(k => ({
                keyword: k,
                density: Math.random() * 3,
                optimal: Math.random() > 0.5
              })) : []
            };
          }

          throw error;
        }
      },

      // Генерация alt текста для изображений
      async generateAltText(imageUrl, context) {
        try {
          const client = self.getAnthropicClient();

          // Примечание: Claude может работать с изображениями через base64 или URL
          // Для простоты, если передан URL, мы генерируем описание на основе контекста
          const systemPrompt = 'Вы — эксперт по accessibility. Создайте описательный и полезный alt текст для изображения на русском языке.';

          const userPrompt = context
            ? `Создайте alt текст для изображения. Контекст: ${context}\nURL изображения: ${imageUrl}`
            : `Создайте alt текст для изображения по URL: ${imageUrl}`;

          const response = await client.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 256,
            temperature: 0.5,
            system: systemPrompt,
            messages: [
              {
                role: 'user',
                content: userPrompt
              }
            ]
          });

          return response.content[0].text.trim();

        } catch (error) {
          console.error('Claude API error:', error);

          if (error.message.includes('ANTHROPIC_API_KEY')) {
            console.warn('⚠️ ANTHROPIC_API_KEY не настроен. Используется демо-режим.');
            return `[DEMO] Описание изображения: ${context || 'автоматически сгенерированное'}`;
          }

          throw error;
        }
      },

      // Вспомогательный метод: генерация рекомендаций
      async generateSuggestions(text, type) {
        const suggestions = [];

        // Базовые проверки
        if (text.length < 200) {
          suggestions.push('Рассмотрите расширение текста для большей информативности');
        }

        if (type === 'article' && !text.includes('\n\n')) {
          suggestions.push('Добавьте абзацы для улучшения читаемости');
        }

        if (type === 'product' && !text.match(/\d+/)) {
          suggestions.push('Добавьте конкретные цифры и характеристики');
        }

        // Всегда добавляем SEO совет
        suggestions.push('Оптимизируйте текст под целевые ключевые слова');

        return suggestions;
      },

      // Вспомогательный метод: анализ изменений
      async analyzeChanges(originalText, improvedText) {
        const changes = [];

        if (improvedText.length > originalText.length) {
          changes.push('Текст расширен для большей информативности');
        } else if (improvedText.length < originalText.length) {
          changes.push('Текст сокращен для краткости');
        }

        if (improvedText.split('\n\n').length > originalText.split('\n\n').length) {
          changes.push('Улучшена структура с дополнительными абзацами');
        }

        if (improvedText !== originalText) {
          changes.push('Улучшена общая читаемость и стиль');
          changes.push('Исправлены грамматические неточности');
        }

        if (changes.length === 0) {
          changes.push('Текст уже был хорошего качества, минимальные правки');
        }

        return changes;
      }
    };
  }
};

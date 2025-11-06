/**
 * AI Assistant Module (Multi-Provider Edition)
 * Supports: Anthropic Claude, OpenAI GPT, Google Gemini, Zhipu AI ChatGLM
 */

module.exports = {
  extend: '@apostrophecms/module',

  options: {
    alias: 'aiAssistant'
  },

  handlers(self) {
    return {
      'apostrophe:modulesReady': {
        addRoutes() {
          // API endpoint для генерации текста
          self.apos.app.post('/api/ai/generate-text', async (req, res) => {
            try {
              const {
                prompt,
                context,
                type = 'general',
                provider = null,
                model = null
              } = req.body;

              if (!prompt) {
                return res.status(400).json({
                  error: 'Prompt is required'
                });
              }

              if (!req.user) {
                return res.status(401).json({
                  error: 'Unauthorized - please login first'
                });
              }

              const response = await self.generateText(prompt, context, type, provider, model);

              return res.json({
                success: true,
                text: response.text,
                suggestions: response.suggestions || [],
                provider: response.provider
              });

            } catch (error) {
              console.error('AI generation error:', error);
              return res.status(500).json({
                error: 'Failed to generate text',
                message: error.message
              });
            }
          });

          // API endpoint для улучшения текста
          self.apos.app.post('/api/ai/improve-text', async (req, res) => {
            try {
              const {
                text,
                instructions,
                provider = null,
                model = null
              } = req.body;

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

              const response = await self.improveText(text, instructions, provider, model);

              return res.json({
                success: true,
                improvedText: response.text,
                changes: response.changes || [],
                provider: response.provider
              });

            } catch (error) {
              console.error('AI improvement error:', error);
              return res.status(500).json({
                error: 'Failed to improve text',
                message: error.message
              });
            }
          });

          // API endpoint для SEO рекомендаций
          self.apos.app.post('/api/ai/seo-suggestions', async (req, res) => {
            try {
              const {
                title,
                content,
                keywords,
                provider = null
              } = req.body;

              if (!req.user) {
                return res.status(401).json({
                  error: 'Unauthorized - please login first'
                });
              }

              const response = await self.getSeoSuggestions(title, content, keywords, provider);

              return res.json({
                success: true,
                suggestions: response,
                provider: response.provider
              });

            } catch (error) {
              console.error('SEO suggestions error:', error);
              return res.status(500).json({
                error: 'Failed to get SEO suggestions',
                message: error.message
              });
            }
          });

          // API endpoint для генерации alt-текста для изображений
          self.apos.app.post('/api/ai/generate-alt-text', async (req, res) => {
            try {
              const {
                imageDescription,
                provider = null
              } = req.body;

              if (!req.user) {
                return res.status(401).json({
                  error: 'Unauthorized - please login first'
                });
              }

              const altText = await self.generateAltText(imageDescription, provider);

              return res.json({
                success: true,
                altText: altText.text,
                provider: altText.provider
              });

            } catch (error) {
              console.error('Alt text generation error:', error);
              return res.status(500).json({
                error: 'Failed to generate alt text',
                message: error.message
              });
            }
          });

          // API endpoint для получения списка доступных провайдеров
          self.apos.app.get('/api/ai/providers', async (req, res) => {
            try {
              if (!req.user) {
                return res.status(401).json({
                  error: 'Unauthorized - please login first'
                });
              }

              const providers = self.apos.aiProviderManager.getAvailableProviders();

              return res.json({
                success: true,
                providers: providers,
                default: process.env.DEFAULT_AI_PROVIDER || 'claude'
              });

            } catch (error) {
              console.error('Get providers error:', error);
              return res.status(500).json({
                error: 'Failed to get providers',
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
      /**
       * Генерация текста через выбранный AI провайдер
       */
      async generateText(prompt, context, type = 'general', provider = null, model = null) {
        try {
          const systemPrompts = {
            article: 'Вы — профессиональный журналист и копирайтер. Пишите информативные, хорошо структурированные статьи на русском языке.',
            blog: 'Вы — блогер с дружелюбным стилем письма. Создавайте интересный, вовлекающий контент на русском языке.',
            product: 'Вы — маркетолог и копирайтер. Создавайте убедительные описания продуктов на русском языке.',
            general: 'Вы — помощник-копирайтер. Создавайте качественный контент на русском языке.'
          };

          const systemPrompt = systemPrompts[type] || systemPrompts.general;

          const fullPrompt = context
            ? `${prompt}\n\nКонтекст: ${context}`
            : prompt;

          const providerManager = self.apos.aiProviderManager;

          // Используем указанный провайдер или default
          const usedProvider = provider || process.env.DEFAULT_AI_PROVIDER || 'claude';

          const generatedText = await providerManager.generateText(fullPrompt, {
            provider: usedProvider,
            model: model,
            systemPrompt: systemPrompt,
            temperature: 0.7,
            maxTokens: 2048
          });

          return {
            text: generatedText,
            suggestions: [],
            provider: usedProvider
          };

        } catch (error) {
          console.error('Generate text error:', error);

          // Fallback на демо-режим
          return {
            text: `[DEMO MODE] Сгенерированный текст на основе: "${prompt}"\n\n${context ? `Контекст: ${context}\n\n` : ''}Настройте API ключи для полной функциональности.`,
            suggestions: [
              'Настройте хотя бы один AI провайдер в .env',
              'Доступные провайдеры: Claude, OpenAI, Gemini, ChatGLM'
            ],
            provider: 'demo'
          };
        }
      },

      /**
       * Улучшение существующего текста
       */
      async improveText(text, instructions = null, provider = null, model = null) {
        try {
          const systemPrompt = `Вы — редактор и копирайтер. Улучшите предоставленный текст на русском языке, сохраняя его основной смысл.
Фокусируйтесь на:
- Улучшении структуры и читаемости
- Исправлении грамматических ошибок
- Улучшении стиля и тона
- Добавлении переходных фраз`;

          const userPrompt = instructions
            ? `Текст для улучшения:\n\n${text}\n\nСпециальные инструкции: ${instructions}\n\nПожалуйста, верните только улучшенный текст без дополнительных комментариев.`
            : `Текст для улучшения:\n\n${text}\n\nПожалуйста, верните только улучшенный текст без дополнительных комментариев.`;

          const providerManager = self.apos.aiProviderManager;
          const usedProvider = provider || process.env.DEFAULT_AI_PROVIDER || 'claude';

          const improvedText = await providerManager.generateText(userPrompt, {
            provider: usedProvider,
            model: model,
            systemPrompt: systemPrompt,
            temperature: 0.5,
            maxTokens: 2048
          });

          return {
            text: improvedText,
            changes: ['Текст улучшен с помощью AI'],
            provider: usedProvider
          };

        } catch (error) {
          console.error('Improve text error:', error);

          return {
            text: `[DEMO MODE] Улучшенная версия:\n\n${text}`,
            changes: ['Настройте API ключи для реального улучшения'],
            provider: 'demo'
          };
        }
      },

      /**
       * Получение SEO рекомендаций
       */
      async getSeoSuggestions(title, content, keywords = [], provider = null) {
        try {
          const systemPrompt = `Вы — SEO эксперт. Проанализируйте предоставленный контент и дайте конкретные рекомендации по SEO оптимизации.
Ваш ответ должен быть в формате JSON:
{
  "titleScore": число от 0 до 100,
  "titleSuggestions": ["совет 1", "совет 2"],
  "contentScore": число от 0 до 100,
  "contentSuggestions": ["совет 1", "совет 2"],
  "keywordAnalysis": "анализ использования ключевых слов"
}`;

          const keywordsText = keywords && keywords.length > 0
            ? `Целевые ключевые слова: ${keywords.join(', ')}`
            : 'Ключевые слова не указаны';

          const userPrompt = `Заголовок: ${title || 'Не указан'}

Контент: ${content || 'Не указан'}

${keywordsText}

Проанализируйте и верните JSON с рекомендациями.`;

          const providerManager = self.apos.aiProviderManager;
          const usedProvider = provider || process.env.DEFAULT_AI_PROVIDER || 'claude';

          const response = await providerManager.generateText(userPrompt, {
            provider: usedProvider,
            systemPrompt: systemPrompt,
            temperature: 0.3,
            maxTokens: 1024
          });

          // Пытаемся распарсить JSON из ответа
          let suggestions;
          try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              suggestions = JSON.parse(jsonMatch[0]);
              suggestions.provider = usedProvider;
            } else {
              throw new Error('JSON not found in response');
            }
          } catch (parseError) {
            // Fallback если не получилось распарсить
            suggestions = {
              titleScore: 70,
              titleSuggestions: ['Добавьте ключевые слова в заголовок', 'Сделайте заголовок более конкретным'],
              contentScore: 75,
              contentSuggestions: ['Добавьте подзаголовки', 'Используйте ключевые слова естественно'],
              keywordAnalysis: 'Настройте API ключи для полного анализа',
              provider: 'demo'
            };
          }

          return suggestions;

        } catch (error) {
          console.error('SEO suggestions error:', error);

          return {
            titleScore: 0,
            titleSuggestions: ['Настройте API ключи для SEO анализа'],
            contentScore: 0,
            contentSuggestions: ['Настройте API ключи для SEO анализа'],
            keywordAnalysis: 'Демо-режим',
            provider: 'demo'
          };
        }
      },

      /**
       * Генерация alt-текста для изображений
       */
      async generateAltText(imageDescription, provider = null) {
        try {
          const systemPrompt = 'Вы — специалист по accessibility. Создавайте краткие, описательные alt-тексты для изображений на русском языке.';

          const userPrompt = `Создайте alt-текст для изображения со следующим описанием: ${imageDescription}

Требования:
- Краткий (до 125 символов)
- Описательный
- Без слов "изображение" или "фото"

Верните только alt-текст без дополнительных комментариев.`;

          const providerManager = self.apos.aiProviderManager;
          const usedProvider = provider || process.env.DEFAULT_AI_PROVIDER || 'claude';

          const altText = await providerManager.generateText(userPrompt, {
            provider: usedProvider,
            systemPrompt: systemPrompt,
            temperature: 0.5,
            maxTokens: 100
          });

          return {
            text: altText.trim().replace(/["""]/g, ''),
            provider: usedProvider
          };

        } catch (error) {
          console.error('Generate alt text error:', error);

          return {
            text: imageDescription,
            provider: 'demo'
          };
        }
      }
    };
  }
};

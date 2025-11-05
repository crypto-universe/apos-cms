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

              // Здесь будет интеграция с Claude API
              // Для демонстрации возвращаем структурированный ответ
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
      // Генерация текста с помощью Claude AI
      async generateTextWithClaude(prompt, context, type) {
        // TODO: Интеграция с Claude API
        // Используйте Anthropic SDK для реальной интеграции

        const systemPrompts = {
          general: 'Вы — профессиональный копирайтер. Создайте качественный, информативный текст на русском языке.',
          article: 'Вы — опытный журналист. Напишите информативную статью на русском языке с хорошей структурой.',
          product: 'Вы — маркетолог. Создайте убедительное описание продукта на русском языке.',
          blog: 'Вы — блогер. Напишите интересный и вовлекающий пост на русском языке.'
        };

        // Демо-ответ (заменить на реальный API вызов)
        const demoResponse = {
          text: `Сгенерированный текст на основе промпта: "${prompt}"\n\n${context ? `Контекст: ${context}\n\n` : ''}Это демонстрационный текст. Для работы с реальным Claude API необходимо добавить ключ API в настройки.`,
          suggestions: [
            'Добавьте больше деталей для улучшения понимания',
            'Рассмотрите добавление примеров',
            'Улучшите SEO с помощью ключевых слов'
          ]
        };

        // В production здесь будет:
        /*
        const Anthropic = require('@anthropic-ai/sdk');
        const client = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY
        });

        const response = await client.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          system: systemPrompts[type] || systemPrompts.general,
          messages: [
            {
              role: 'user',
              content: `${prompt}\n\n${context ? `Контекст: ${context}` : ''}`
            }
          ]
        });

        return {
          text: response.content[0].text,
          suggestions: []
        };
        */

        return demoResponse;
      },

      // Улучшение существующего текста
      async improveTextWithClaude(text, instructions) {
        // TODO: Интеграция с Claude API

        const demoResponse = {
          text: `Улучшенная версия:\n\n${text}\n\n(Текст был обработан с учетом инструкций: ${instructions || 'общее улучшение'})`,
          changes: [
            'Улучшена структура предложений',
            'Добавлены переходные фразы',
            'Исправлены грамматические ошибки'
          ]
        };

        return demoResponse;
      },

      // Получение SEO рекомендаций
      async getSeoSuggestions(title, content, keywords) {
        // TODO: Интеграция с Claude API для анализа SEO

        return {
          titleScore: 75,
          titleSuggestions: [
            'Добавьте ключевое слово в начало заголовка',
            'Оптимальная длина: 50-60 символов'
          ],
          contentScore: 80,
          contentSuggestions: [
            'Добавьте больше подзаголовков (H2, H3)',
            'Увеличьте плотность ключевых слов до 2-3%',
            'Добавьте внутренние ссылки'
          ],
          keywordDensity: keywords ? keywords.map(k => ({
            keyword: k,
            density: Math.random() * 3,
            optimal: true
          })) : []
        };
      },

      // Генерация alt текста для изображений
      async generateAltText(imageUrl, context) {
        // TODO: Интеграция с Claude Vision API

        return `Описание изображения (демо): ${context ? context : 'автоматически сгенерированное описание'}`;
      }
    };
  }
};

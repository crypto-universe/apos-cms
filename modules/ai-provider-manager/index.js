/**
 * AI Provider Manager
 * Унифицированная система для работы с несколькими AI провайдерами:
 * - Anthropic Claude
 * - OpenAI GPT
 * - Google Gemini
 * - Zhipu AI ChatGLM
 */

const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/genai');

module.exports = {
  extend: '@apostrophecms/module',

  options: {
    alias: 'aiProviderManager',
    // Default provider
    defaultProvider: 'claude' // claude | openai | gemini | chatglm
  },

  init(self) {
    // Кэш для клиентов
    self.clients = {};
  },

  methods(self) {
    return {
      /**
       * Получить доступные провайдеры
       */
      getAvailableProviders() {
        const providers = [];

        if (process.env.ANTHROPIC_API_KEY) {
          providers.push({
            id: 'claude',
            name: 'Anthropic Claude',
            models: [
              'claude-3-5-sonnet-20241022',
              'claude-3-opus-20240229',
              'claude-3-sonnet-20240229',
              'claude-3-haiku-20240307'
            ],
            icon: '🤖'
          });
        }

        if (process.env.OPENAI_API_KEY) {
          providers.push({
            id: 'openai',
            name: 'OpenAI GPT',
            models: [
              'gpt-4o',
              'gpt-4o-mini',
              'gpt-4-turbo',
              'gpt-4',
              'gpt-3.5-turbo'
            ],
            icon: '🧠'
          });
        }

        if (process.env.GOOGLE_API_KEY) {
          providers.push({
            id: 'gemini',
            name: 'Google Gemini',
            models: [
              'gemini-2.5-pro',
              'gemini-2.0-flash',
              'gemini-1.5-pro',
              'gemini-1.5-flash'
            ],
            icon: '✨'
          });
        }

        if (process.env.ZHIPU_API_KEY) {
          providers.push({
            id: 'chatglm',
            name: 'Zhipu AI ChatGLM',
            models: [
              'glm-4-plus',
              'glm-4',
              'glm-4-air',
              'glm-4-flash'
            ],
            icon: '🌟'
          });
        }

        return providers;
      },

      /**
       * Получить клиента для провайдера
       */
      getClient(providerId) {
        providerId = providerId || self.options.defaultProvider;

        // Возвращаем из кэша если есть
        if (self.clients[providerId]) {
          return self.clients[providerId];
        }

        let client;

        switch (providerId) {
          case 'claude':
            if (!process.env.ANTHROPIC_API_KEY) {
              throw new Error('ANTHROPIC_API_KEY not set');
            }
            client = new Anthropic({
              apiKey: process.env.ANTHROPIC_API_KEY
            });
            break;

          case 'openai':
            if (!process.env.OPENAI_API_KEY) {
              throw new Error('OPENAI_API_KEY not set');
            }
            client = new OpenAI({
              apiKey: process.env.OPENAI_API_KEY
            });
            break;

          case 'gemini':
            if (!process.env.GOOGLE_API_KEY) {
              throw new Error('GOOGLE_API_KEY not set');
            }
            client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
            break;

          case 'chatglm':
            if (!process.env.ZHIPU_API_KEY) {
              throw new Error('ZHIPU_API_KEY not set');
            }
            // ChatGLM использует fetch API
            client = {
              apiKey: process.env.ZHIPU_API_KEY,
              baseURL: 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
            };
            break;

          default:
            throw new Error(`Unknown provider: ${providerId}`);
        }

        // Кэшируем клиента
        self.clients[providerId] = client;

        return client;
      },

      /**
       * Унифицированный метод для генерации текста
       * @param {string} prompt - Промпт для AI
       * @param {object} options - Опции генерации
       * @returns {Promise<string>} - Сгенерированный текст
       */
      async generateText(prompt, options = {}) {
        const {
          provider = self.options.defaultProvider,
          model = null,
          temperature = 0.7,
          maxTokens = 2048,
          systemPrompt = null
        } = options;

        try {
          const client = self.getClient(provider);

          switch (provider) {
            case 'claude':
              return await self.generateWithClaude(client, prompt, {
                model: model || 'claude-3-5-sonnet-20241022',
                temperature,
                maxTokens,
                systemPrompt
              });

            case 'openai':
              return await self.generateWithOpenAI(client, prompt, {
                model: model || 'gpt-4o-mini',
                temperature,
                maxTokens,
                systemPrompt
              });

            case 'gemini':
              return await self.generateWithGemini(client, prompt, {
                model: model || 'gemini-2.0-flash',
                temperature,
                maxTokens
              });

            case 'chatglm':
              return await self.generateWithChatGLM(client, prompt, {
                model: model || 'glm-4-flash',
                temperature,
                maxTokens,
                systemPrompt
              });

            default:
              throw new Error(`Unknown provider: ${provider}`);
          }

        } catch (error) {
          console.error(`AI generation error (${provider}):`, error);
          throw error;
        }
      },

      /**
       * Генерация с Claude (Anthropic)
       */
      async generateWithClaude(client, prompt, options) {
        const messages = [{ role: 'user', content: prompt }];

        const requestParams = {
          model: options.model,
          max_tokens: options.maxTokens,
          temperature: options.temperature,
          messages: messages
        };

        if (options.systemPrompt) {
          requestParams.system = options.systemPrompt;
        }

        const response = await client.messages.create(requestParams);

        return response.content[0].text;
      },

      /**
       * Генерация с OpenAI GPT
       */
      async generateWithOpenAI(client, prompt, options) {
        const messages = [];

        if (options.systemPrompt) {
          messages.push({
            role: 'system',
            content: options.systemPrompt
          });
        }

        messages.push({
          role: 'user',
          content: prompt
        });

        const response = await client.chat.completions.create({
          model: options.model,
          messages: messages,
          temperature: options.temperature,
          max_tokens: options.maxTokens
        });

        return response.choices[0].message.content;
      },

      /**
       * Генерация с Google Gemini
       */
      async generateWithGemini(client, prompt, options) {
        const model = client.getGenerativeModel({
          model: options.model
        });

        const result = await model.generateContent({
          contents: [{
            role: 'user',
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: options.temperature,
            maxOutputTokens: options.maxTokens
          }
        });

        return result.response.text();
      },

      /**
       * Генерация с Zhipu AI ChatGLM
       */
      async generateWithChatGLM(client, prompt, options) {
        const messages = [];

        if (options.systemPrompt) {
          messages.push({
            role: 'system',
            content: options.systemPrompt
          });
        }

        messages.push({
          role: 'user',
          content: prompt
        });

        const response = await fetch(client.baseURL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${client.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: options.model,
            messages: messages,
            temperature: options.temperature,
            max_tokens: options.maxTokens
          })
        });

        if (!response.ok) {
          throw new Error(`ChatGLM API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        return data.choices[0].message.content;
      },

      /**
       * Batch генерация с несколькими провайдерами (параллельно)
       */
      async generateWithMultipleProviders(prompt, providers = ['claude', 'openai', 'gemini']) {
        const results = await Promise.allSettled(
          providers.map(provider =>
            self.generateText(prompt, { provider })
              .then(text => ({ provider, text, success: true }))
              .catch(error => ({ provider, error: error.message, success: false }))
          )
        );

        return results.map(result => result.value);
      },

      /**
       * Выбрать лучший ответ из нескольких (используя голосование)
       */
      async generateWithConsensus(prompt, providers = ['claude', 'openai', 'gemini']) {
        const results = await self.generateWithMultipleProviders(prompt, providers);

        const successfulResults = results.filter(r => r.success);

        if (successfulResults.length === 0) {
          throw new Error('All providers failed');
        }

        // Если все дали одинаковый результат, возвращаем его
        if (successfulResults.length === 1) {
          return successfulResults[0].text;
        }

        // TODO: Можно добавить более умную логику выбора лучшего ответа
        // Пока просто возвращаем первый успешный
        return successfulResults[0].text;
      },

      /**
       * Проверить доступность провайдера
       */
      async checkProvider(providerId) {
        try {
          const client = self.getClient(providerId);
          // Простой тестовый запрос
          await self.generateText('Say "OK"', {
            provider: providerId,
            maxTokens: 10
          });
          return { available: true, error: null };
        } catch (error) {
          return { available: false, error: error.message };
        }
      },

      /**
       * Получить статистику по использованию провайдеров
       */
      getProviderStats() {
        // TODO: Можно добавить отслеживание использования
        const providers = self.getAvailableProviders();

        return providers.map(provider => ({
          ...provider,
          status: 'available'
        }));
      }
    };
  }
};

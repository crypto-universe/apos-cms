/**
 * Automatic Translations Module
 * Автоматический перевод контента с использованием:
 * - Google Cloud Translation API
 * - DeepL API
 * - OpenAI GPT (контекстные переводы)
 * - Multi-AI Provider Manager
 */

const { Translator } = require('deepl-node');
const { TranslationServiceClient } = require('@google-cloud/translate').v2;

module.exports = {
  extend: '@apostrophecms/module',

  options: {
    alias: 'automaticTranslations',
    // Дефолтный провайдер переводов
    defaultProvider: 'google' // google | deepl | openai | gemini
  },

  init(self) {
    // Кэш для переводов
    self.translationCache = new Map();

    // Translation memory
    self.translationMemory = new Map();
  },

  handlers(self) {
    return {
      'apostrophe:modulesReady': {
        async setupCollections() {
          // Создаем коллекцию для translation memory
          await self.apos.db.collection('translationMemory').createIndex(
            { sourceText: 1, sourceLang: 1, targetLang: 1 },
            { unique: true }
          );

          await self.apos.db.collection('translationMemory').createIndex(
            { createdAt: 1 },
            { expireAfterSeconds: 90 * 24 * 60 * 60 } // 90 дней TTL
          );
        },

        addRoutes() {
          // ========================================
          // TRANSLATION API
          // ========================================

          // Перевести текст
          self.apos.app.post('/api/translate/text', async (req, res) => {
            try {
              if (!req.user) {
                return res.status(403).json({ error: 'Authentication required' });
              }

              const {
                text,
                sourceLang,
                targetLang,
                provider = null,
                useMemory = true
              } = req.body;

              if (!text || !targetLang) {
                return res.status(400).json({
                  error: 'Text and targetLang are required'
                });
              }

              const translation = await self.translateText(
                text,
                targetLang,
                sourceLang,
                provider,
                useMemory
              );

              return res.json({
                success: true,
                translation: translation,
                provider: translation.provider
              });

            } catch (error) {
              console.error('Translation error:', error);
              return res.status(500).json({
                error: 'Translation failed',
                message: error.message
              });
            }
          });

          // Перевести документ
          self.apos.app.post('/api/translate/document/:docId', async (req, res) => {
            try {
              if (!req.user) {
                return res.status(403).json({ error: 'Authentication required' });
              }

              const { docId } = req.params;
              const {
                targetLangs,
                provider = null,
                fields = null
              } = req.body;

              if (!targetLangs || !Array.isArray(targetLangs)) {
                return res.status(400).json({
                  error: 'targetLangs array is required'
                });
              }

              const result = await self.translateDocument(
                docId,
                targetLangs,
                provider,
                fields
              );

              return res.json({
                success: true,
                translations: result
              });

            } catch (error) {
              console.error('Document translation error:', error);
              return res.status(500).json({
                error: 'Document translation failed',
                message: error.message
              });
            }
          });

          // Batch перевод нескольких документов
          self.apos.app.post('/api/translate/batch', async (req, res) => {
            try {
              if (!req.user) {
                return res.status(403).json({ error: 'Authentication required' });
              }

              const {
                docIds,
                targetLangs,
                provider = null
              } = req.body;

              if (!docIds || !targetLangs) {
                return res.status(400).json({
                  error: 'docIds and targetLangs are required'
                });
              }

              // Запускаем в фоне для больших batch
              if (docIds.length > 10) {
                self.translateBatchBackground(docIds, targetLangs, provider, req.user._id);

                return res.json({
                  success: true,
                  message: 'Batch translation started in background',
                  jobId: Date.now().toString()
                });
              }

              // Для малых batch - выполняем сразу
              const results = [];
              for (const docId of docIds) {
                const result = await self.translateDocument(docId, targetLangs, provider);
                results.push({ docId, result });
              }

              return res.json({
                success: true,
                results: results
              });

            } catch (error) {
              console.error('Batch translation error:', error);
              return res.status(500).json({
                error: 'Batch translation failed',
                message: error.message
              });
            }
          });

          // Получить доступные языки
          self.apos.app.get('/api/translate/languages', async (req, res) => {
            try {
              const provider = req.query.provider || self.options.defaultProvider;

              const languages = await self.getAvailableLanguages(provider);

              return res.json({
                success: true,
                languages: languages,
                provider: provider
              });

            } catch (error) {
              console.error('Get languages error:', error);
              return res.status(500).json({
                error: 'Failed to get languages',
                message: error.message
              });
            }
          });

          // Translation memory search
          self.apos.app.post('/api/translate/memory/search', async (req, res) => {
            try {
              if (!req.user) {
                return res.status(403).json({ error: 'Authentication required' });
              }

              const { text, sourceLang, targetLang } = req.body;

              const result = await self.searchTranslationMemory(
                text,
                sourceLang,
                targetLang
              );

              return res.json({
                success: true,
                found: result !== null,
                translation: result
              });

            } catch (error) {
              console.error('Translation memory search error:', error);
              return res.status(500).json({
                error: 'Search failed',
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
       * Перевести текст
       */
      async translateText(text, targetLang, sourceLang = null, provider = null, useMemory = true) {
        try {
          // Проверяем кэш
          const cacheKey = `${text}:${sourceLang || 'auto'}:${targetLang}:${provider || 'default'}`;
          if (self.translationCache.has(cacheKey)) {
            return self.translationCache.get(cacheKey);
          }

          // Проверяем translation memory
          if (useMemory) {
            const memoryResult = await self.searchTranslationMemory(
              text,
              sourceLang,
              targetLang
            );

            if (memoryResult) {
              return {
                text: memoryResult.targetText,
                sourceLang: memoryResult.sourceLang,
                targetLang: memoryResult.targetLang,
                provider: 'memory'
              };
            }
          }

          const usedProvider = provider || self.options.defaultProvider;

          let translatedText;
          let detectedSourceLang = sourceLang;

          switch (usedProvider) {
            case 'google':
              const googleResult = await self.translateWithGoogle(text, targetLang, sourceLang);
              translatedText = googleResult.text;
              detectedSourceLang = googleResult.sourceLang;
              break;

            case 'deepl':
              const deeplResult = await self.translateWithDeepL(text, targetLang, sourceLang);
              translatedText = deeplResult.text;
              detectedSourceLang = deeplResult.sourceLang;
              break;

            case 'openai':
            case 'claude':
            case 'gemini':
            case 'chatglm':
              translatedText = await self.translateWithAI(text, targetLang, sourceLang, usedProvider);
              break;

            default:
              throw new Error(`Unknown provider: ${usedProvider}`);
          }

          const result = {
            text: translatedText,
            sourceLang: detectedSourceLang || sourceLang,
            targetLang: targetLang,
            provider: usedProvider
          };

          // Сохраняем в кэш
          self.translationCache.set(cacheKey, result);

          // Сохраняем в translation memory
          await self.saveToTranslationMemory(
            text,
            translatedText,
            detectedSourceLang || sourceLang,
            targetLang
          );

          return result;

        } catch (error) {
          console.error('Translate text error:', error);

          // Fallback на AI если основной провайдер не работает
          if (!['openai', 'claude', 'gemini'].includes(provider)) {
            try {
              const fallbackText = await self.translateWithAI(text, targetLang, sourceLang, 'claude');
              return {
                text: fallbackText,
                sourceLang: sourceLang,
                targetLang: targetLang,
                provider: 'claude-fallback'
              };
            } catch (fallbackError) {
              throw new Error(`Translation failed: ${error.message}`);
            }
          }

          throw error;
        }
      },

      /**
       * Перевести с помощью Google Cloud Translation
       */
      async translateWithGoogle(text, targetLang, sourceLang = null) {
        if (!process.env.GOOGLE_CLOUD_TRANSLATION_KEY) {
          throw new Error('GOOGLE_CLOUD_TRANSLATION_KEY not set');
        }

        const translate = new TranslationServiceClient({
          key: process.env.GOOGLE_CLOUD_TRANSLATION_KEY
        });

        const options = {
          to: targetLang
        };

        if (sourceLang) {
          options.from = sourceLang;
        }

        const [translations] = await translate.translate(text, options);
        const translatedText = Array.isArray(translations) ? translations[0] : translations;

        // Google автоопределяет язык
        const [detection] = await translate.detect(text);
        const detectedLang = Array.isArray(detection) ? detection[0].language : detection.language;

        return {
          text: translatedText,
          sourceLang: sourceLang || detectedLang
        };
      },

      /**
       * Перевести с помощью DeepL
       */
      async translateWithDeepL(text, targetLang, sourceLang = null) {
        if (!process.env.DEEPL_API_KEY) {
          throw new Error('DEEPL_API_KEY not set');
        }

        const translator = new Translator(process.env.DEEPL_API_KEY);

        const result = await translator.translateText(
          text,
          sourceLang || null,
          targetLang
        );

        return {
          text: result.text,
          sourceLang: result.detectedSourceLang || sourceLang
        };
      },

      /**
       * Перевести с помощью AI (OpenAI, Claude, Gemini)
       */
      async translateWithAI(text, targetLang, sourceLang = null, provider = 'claude') {
        const targetLanguageNames = {
          'en': 'английский',
          'ru': 'русский',
          'es': 'испанский',
          'fr': 'французский',
          'de': 'немецкий',
          'it': 'итальянский',
          'pt': 'португальский',
          'zh': 'китайский',
          'ja': 'японский',
          'ko': 'корейский'
        };

        const targetLanguageName = targetLanguageNames[targetLang] || targetLang;

        const systemPrompt = `Вы — профессиональный переводчик. Переводите текст точно, сохраняя стиль, тон и форматирование.`;

        const userPrompt = sourceLang
          ? `Переведи следующий текст с ${sourceLang} на ${targetLanguageName}. Верни только перевод без дополнительных комментариев:\n\n${text}`
          : `Переведи следующий текст на ${targetLanguageName}. Верни только перевод без дополнительных комментариев:\n\n${text}`;

        const aiManager = self.apos.aiProviderManager;

        const translation = await aiManager.generateText(userPrompt, {
          provider: provider,
          systemPrompt: systemPrompt,
          temperature: 0.3,
          maxTokens: 2048
        });

        return translation.trim();
      },

      /**
       * Перевести документ
       */
      async translateDocument(docId, targetLangs, provider = null, fields = null) {
        const doc = await self.apos.doc.db.findOne({ _id: docId });

        if (!doc) {
          throw new Error('Document not found');
        }

        const results = {};

        for (const targetLang of targetLangs) {
          // Определяем какие поля переводить
          const fieldsToTranslate = fields || self.getTranslatableFields(doc);

          const translations = {};

          for (const field of fieldsToTranslate) {
            const value = doc[field];

            if (value && typeof value === 'string') {
              const translation = await self.translateText(
                value,
                targetLang,
                null,
                provider
              );

              translations[field] = translation.text;
            }
          }

          results[targetLang] = translations;
        }

        return results;
      },

      /**
       * Получить переводимые поля документа
       */
      getTranslatableFields(doc) {
        const translatableFields = ['title', 'description'];

        // Добавляем поля из схемы если есть
        const module = self.apos.modules[doc.type];
        if (module && module.fields && module.fields.add) {
          Object.keys(module.fields.add).forEach(fieldName => {
            const field = module.fields.add[fieldName];
            if (field.type === 'string' || field.type === 'textarea') {
              if (!translatableFields.includes(fieldName)) {
                translatableFields.push(fieldName);
              }
            }
          });
        }

        return translatableFields.filter(f => doc[f]);
      },

      /**
       * Batch перевод в фоне
       */
      async translateBatchBackground(docIds, targetLangs, provider, userId) {
        // TODO: Использовать queue систему (Bull/Redis)
        // Пока простая реализация
        setTimeout(async () => {
          try {
            for (const docId of docIds) {
              await self.translateDocument(docId, targetLangs, provider);
            }
            console.log(`✅ Batch translation completed for user ${userId}`);
          } catch (error) {
            console.error('Batch translation background error:', error);
          }
        }, 1000);
      },

      /**
       * Получить доступные языки
       */
      async getAvailableLanguages(provider) {
        // Базовый список языков
        const commonLanguages = [
          { code: 'en', name: 'English' },
          { code: 'ru', name: 'Русский' },
          { code: 'es', name: 'Español' },
          { code: 'fr', name: 'Français' },
          { code: 'de', name: 'Deutsch' },
          { code: 'it', name: 'Italiano' },
          { code: 'pt', name: 'Português' },
          { code: 'zh', name: '中文' },
          { code: 'ja', name: '日本語' },
          { code: 'ko', name: '한국어' },
          { code: 'ar', name: 'العربية' },
          { code: 'hi', name: 'हिन्दी' },
          { code: 'tr', name: 'Türkçe' },
          { code: 'pl', name: 'Polski' },
          { code: 'uk', name: 'Українська' }
        ];

        // TODO: Получать актуальный список от провайдеров
        return commonLanguages;
      },

      /**
       * Сохранить в translation memory
       */
      async saveToTranslationMemory(sourceText, targetText, sourceLang, targetLang) {
        try {
          await self.apos.db.collection('translationMemory').updateOne(
            {
              sourceText: sourceText,
              sourceLang: sourceLang,
              targetLang: targetLang
            },
            {
              $set: {
                sourceText: sourceText,
                targetText: targetText,
                sourceLang: sourceLang,
                targetLang: targetLang,
                createdAt: new Date(),
                usageCount: 1
              },
              $inc: {
                usageCount: 1
              }
            },
            { upsert: true }
          );
        } catch (error) {
          // Не критично если не сохранилось
          console.error('Save to translation memory error:', error);
        }
      },

      /**
       * Поиск в translation memory
       */
      async searchTranslationMemory(sourceText, sourceLang, targetLang) {
        try {
          const result = await self.apos.db.collection('translationMemory').findOne({
            sourceText: sourceText,
            sourceLang: sourceLang || { $exists: true },
            targetLang: targetLang
          });

          if (result) {
            // Обновляем счетчик использования
            await self.apos.db.collection('translationMemory').updateOne(
              { _id: result._id },
              { $inc: { usageCount: 1 } }
            );
          }

          return result;
        } catch (error) {
          console.error('Search translation memory error:', error);
          return null;
        }
      }
    };
  }
};

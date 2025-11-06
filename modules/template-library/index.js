/**
 * Template Library Module
 * Библиотека шаблонов для ускорения создания контента:
 * - Создание шаблонов из существующих документов
 * - Layout templates (структура)
 * - Content templates (с placeholder текстом)
 * - Категории и теги
 * - Применение к новым документам
 */

module.exports = {
  extend: '@apostrophecms/module',

  options: {
    alias: 'templateLibrary'
  },

  handlers(self) {
    return {
      'apostrophe:modulesReady': {
        async setupCollections() {
          // Индексы
          await self.apos.db.collection('templates').createIndex({ name: 1 });
          await self.apos.db.collection('templates').createIndex({ docType: 1 });
          await self.apos.db.collection('templates').createIndex({ category: 1 });
          await self.apos.db.collection('templates').createIndex({ tags: 1 });
          await self.apos.db.collection('templates').createIndex({ createdBy: 1 });
        },

        addRoutes() {
          // ========================================
          // TEMPLATES CRUD
          // ========================================

          // Создать шаблон из документа
          self.apos.app.post('/api/templates/create-from-doc/:docId', async (req, res) => {
            try {
              if (!req.user) {
                return res.status(403).json({ error: 'Authentication required' });
              }

              const { docId } = req.params;
              const { name, description, category, tags, includeContent = false } = req.body;

              if (!name) {
                return res.status(400).json({ error: 'Template name is required' });
              }

              const doc = await self.apos.doc.db.findOne({ _id: docId });

              if (!doc) {
                return res.status(404).json({ error: 'Document not found' });
              }

              const template = await self.createTemplateFromDoc(doc, {
                name: name,
                description: description,
                category: category,
                tags: tags || [],
                includeContent: includeContent,
                userId: req.user._id
              });

              return res.json({
                success: true,
                template: template
              });

            } catch (error) {
              console.error('Create template error:', error);
              return res.status(500).json({
                error: 'Failed to create template',
                message: error.message
              });
            }
          });

          // Создать пустой шаблон
          self.apos.app.post('/api/templates/create', async (req, res) => {
            try {
              if (!req.user) {
                return res.status(403).json({ error: 'Authentication required' });
              }

              const {
                name,
                description,
                docType,
                category,
                tags,
                layout,
                content
              } = req.body;

              if (!name || !docType) {
                return res.status(400).json({ error: 'Name and docType are required' });
              }

              const template = {
                name: name,
                description: description || '',
                docType: docType,
                category: category || 'general',
                tags: tags || [],
                layout: layout || {},
                content: content || {},
                isPublic: true,
                usageCount: 0,
                createdAt: new Date(),
                createdBy: req.user._id
              };

              const result = await self.apos.db.collection('templates').insertOne(template);
              template._id = result.insertedId;

              return res.json({
                success: true,
                template: template
              });

            } catch (error) {
              console.error('Create template error:', error);
              return res.status(500).json({
                error: 'Failed to create template',
                message: error.message
              });
            }
          });

          // Получить все шаблоны
          self.apos.app.get('/api/templates', async (req, res) => {
            try {
              if (!req.user) {
                return res.status(403).json({ error: 'Authentication required' });
              }

              const {
                docType,
                category,
                tag,
                search,
                limit = 20,
                offset = 0
              } = req.query;

              const query = {};

              if (docType) {
                query.docType = docType;
              }

              if (category) {
                query.category = category;
              }

              if (tag) {
                query.tags = tag;
              }

              if (search) {
                query.$or = [
                  { name: new RegExp(search, 'i') },
                  { description: new RegExp(search, 'i') }
                ];
              }

              // Публичные шаблоны + свои приватные
              query.$or = query.$or || [];
              query.$or.push({ isPublic: true });
              query.$or.push({ createdBy: req.user._id });

              const templates = await self.apos.db.collection('templates')
                .find(query)
                .sort({ usageCount: -1, name: 1 })
                .skip(parseInt(offset))
                .limit(parseInt(limit))
                .toArray();

              const total = await self.apos.db.collection('templates').countDocuments(query);

              return res.json({
                success: true,
                templates: templates,
                total: total
              });

            } catch (error) {
              console.error('Get templates error:', error);
              return res.status(500).json({
                error: 'Failed to get templates',
                message: error.message
              });
            }
          });

          // Получить конкретный шаблон
          self.apos.app.get('/api/templates/:templateId', async (req, res) => {
            try {
              if (!req.user) {
                return res.status(403).json({ error: 'Authentication required' });
              }

              const { templateId } = req.params;

              const template = await self.apos.db.collection('templates')
                .findOne({ _id: self.apos.db.ObjectId(templateId) });

              if (!template) {
                return res.status(404).json({ error: 'Template not found' });
              }

              return res.json({
                success: true,
                template: template
              });

            } catch (error) {
              console.error('Get template error:', error);
              return res.status(500).json({
                error: 'Failed to get template',
                message: error.message
              });
            }
          });

          // Обновить шаблон
          self.apos.app.put('/api/templates/:templateId', async (req, res) => {
            try {
              if (!req.user) {
                return res.status(403).json({ error: 'Authentication required' });
              }

              const { templateId } = req.params;
              const { name, description, category, tags, layout, content, isPublic } = req.body;

              const update = {
                $set: {
                  name: name,
                  description: description,
                  category: category,
                  tags: tags,
                  layout: layout,
                  content: content,
                  isPublic: isPublic,
                  updatedAt: new Date(),
                  updatedBy: req.user._id
                }
              };

              await self.apos.db.collection('templates').updateOne(
                { _id: self.apos.db.ObjectId(templateId) },
                update
              );

              return res.json({ success: true });

            } catch (error) {
              console.error('Update template error:', error);
              return res.status(500).json({
                error: 'Failed to update template',
                message: error.message
              });
            }
          });

          // Удалить шаблон
          self.apos.app.delete('/api/templates/:templateId', async (req, res) => {
            try {
              if (!req.user) {
                return res.status(403).json({ error: 'Authentication required' });
              }

              const { templateId } = req.params;

              const template = await self.apos.db.collection('templates')
                .findOne({ _id: self.apos.db.ObjectId(templateId) });

              if (!template) {
                return res.status(404).json({ error: 'Template not found' });
              }

              // Проверка прав
              if (template.createdBy !== req.user._id && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Access denied' });
              }

              await self.apos.db.collection('templates').deleteOne({
                _id: self.apos.db.ObjectId(templateId)
              });

              return res.json({ success: true });

            } catch (error) {
              console.error('Delete template error:', error);
              return res.status(500).json({
                error: 'Failed to delete template',
                message: error.message
              });
            }
          });

          // ========================================
          // ПРИМЕНЕНИЕ ШАБЛОНОВ
          // ========================================

          // Применить шаблон к новому документу
          self.apos.app.post('/api/templates/:templateId/apply', async (req, res) => {
            try {
              if (!req.user) {
                return res.status(403).json({ error: 'Authentication required' });
              }

              const { templateId } = req.params;
              const { applyContent = true, applyLayout = true, baseDoc = null } = req.body;

              const doc = await self.applyTemplate(templateId, {
                userId: req.user._id,
                applyContent: applyContent,
                applyLayout: applyLayout,
                baseDoc: baseDoc
              });

              return res.json({
                success: true,
                doc: doc
              });

            } catch (error) {
              console.error('Apply template error:', error);
              return res.status(500).json({
                error: 'Failed to apply template',
                message: error.message
              });
            }
          });

          // ========================================
          // КАТЕГОРИИ И ТЕГИ
          // ========================================

          // Получить все категории
          self.apos.app.get('/api/templates/categories/list', async (req, res) => {
            try {
              if (!req.user) {
                return res.status(403).json({ error: 'Authentication required' });
              }

              const categories = await self.apos.db.collection('templates')
                .distinct('category');

              return res.json({
                success: true,
                categories: categories
              });

            } catch (error) {
              console.error('Get categories error:', error);
              return res.status(500).json({
                error: 'Failed to get categories',
                message: error.message
              });
            }
          });

          // Получить все теги
          self.apos.app.get('/api/templates/tags/list', async (req, res) => {
            try {
              if (!req.user) {
                return res.status(403).json({ error: 'Authentication required' });
              }

              const tags = await self.apos.db.collection('templates')
                .distinct('tags');

              return res.json({
                success: true,
                tags: tags
              });

            } catch (error) {
              console.error('Get tags error:', error);
              return res.status(500).json({
                error: 'Failed to get tags',
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
       * Создать шаблон из документа
       */
      async createTemplateFromDoc(doc, options = {}) {
        try {
          const {
            name,
            description = '',
            category = 'general',
            tags = [],
            includeContent = false,
            userId
          } = options;

          // Извлекаем layout (структуру)
          const layout = self.extractLayout(doc);

          // Извлекаем content если нужно
          const content = includeContent ? self.extractContent(doc) : {};

          const template = {
            name: name,
            description: description,
            docType: doc.type,
            category: category,
            tags: tags,
            layout: layout,
            content: content,
            sourceDocId: doc._id,
            isPublic: true,
            usageCount: 0,
            createdAt: new Date(),
            createdBy: userId
          };

          const result = await self.apos.db.collection('templates').insertOne(template);
          template._id = result.insertedId;

          return template;

        } catch (error) {
          console.error('Create template from doc error:', error);
          throw error;
        }
      },

      /**
       * Извлечь layout (структуру) из документа
       */
      extractLayout(doc) {
        const layout = {
          areas: {},
          widgets: {}
        };

        // Извлекаем структуру areas
        Object.keys(doc).forEach(key => {
          if (doc[key] && typeof doc[key] === 'object' && doc[key].type === 'area') {
            layout.areas[key] = {
              type: 'area',
              widgets: doc[key].items ? doc[key].items.map(item => ({
                type: item.type,
                // Сохраняем только тип и структуру, не content
              })) : []
            };
          }
        });

        return layout;
      },

      /**
       * Извлечь content из документа
       */
      extractContent(doc) {
        const content = {};

        // Копируем базовые поля
        const fieldsToInclude = ['title', 'description'];

        fieldsToInclude.forEach(field => {
          if (doc[field]) {
            content[field] = doc[field];
          }
        });

        // Копируем areas полностью
        Object.keys(doc).forEach(key => {
          if (doc[key] && typeof doc[key] === 'object' && doc[key].type === 'area') {
            content[key] = JSON.parse(JSON.stringify(doc[key]));
          }
        });

        return content;
      },

      /**
       * Применить шаблон
       */
      async applyTemplate(templateId, options = {}) {
        try {
          const {
            userId,
            applyContent = true,
            applyLayout = true,
            baseDoc = null
          } = options;

          const template = await self.apos.db.collection('templates')
            .findOne({ _id: self.apos.db.ObjectId(templateId) });

          if (!template) {
            throw new Error('Template not found');
          }

          // Создаем новый документ
          const doc = baseDoc || {
            type: template.docType,
            slug: 'untitled-' + Date.now(),
            published: false
          };

          // Применяем layout
          if (applyLayout && template.layout) {
            Object.assign(doc, self.applyLayoutToDoc(template.layout, doc));
          }

          // Применяем content
          if (applyContent && template.content) {
            Object.assign(doc, template.content);
          }

          // Добавляем метаданные
          doc.createdAt = new Date();
          doc.createdBy = userId;
          doc.updatedAt = new Date();
          doc.updatedBy = userId;

          // Увеличиваем счетчик использования
          await self.apos.db.collection('templates').updateOne(
            { _id: template._id },
            { $inc: { usageCount: 1 } }
          );

          return doc;

        } catch (error) {
          console.error('Apply template error:', error);
          throw error;
        }
      },

      /**
       * Применить layout к документу
       */
      applyLayoutToDoc(layout, doc) {
        const result = {};

        // Применяем areas
        if (layout.areas) {
          Object.keys(layout.areas).forEach(areaName => {
            const areaLayout = layout.areas[areaName];

            result[areaName] = {
              type: 'area',
              items: areaLayout.widgets.map(widget => ({
                type: widget.type,
                _id: self.apos.util.generateId(),
                // Базовая структура виджета
              }))
            };
          });
        }

        return result;
      }
    };
  }
};

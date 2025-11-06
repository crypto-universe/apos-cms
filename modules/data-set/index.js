// Data Set Module for Apostrophe CMS
// Импорт CSV данных и динамическое отображение в виде таблиц, карт, графиков

const Papa = require('papaparse');
const { createObjectCsvStringifier } = require('csv-writer');

module.exports = {
  extend: '@apostrophecms/piece-type',

  options: {
    label: 'Data Set',
    pluralLabel: 'Data Sets',
    alias: 'dataSet',

    // Опции модуля
    maxFileSize: 10 * 1024 * 1024, // 10MB
    autoDetectTypes: true,
    enableVersioning: true,
    maxVersions: 10
  },

  fields: {
    add: {
      name: {
        type: 'string',
        label: 'Dataset Name',
        required: true
      },
      description: {
        type: 'string',
        label: 'Description',
        textarea: true
      },
      category: {
        type: 'select',
        label: 'Category',
        choices: [
          { label: 'General', value: 'general' },
          { label: 'Financial', value: 'financial' },
          { label: 'Geographic', value: 'geographic' },
          { label: 'Statistical', value: 'statistical' },
          { label: 'Other', value: 'other' }
        ],
        def: 'general'
      },
      tags: {
        type: 'array',
        label: 'Tags',
        schema: [
          {
            type: 'string',
            name: 'tag'
          }
        ]
      },
      isPublic: {
        type: 'boolean',
        label: 'Public Dataset',
        def: true
      }
    }
  },

  init(self) {
    // Инициализация MongoDB коллекций
    self.initializeCollections();

    // Регистрация API routes
    self.registerApiRoutes();

    // Кэш для datasets
    self.datasetCache = new Map();
  },

  methods(self) {
    return {

      // ============================================
      // ИНИЦИАЛИЗАЦИЯ
      // ============================================

      async initializeCollections() {
        const db = self.apos.db;

        // Коллекция datasets metadata
        await db.collection('dataSets').createIndex({ name: 1 });
        await db.collection('dataSets').createIndex({ category: 1 });
        await db.collection('dataSets').createIndex({ createdBy: 1 });
        await db.collection('dataSets').createIndex({ createdAt: -1 });

        // Коллекция dataset records (actual data)
        await db.collection('dataRecords').createIndex({ datasetId: 1 });
        await db.collection('dataRecords').createIndex({ datasetId: 1, createdAt: -1 });

        // Коллекция dataset schemas
        await db.collection('dataSchemas').createIndex({ datasetId: 1 });

        // Коллекция dataset versions
        await db.collection('datasetVersions').createIndex({ datasetId: 1, versionNumber: -1 });
        await db.collection('datasetVersions').createIndex({ createdAt: 1 }, {
          expireAfterSeconds: 90 * 24 * 60 * 60 // TTL 90 дней
        });
      },

      // ============================================
      // CSV ИМПОРТ
      // ============================================

      async importCSV(csvContent, options = {}) {
        const {
          datasetName,
          description = '',
          category = 'general',
          userId,
          delimiter = ',',
          encoding = 'utf-8'
        } = options;

        try {
          // Парсинг CSV с Papa Parse
          const parseResult = Papa.parse(csvContent, {
            header: true,
            dynamicTyping: self.options.autoDetectTypes,
            skipEmptyLines: true,
            delimiter: delimiter,
            encoding: encoding,
            transformHeader: (header) => {
              // Очистка заголовков
              return header.trim().replace(/[^a-zA-Z0-9_]/g, '_');
            }
          });

          if (parseResult.errors.length > 0) {
            throw new Error(`CSV parsing errors: ${JSON.stringify(parseResult.errors)}`);
          }

          const data = parseResult.data;
          if (data.length === 0) {
            throw new Error('CSV file is empty');
          }

          // Автоопределение схемы
          const schema = self.detectSchema(data);

          // Создание dataset
          const dataset = await self.createDataset({
            name: datasetName,
            description: description,
            category: category,
            rowCount: data.length,
            columnCount: Object.keys(schema).length,
            schema: schema,
            userId: userId
          });

          // Импорт данных
          await self.importData(dataset._id, data, schema);

          // Создание первой версии
          if (self.options.enableVersioning) {
            await self.createDatasetVersion(dataset._id, {
              userId: userId,
              comment: 'Initial import',
              rowCount: data.length
            });
          }

          return {
            success: true,
            datasetId: dataset._id,
            rowsImported: data.length,
            schema: schema
          };

        } catch (error) {
          console.error('CSV import error:', error);
          throw error;
        }
      },

      detectSchema(data) {
        if (data.length === 0) return {};

        const schema = {};
        const sample = data.slice(0, Math.min(100, data.length)); // Анализ первых 100 строк

        // Получить все ключи
        const keys = Object.keys(sample[0] || {});

        keys.forEach(key => {
          const values = sample.map(row => row[key]).filter(v => v !== null && v !== undefined && v !== '');

          if (values.length === 0) {
            schema[key] = { type: 'string', nullable: true };
            return;
          }

          // Определение типа
          let type = 'string';
          let isNullable = values.length < sample.length;

          // Проверка на число
          if (values.every(v => !isNaN(parseFloat(v)) && isFinite(v))) {
            type = values.every(v => Number.isInteger(parseFloat(v))) ? 'integer' : 'number';
          }
          // Проверка на boolean
          else if (values.every(v => v === true || v === false || v === 'true' || v === 'false')) {
            type = 'boolean';
          }
          // Проверка на дату
          else if (values.every(v => !isNaN(Date.parse(v)))) {
            type = 'date';
          }
          // Проверка на координаты (lat, lon)
          else if (key.toLowerCase().includes('lat') || key.toLowerCase().includes('latitude')) {
            type = 'latitude';
          }
          else if (key.toLowerCase().includes('lon') || key.toLowerCase().includes('longitude')) {
            type = 'longitude';
          }

          schema[key] = {
            type: type,
            nullable: isNullable,
            label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          };
        });

        return schema;
      },

      // ============================================
      // DATASET CRUD
      // ============================================

      async createDataset(data) {
        const dataset = {
          name: data.name,
          description: data.description || '',
          category: data.category || 'general',
          tags: data.tags || [],
          rowCount: data.rowCount || 0,
          columnCount: data.columnCount || 0,
          schema: data.schema || {},
          isPublic: data.isPublic !== false,
          createdAt: new Date(),
          createdBy: data.userId,
          updatedAt: new Date()
        };

        const result = await self.apos.db.collection('dataSets').insertOne(dataset);
        dataset._id = result.insertedId;

        // Сохранение схемы отдельно
        await self.apos.db.collection('dataSchemas').insertOne({
          datasetId: dataset._id,
          schema: data.schema,
          createdAt: new Date()
        });

        return dataset;
      },

      async getDataset(datasetId) {
        // Проверка кэша
        if (self.datasetCache.has(datasetId)) {
          return self.datasetCache.get(datasetId);
        }

        const dataset = await self.apos.db.collection('dataSets').findOne({
          _id: self.apos.db.ObjectId(datasetId)
        });

        if (dataset) {
          self.datasetCache.set(datasetId, dataset);
        }

        return dataset;
      },

      async updateDataset(datasetId, updates) {
        const result = await self.apos.db.collection('dataSets').updateOne(
          { _id: self.apos.db.ObjectId(datasetId) },
          {
            $set: {
              ...updates,
              updatedAt: new Date()
            }
          }
        );

        // Очистка кэша
        self.datasetCache.delete(datasetId);

        return result.modifiedCount > 0;
      },

      async deleteDataset(datasetId) {
        // Удаление dataset metadata
        await self.apos.db.collection('dataSets').deleteOne({
          _id: self.apos.db.ObjectId(datasetId)
        });

        // Удаление всех записей
        await self.apos.db.collection('dataRecords').deleteMany({ datasetId: datasetId });

        // Удаление схемы
        await self.apos.db.collection('dataSchemas').deleteMany({ datasetId: datasetId });

        // Удаление версий
        await self.apos.db.collection('datasetVersions').deleteMany({ datasetId: datasetId });

        // Очистка кэша
        self.datasetCache.delete(datasetId);

        return true;
      },

      // ============================================
      // DATA RECORDS CRUD
      // ============================================

      async importData(datasetId, data, schema) {
        const records = data.map((row, index) => ({
          datasetId: datasetId,
          rowNumber: index + 1,
          data: self.transformRow(row, schema),
          createdAt: new Date()
        }));

        // Batch insert для производительности
        const batchSize = 1000;
        for (let i = 0; i < records.length; i += batchSize) {
          const batch = records.slice(i, i + batchSize);
          await self.apos.db.collection('dataRecords').insertMany(batch);
        }

        return records.length;
      },

      transformRow(row, schema) {
        const transformed = {};

        Object.keys(schema).forEach(key => {
          const value = row[key];
          const fieldSchema = schema[key];

          if (value === null || value === undefined || value === '') {
            transformed[key] = null;
            return;
          }

          // Преобразование типов
          switch (fieldSchema.type) {
            case 'integer':
              transformed[key] = parseInt(value, 10);
              break;
            case 'number':
              transformed[key] = parseFloat(value);
              break;
            case 'boolean':
              transformed[key] = value === true || value === 'true';
              break;
            case 'date':
              transformed[key] = new Date(value);
              break;
            case 'latitude':
            case 'longitude':
              transformed[key] = parseFloat(value);
              break;
            default:
              transformed[key] = String(value);
          }
        });

        return transformed;
      },

      async getRecords(datasetId, options = {}) {
        const {
          page = 1,
          limit = 50,
          sort = { rowNumber: 1 },
          filter = {}
        } = options;

        const skip = (page - 1) * limit;

        // Построение query с фильтрами
        const query = { datasetId: datasetId };

        if (Object.keys(filter).length > 0) {
          Object.keys(filter).forEach(key => {
            query[`data.${key}`] = filter[key];
          });
        }

        const [records, totalCount] = await Promise.all([
          self.apos.db.collection('dataRecords')
            .find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .toArray(),
          self.apos.db.collection('dataRecords').countDocuments(query)
        ]);

        return {
          records: records,
          pagination: {
            page: page,
            limit: limit,
            totalRecords: totalCount,
            totalPages: Math.ceil(totalCount / limit)
          }
        };
      },

      async updateRecord(recordId, data) {
        const result = await self.apos.db.collection('dataRecords').updateOne(
          { _id: self.apos.db.ObjectId(recordId) },
          { $set: { data: data, updatedAt: new Date() } }
        );

        return result.modifiedCount > 0;
      },

      async deleteRecord(recordId) {
        const result = await self.apos.db.collection('dataRecords').deleteOne({
          _id: self.apos.db.ObjectId(recordId)
        });

        return result.deletedCount > 0;
      },

      // ============================================
      // EXPORT
      // ============================================

      async exportToCSV(datasetId) {
        const dataset = await self.getDataset(datasetId);
        if (!dataset) {
          throw new Error('Dataset not found');
        }

        // Получить все записи
        const records = await self.apos.db.collection('dataRecords')
          .find({ datasetId: datasetId })
          .sort({ rowNumber: 1 })
          .toArray();

        if (records.length === 0) {
          throw new Error('No data to export');
        }

        // Преобразование в CSV
        const data = records.map(r => r.data);
        const csv = Papa.unparse(data, {
          header: true,
          quotes: true
        });

        return {
          csv: csv,
          filename: `${dataset.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.csv`
        };
      },

      // ============================================
      // VERSIONING
      // ============================================

      async createDatasetVersion(datasetId, options = {}) {
        const { userId, comment = '', rowCount } = options;

        const lastVersion = await self.apos.db.collection('datasetVersions')
          .findOne({ datasetId: datasetId }, { sort: { versionNumber: -1 } });

        const versionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

        const version = {
          datasetId: datasetId,
          versionNumber: versionNumber,
          rowCount: rowCount,
          comment: comment,
          createdAt: new Date(),
          createdBy: userId
        };

        await self.apos.db.collection('datasetVersions').insertOne(version);

        // Cleanup old versions
        if (self.options.maxVersions > 0) {
          await self.cleanupOldVersions(datasetId, self.options.maxVersions);
        }

        return version;
      },

      async cleanupOldVersions(datasetId, maxVersions) {
        const versions = await self.apos.db.collection('datasetVersions')
          .find({ datasetId: datasetId })
          .sort({ versionNumber: -1 })
          .skip(maxVersions)
          .toArray();

        if (versions.length > 0) {
          const versionIds = versions.map(v => v._id);
          await self.apos.db.collection('datasetVersions').deleteMany({
            _id: { $in: versionIds }
          });
        }
      },

      // ============================================
      // STATISTICS
      // ============================================

      async getDatasetStats(datasetId) {
        const dataset = await self.getDataset(datasetId);
        if (!dataset) {
          throw new Error('Dataset not found');
        }

        const stats = {
          rowCount: dataset.rowCount,
          columnCount: dataset.columnCount,
          createdAt: dataset.createdAt,
          updatedAt: dataset.updatedAt,
          schema: dataset.schema,
          versions: await self.apos.db.collection('datasetVersions')
            .countDocuments({ datasetId: datasetId })
        };

        // Статистика по колонкам
        const columnStats = {};
        for (const [columnName, columnSchema] of Object.entries(dataset.schema)) {
          if (columnSchema.type === 'number' || columnSchema.type === 'integer') {
            const records = await self.apos.db.collection('dataRecords')
              .find({ datasetId: datasetId })
              .toArray();

            const values = records
              .map(r => r.data[columnName])
              .filter(v => v !== null && v !== undefined && !isNaN(v));

            if (values.length > 0) {
              columnStats[columnName] = {
                min: Math.min(...values),
                max: Math.max(...values),
                avg: values.reduce((a, b) => a + b, 0) / values.length,
                count: values.length
              };
            }
          }
        }

        stats.columnStats = columnStats;

        return stats;
      },

      // ============================================
      // API ROUTES
      // ============================================

      registerApiRoutes() {
        // Upload & Import CSV
        self.apos.app.post('/api/data-set/import', async (req, res) => {
          try {
            if (!req.user) {
              return res.status(401).json({ error: 'Unauthorized' });
            }

            const { csvContent, name, description, category } = req.body;

            if (!csvContent || !name) {
              return res.status(400).json({ error: 'Missing required fields' });
            }

            const result = await self.importCSV(csvContent, {
              datasetName: name,
              description: description,
              category: category,
              userId: req.user._id
            });

            res.json(result);

          } catch (error) {
            console.error('Import API error:', error);
            res.status(500).json({ error: error.message });
          }
        });

        // Get all datasets
        self.apos.app.get('/api/data-set/list', async (req, res) => {
          try {
            const { page = 1, limit = 20, category } = req.query;

            const query = {};
            if (category) query.category = category;
            if (!req.user) query.isPublic = true; // Only public for guests

            const skip = (parseInt(page) - 1) * parseInt(limit);

            const [datasets, totalCount] = await Promise.all([
              self.apos.db.collection('dataSets')
                .find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .toArray(),
              self.apos.db.collection('dataSets').countDocuments(query)
            ]);

            res.json({
              datasets: datasets,
              pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                totalRecords: totalCount,
                totalPages: Math.ceil(totalCount / parseInt(limit))
              }
            });

          } catch (error) {
            console.error('List API error:', error);
            res.status(500).json({ error: error.message });
          }
        });

        // Get dataset by ID
        self.apos.app.get('/api/data-set/:id', async (req, res) => {
          try {
            const dataset = await self.getDataset(req.params.id);

            if (!dataset) {
              return res.status(404).json({ error: 'Dataset not found' });
            }

            if (!dataset.isPublic && (!req.user || dataset.createdBy !== req.user._id)) {
              return res.status(403).json({ error: 'Access denied' });
            }

            res.json(dataset);

          } catch (error) {
            console.error('Get dataset API error:', error);
            res.status(500).json({ error: error.message });
          }
        });

        // Get records
        self.apos.app.get('/api/data-set/:id/records', async (req, res) => {
          try {
            const { page = 1, limit = 50, sort, filter } = req.query;

            const dataset = await self.getDataset(req.params.id);
            if (!dataset) {
              return res.status(404).json({ error: 'Dataset not found' });
            }

            const sortObj = sort ? JSON.parse(sort) : { rowNumber: 1 };
            const filterObj = filter ? JSON.parse(filter) : {};

            const result = await self.getRecords(req.params.id, {
              page: parseInt(page),
              limit: parseInt(limit),
              sort: sortObj,
              filter: filterObj
            });

            res.json(result);

          } catch (error) {
            console.error('Get records API error:', error);
            res.status(500).json({ error: error.message });
          }
        });

        // Export CSV
        self.apos.app.get('/api/data-set/:id/export', async (req, res) => {
          try {
            const dataset = await self.getDataset(req.params.id);
            if (!dataset) {
              return res.status(404).json({ error: 'Dataset not found' });
            }

            const result = await self.exportToCSV(req.params.id);

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
            res.send(result.csv);

          } catch (error) {
            console.error('Export API error:', error);
            res.status(500).json({ error: error.message });
          }
        });

        // Get statistics
        self.apos.app.get('/api/data-set/:id/stats', async (req, res) => {
          try {
            const stats = await self.getDatasetStats(req.params.id);
            res.json(stats);

          } catch (error) {
            console.error('Stats API error:', error);
            res.status(500).json({ error: error.message });
          }
        });

        // Delete dataset
        self.apos.app.delete('/api/data-set/:id', async (req, res) => {
          try {
            if (!req.user) {
              return res.status(401).json({ error: 'Unauthorized' });
            }

            const dataset = await self.getDataset(req.params.id);
            if (!dataset) {
              return res.status(404).json({ error: 'Dataset not found' });
            }

            if (dataset.createdBy !== req.user._id && !req.user.role === 'admin') {
              return res.status(403).json({ error: 'Access denied' });
            }

            await self.deleteDataset(req.params.id);

            res.json({ success: true });

          } catch (error) {
            console.error('Delete API error:', error);
            res.status(500).json({ error: error.message });
          }
        });
      }

    };
  }
};

/**
 * Document Versions Module
 * Полная система версионирования документов:
 * - Автоматическое создание версий при сохранении
 * - Ручное создание версий с комментариями
 * - Timeline всех версий
 * - Сравнение версий (diff)
 * - Восстановление любой версии
 * - Именованные версии (releases, milestones)
 */

const diff = require('diff');
const { compare } = require('fast-json-patch');

module.exports = {
  extend: '@apostrophecms/module',

  options: {
    alias: 'documentVersions',
    // Автосохранение при каждом изменении
    autoSaveVersions: true,
    // Максимальное количество версий (0 = unlimited)
    maxVersions: 50,
    // Автоочистка старых версий (дни, 0 = never)
    autoCleanupDays: 90,
    // Типы документов для версионирования
    enabledTypes: ['article', 'page', '@apostrophecms/image', '@apostrophecms/file']
  },

  init(self) {
    // Кэш для версий
    self.versionsCache = new Map();
  },

  handlers(self) {
    return {
      'apostrophe:modulesReady': {
        async setupCollections() {
          // Индексы для быстрого доступа
          await self.apos.db.collection('documentVersions').createIndex({ docId: 1, versionNumber: -1 });
          await self.apos.db.collection('documentVersions').createIndex({ docId: 1, createdAt: -1 });
          await self.apos.db.collection('documentVersions').createIndex({ docId: 1, name: 1 });
          await self.apos.db.collection('documentVersions').createIndex({ createdBy: 1 });

          // TTL index для автоочистки
          if (self.options.autoCleanupDays > 0) {
            await self.apos.db.collection('documentVersions').createIndex(
              { createdAt: 1 },
              { expireAfterSeconds: self.options.autoCleanupDays * 24 * 60 * 60 }
            );
          }
        },

        addHooks() {
          // Hook на сохранение документов
          self.apos.doc.addSaveBeforeCommitHandler(async (req, doc, options) => {
            if (self.options.autoSaveVersions && self.isVersioningEnabled(doc.type)) {
              await self.createVersion(doc, {
                userId: req.user?._id,
                comment: 'Auto-save',
                type: 'auto'
              });
            }
          });
        },

        addRoutes() {
          // ========================================
          // ВЕРСИИ
          // ========================================

          // Создать версию вручную
          self.apos.app.post('/api/versions/create/:docId', async (req, res) => {
            try {
              if (!req.user) {
                return res.status(403).json({ error: 'Authentication required' });
              }

              const { docId } = req.params;
              const { comment, name, type = 'manual' } = req.body;

              const doc = await self.apos.doc.db.findOne({ _id: docId });

              if (!doc) {
                return res.status(404).json({ error: 'Document not found' });
              }

              const version = await self.createVersion(doc, {
                userId: req.user._id,
                comment: comment || 'Manual save',
                name: name,
                type: type
              });

              return res.json({
                success: true,
                version: version
              });

            } catch (error) {
              console.error('Create version error:', error);
              return res.status(500).json({
                error: 'Failed to create version',
                message: error.message
              });
            }
          });

          // Получить все версии документа
          self.apos.app.get('/api/versions/document/:docId', async (req, res) => {
            try {
              if (!req.user) {
                return res.status(403).json({ error: 'Authentication required' });
              }

              const { docId } = req.params;
              const { limit = 20, offset = 0 } = req.query;

              const versions = await self.apos.db.collection('documentVersions')
                .find({ docId: docId })
                .sort({ versionNumber: -1 })
                .skip(parseInt(offset))
                .limit(parseInt(limit))
                .toArray();

              const total = await self.apos.db.collection('documentVersions')
                .countDocuments({ docId: docId });

              return res.json({
                success: true,
                versions: versions,
                total: total
              });

            } catch (error) {
              console.error('Get versions error:', error);
              return res.status(500).json({
                error: 'Failed to get versions',
                message: error.message
              });
            }
          });

          // Получить конкретную версию
          self.apos.app.get('/api/versions/:versionId', async (req, res) => {
            try {
              if (!req.user) {
                return res.status(403).json({ error: 'Authentication required' });
              }

              const { versionId } = req.params;

              const version = await self.apos.db.collection('documentVersions')
                .findOne({ _id: self.apos.db.ObjectId(versionId) });

              if (!version) {
                return res.status(404).json({ error: 'Version not found' });
              }

              return res.json({
                success: true,
                version: version
              });

            } catch (error) {
              console.error('Get version error:', error);
              return res.status(500).json({
                error: 'Failed to get version',
                message: error.message
              });
            }
          });

          // Сравнить две версии
          self.apos.app.post('/api/versions/compare', async (req, res) => {
            try {
              if (!req.user) {
                return res.status(403).json({ error: 'Authentication required' });
              }

              const { versionId1, versionId2 } = req.body;

              if (!versionId1 || !versionId2) {
                return res.status(400).json({ error: 'Both version IDs required' });
              }

              const diff = await self.compareVersions(versionId1, versionId2);

              return res.json({
                success: true,
                diff: diff
              });

            } catch (error) {
              console.error('Compare versions error:', error);
              return res.status(500).json({
                error: 'Failed to compare versions',
                message: error.message
              });
            }
          });

          // Восстановить версию
          self.apos.app.post('/api/versions/restore/:versionId', async (req, res) => {
            try {
              if (!req.user) {
                return res.status(403).json({ error: 'Authentication required' });
              }

              const { versionId } = req.params;
              const { createBackup = true } = req.body;

              const result = await self.restoreVersion(versionId, req.user._id, createBackup);

              return res.json({
                success: true,
                restoredDoc: result.doc,
                backupVersion: result.backup
              });

            } catch (error) {
              console.error('Restore version error:', error);
              return res.status(500).json({
                error: 'Failed to restore version',
                message: error.message
              });
            }
          });

          // Удалить версию
          self.apos.app.delete('/api/versions/:versionId', async (req, res) => {
            try {
              if (!req.user || req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Admin access required' });
              }

              const { versionId } = req.params;

              await self.apos.db.collection('documentVersions').deleteOne({
                _id: self.apos.db.ObjectId(versionId)
              });

              return res.json({ success: true });

            } catch (error) {
              console.error('Delete version error:', error);
              return res.status(500).json({
                error: 'Failed to delete version',
                message: error.message
              });
            }
          });

          // Timeline версий (для UI)
          self.apos.app.get('/api/versions/timeline/:docId', async (req, res) => {
            try {
              if (!req.user) {
                return res.status(403).json({ error: 'Authentication required' });
              }

              const { docId } = req.params;

              const timeline = await self.getVersionTimeline(docId);

              return res.json({
                success: true,
                timeline: timeline
              });

            } catch (error) {
              console.error('Timeline error:', error);
              return res.status(500).json({
                error: 'Failed to get timeline',
                message: error.message
              });
            }
          });

          // Статистика версий
          self.apos.app.get('/api/versions/stats/:docId', async (req, res) => {
            try {
              if (!req.user) {
                return res.status(403).json({ error: 'Authentication required' });
              }

              const { docId } = req.params;

              const stats = await self.getVersionStats(docId);

              return res.json({
                success: true,
                stats: stats
              });

            } catch (error) {
              console.error('Stats error:', error);
              return res.status(500).json({
                error: 'Failed to get stats',
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
       * Создать версию документа
       */
      async createVersion(doc, options = {}) {
        try {
          const { userId, comment = '', name = null, type = 'manual' } = options;

          // Проверяем включено ли версионирование для этого типа
          if (!self.isVersioningEnabled(doc.type)) {
            return null;
          }

          // Получаем последнюю версию для определения номера
          const lastVersion = await self.apos.db.collection('documentVersions')
            .findOne(
              { docId: doc._id },
              { sort: { versionNumber: -1 } }
            );

          const versionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

          // Создаем snapshot документа
          const snapshot = self.createSnapshot(doc);

          const version = {
            docId: doc._id,
            docType: doc.type,
            versionNumber: versionNumber,
            snapshot: snapshot,
            comment: comment,
            name: name,
            type: type, // 'auto', 'manual', 'milestone', 'release'
            createdAt: new Date(),
            createdBy: userId,
            size: JSON.stringify(snapshot).length
          };

          const result = await self.apos.db.collection('documentVersions').insertOne(version);

          version._id = result.insertedId;

          // Очистка старых версий если нужно
          if (self.options.maxVersions > 0) {
            await self.cleanupOldVersions(doc._id, self.options.maxVersions);
          }

          // Очищаем кэш
          self.versionsCache.delete(doc._id);

          return version;

        } catch (error) {
          console.error('Create version error:', error);
          throw error;
        }
      },

      /**
       * Создать snapshot документа
       */
      createSnapshot(doc) {
        // Создаем копию документа
        const snapshot = JSON.parse(JSON.stringify(doc));

        // Удаляем временные поля
        delete snapshot._id;
        delete snapshot.updatedAt;
        delete snapshot.updatedBy;

        return snapshot;
      },

      /**
       * Сравнить две версии
       */
      async compareVersions(versionId1, versionId2) {
        try {
          const version1 = await self.apos.db.collection('documentVersions')
            .findOne({ _id: self.apos.db.ObjectId(versionId1) });

          const version2 = await self.apos.db.collection('documentVersions')
            .findOne({ _id: self.apos.db.ObjectId(versionId2) });

          if (!version1 || !version2) {
            throw new Error('Version not found');
          }

          // JSON diff
          const jsonDiff = compare(version1.snapshot, version2.snapshot);

          // Text diff для текстовых полей
          const textDiffs = {};

          const textFields = ['title', 'description'];
          textFields.forEach(field => {
            if (version1.snapshot[field] && version2.snapshot[field]) {
              const textDiff = diff.diffWords(
                version1.snapshot[field],
                version2.snapshot[field]
              );
              textDiffs[field] = textDiff;
            }
          });

          return {
            version1: {
              _id: version1._id,
              versionNumber: version1.versionNumber,
              createdAt: version1.createdAt,
              createdBy: version1.createdBy
            },
            version2: {
              _id: version2._id,
              versionNumber: version2.versionNumber,
              createdAt: version2.createdAt,
              createdBy: version2.createdBy
            },
            jsonDiff: jsonDiff,
            textDiffs: textDiffs,
            summary: self.createDiffSummary(jsonDiff)
          };

        } catch (error) {
          console.error('Compare versions error:', error);
          throw error;
        }
      },

      /**
       * Создать краткую сводку diff
       */
      createDiffSummary(jsonDiff) {
        const summary = {
          added: 0,
          removed: 0,
          replaced: 0,
          fields: []
        };

        jsonDiff.forEach(operation => {
          switch (operation.op) {
            case 'add':
              summary.added++;
              break;
            case 'remove':
              summary.removed++;
              break;
            case 'replace':
              summary.replaced++;
              break;
          }

          // Извлекаем имя поля из path
          const pathParts = operation.path.split('/');
          const field = pathParts[1];
          if (field && !summary.fields.includes(field)) {
            summary.fields.push(field);
          }
        });

        return summary;
      },

      /**
       * Восстановить версию
       */
      async restoreVersion(versionId, userId, createBackup = true) {
        try {
          const version = await self.apos.db.collection('documentVersions')
            .findOne({ _id: self.apos.db.ObjectId(versionId) });

          if (!version) {
            throw new Error('Version not found');
          }

          // Получаем текущий документ
          const currentDoc = await self.apos.doc.db.findOne({ _id: version.docId });

          if (!currentDoc) {
            throw new Error('Document not found');
          }

          // Создаем backup текущей версии если нужно
          let backupVersion = null;
          if (createBackup) {
            backupVersion = await self.createVersion(currentDoc, {
              userId: userId,
              comment: `Backup before restore to v${version.versionNumber}`,
              type: 'backup'
            });
          }

          // Восстанавливаем snapshot
          const restoredDoc = { ...version.snapshot };
          restoredDoc._id = version.docId;
          restoredDoc.updatedAt = new Date();
          restoredDoc.updatedBy = userId;

          // Обновляем документ
          await self.apos.doc.db.updateOne(
            { _id: version.docId },
            { $set: restoredDoc }
          );

          // Создаем версию о восстановлении
          await self.createVersion(restoredDoc, {
            userId: userId,
            comment: `Restored from v${version.versionNumber}`,
            type: 'restore'
          });

          return {
            doc: restoredDoc,
            backup: backupVersion
          };

        } catch (error) {
          console.error('Restore version error:', error);
          throw error;
        }
      },

      /**
       * Получить timeline версий
       */
      async getVersionTimeline(docId) {
        try {
          const versions = await self.apos.db.collection('documentVersions')
            .find({ docId: docId })
            .sort({ versionNumber: -1 })
            .toArray();

          // Группируем по датам
          const timeline = {};

          versions.forEach(version => {
            const date = version.createdAt.toISOString().split('T')[0];

            if (!timeline[date]) {
              timeline[date] = [];
            }

            timeline[date].push({
              _id: version._id,
              versionNumber: version.versionNumber,
              comment: version.comment,
              name: version.name,
              type: version.type,
              createdAt: version.createdAt,
              createdBy: version.createdBy,
              size: version.size
            });
          });

          return timeline;

        } catch (error) {
          console.error('Get timeline error:', error);
          throw error;
        }
      },

      /**
       * Получить статистику версий
       */
      async getVersionStats(docId) {
        try {
          const versions = await self.apos.db.collection('documentVersions')
            .find({ docId: docId })
            .toArray();

          const stats = {
            total: versions.length,
            byType: {},
            byUser: {},
            totalSize: 0,
            firstVersion: null,
            lastVersion: null
          };

          versions.forEach(version => {
            // By type
            stats.byType[version.type] = (stats.byType[version.type] || 0) + 1;

            // By user
            if (version.createdBy) {
              stats.byUser[version.createdBy] = (stats.byUser[version.createdBy] || 0) + 1;
            }

            // Total size
            stats.totalSize += version.size || 0;

            // First/Last
            if (!stats.firstVersion || version.versionNumber === 1) {
              stats.firstVersion = version;
            }
            if (!stats.lastVersion || version.versionNumber > stats.lastVersion.versionNumber) {
              stats.lastVersion = version;
            }
          });

          return stats;

        } catch (error) {
          console.error('Get stats error:', error);
          throw error;
        }
      },

      /**
       * Очистка старых версий
       */
      async cleanupOldVersions(docId, maxVersions) {
        try {
          const count = await self.apos.db.collection('documentVersions')
            .countDocuments({ docId: docId });

          if (count > maxVersions) {
            const toDelete = count - maxVersions;

            // Получаем старые версии (не named и не milestone)
            const oldVersions = await self.apos.db.collection('documentVersions')
              .find({
                docId: docId,
                name: null,
                type: { $nin: ['milestone', 'release'] }
              })
              .sort({ versionNumber: 1 })
              .limit(toDelete)
              .toArray();

            const idsToDelete = oldVersions.map(v => v._id);

            await self.apos.db.collection('documentVersions').deleteMany({
              _id: { $in: idsToDelete }
            });
          }

        } catch (error) {
          console.error('Cleanup old versions error:', error);
        }
      },

      /**
       * Проверить включено ли версионирование для типа
       */
      isVersioningEnabled(docType) {
        return self.options.enabledTypes.includes(docType);
      },

      /**
       * Включить версионирование для типа
       */
      enableVersioningForType(docType) {
        if (!self.options.enabledTypes.includes(docType)) {
          self.options.enabledTypes.push(docType);
        }
      },

      /**
       * Отключить версионирование для типа
       */
      disableVersioningForType(docType) {
        const index = self.options.enabledTypes.indexOf(docType);
        if (index > -1) {
          self.options.enabledTypes.splice(index, 1);
        }
      }
    };
  }
};

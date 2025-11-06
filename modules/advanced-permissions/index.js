/**
 * Advanced Permissions Module
 * Детальная система управления правами доступа:
 * - Пользовательские группы
 * - Разрешения на уровне документов
 * - Разрешения по типам контента
 * - Локализованные разрешения
 */

module.exports = {
  extend: '@apostrophecms/module',

  options: {
    alias: 'advancedPermissions'
  },

  init(self) {
    // Кэш для разрешений
    self.permissionsCache = new Map();
  },

  handlers(self) {
    return {
      'apostrophe:modulesReady': {
        async setupCollections() {
          // Создаем индексы для производительности
          await self.apos.db.collection('advancedGroups').createIndex({ name: 1 }, { unique: true });
          await self.apos.db.collection('documentPermissions').createIndex({ docId: 1, groupId: 1 });
          await self.apos.db.collection('documentPermissions').createIndex({ docId: 1 });
        },

        addRoutes() {
          // ========================================
          // ГРУППЫ
          // ========================================

          // Создать группу
          self.apos.app.post('/api/permissions/groups', async (req, res) => {
            try {
              if (!req.user || !req.user.role === 'admin') {
                return res.status(403).json({ error: 'Admin access required' });
              }

              const { name, description, permissions, locale } = req.body;

              if (!name) {
                return res.status(400).json({ error: 'Group name is required' });
              }

              const group = {
                name: name,
                description: description || '',
                permissions: permissions || {},
                locale: locale || null,
                createdAt: new Date(),
                createdBy: req.user._id
              };

              const result = await self.apos.db.collection('advancedGroups').insertOne(group);

              return res.json({
                success: true,
                group: { ...group, _id: result.insertedId }
              });

            } catch (error) {
              console.error('Create group error:', error);
              return res.status(500).json({
                error: 'Failed to create group',
                message: error.message
              });
            }
          });

          // Получить все группы
          self.apos.app.get('/api/permissions/groups', async (req, res) => {
            try {
              if (!req.user || !req.user.role === 'admin') {
                return res.status(403).json({ error: 'Admin access required' });
              }

              const groups = await self.apos.db.collection('advancedGroups')
                .find({})
                .sort({ name: 1 })
                .toArray();

              return res.json({
                success: true,
                groups: groups
              });

            } catch (error) {
              console.error('Get groups error:', error);
              return res.status(500).json({
                error: 'Failed to get groups',
                message: error.message
              });
            }
          });

          // Обновить группу
          self.apos.app.put('/api/permissions/groups/:groupId', async (req, res) => {
            try {
              if (!req.user || !req.user.role === 'admin') {
                return res.status(403).json({ error: 'Admin access required' });
              }

              const { groupId } = req.params;
              const { name, description, permissions, locale } = req.body;

              const update = {
                $set: {
                  name: name,
                  description: description,
                  permissions: permissions,
                  locale: locale,
                  updatedAt: new Date(),
                  updatedBy: req.user._id
                }
              };

              await self.apos.db.collection('advancedGroups').updateOne(
                { _id: self.apos.db.ObjectId(groupId) },
                update
              );

              // Очищаем кэш
              self.clearPermissionsCache();

              return res.json({ success: true });

            } catch (error) {
              console.error('Update group error:', error);
              return res.status(500).json({
                error: 'Failed to update group',
                message: error.message
              });
            }
          });

          // Удалить группу
          self.apos.app.delete('/api/permissions/groups/:groupId', async (req, res) => {
            try {
              if (!req.user || !req.user.role === 'admin') {
                return res.status(403).json({ error: 'Admin access required' });
              }

              const { groupId } = req.params;

              await self.apos.db.collection('advancedGroups').deleteOne({
                _id: self.apos.db.ObjectId(groupId)
              });

              // Удаляем пользователей из группы
              await self.apos.user.db.updateMany(
                { groups: groupId },
                { $pull: { groups: groupId } }
              );

              // Очищаем кэш
              self.clearPermissionsCache();

              return res.json({ success: true });

            } catch (error) {
              console.error('Delete group error:', error);
              return res.status(500).json({
                error: 'Failed to delete group',
                message: error.message
              });
            }
          });

          // ========================================
          // ПОЛЬЗОВАТЕЛИ В ГРУППАХ
          // ========================================

          // Добавить пользователя в группу
          self.apos.app.post('/api/permissions/groups/:groupId/users', async (req, res) => {
            try {
              if (!req.user || !req.user.role === 'admin') {
                return res.status(403).json({ error: 'Admin access required' });
              }

              const { groupId } = req.params;
              const { userId } = req.body;

              await self.apos.user.db.updateOne(
                { _id: userId },
                { $addToSet: { groups: groupId } }
              );

              // Очищаем кэш для этого пользователя
              self.clearUserPermissionsCache(userId);

              return res.json({ success: true });

            } catch (error) {
              console.error('Add user to group error:', error);
              return res.status(500).json({
                error: 'Failed to add user to group',
                message: error.message
              });
            }
          });

          // Удалить пользователя из группы
          self.apos.app.delete('/api/permissions/groups/:groupId/users/:userId', async (req, res) => {
            try {
              if (!req.user || !req.user.role === 'admin') {
                return res.status(403).json({ error: 'Admin access required' });
              }

              const { groupId, userId } = req.params;

              await self.apos.user.db.updateOne(
                { _id: userId },
                { $pull: { groups: groupId } }
              );

              // Очищаем кэш
              self.clearUserPermissionsCache(userId);

              return res.json({ success: true });

            } catch (error) {
              console.error('Remove user from group error:', error);
              return res.status(500).json({
                error: 'Failed to remove user from group',
                message: error.message
              });
            }
          });

          // ========================================
          // РАЗРЕШЕНИЯ НА ДОКУМЕНТЫ
          // ========================================

          // Установить разрешения на документ
          self.apos.app.post('/api/permissions/documents/:docId', async (req, res) => {
            try {
              if (!req.user) {
                return res.status(403).json({ error: 'Authentication required' });
              }

              const { docId } = req.params;
              const { groupId, permissions } = req.body;

              // Проверяем что пользователь может управлять этим документом
              const canManage = await self.canManagePermissions(req.user, docId);
              if (!canManage) {
                return res.status(403).json({ error: 'Cannot manage permissions for this document' });
              }

              await self.apos.db.collection('documentPermissions').updateOne(
                { docId: docId, groupId: groupId },
                {
                  $set: {
                    docId: docId,
                    groupId: groupId,
                    permissions: permissions,
                    updatedAt: new Date(),
                    updatedBy: req.user._id
                  }
                },
                { upsert: true }
              );

              // Очищаем кэш
              self.clearDocumentPermissionsCache(docId);

              return res.json({ success: true });

            } catch (error) {
              console.error('Set document permissions error:', error);
              return res.status(500).json({
                error: 'Failed to set permissions',
                message: error.message
              });
            }
          });

          // Получить разрешения на документ
          self.apos.app.get('/api/permissions/documents/:docId', async (req, res) => {
            try {
              if (!req.user) {
                return res.status(403).json({ error: 'Authentication required' });
              }

              const { docId } = req.params;

              const permissions = await self.apos.db.collection('documentPermissions')
                .find({ docId: docId })
                .toArray();

              return res.json({
                success: true,
                permissions: permissions
              });

            } catch (error) {
              console.error('Get document permissions error:', error);
              return res.status(500).json({
                error: 'Failed to get permissions',
                message: error.message
              });
            }
          });

          // Удалить разрешения
          self.apos.app.delete('/api/permissions/documents/:docId/groups/:groupId', async (req, res) => {
            try {
              if (!req.user) {
                return res.status(403).json({ error: 'Authentication required' });
              }

              const { docId, groupId } = req.params;

              const canManage = await self.canManagePermissions(req.user, docId);
              if (!canManage) {
                return res.status(403).json({ error: 'Cannot manage permissions' });
              }

              await self.apos.db.collection('documentPermissions').deleteOne({
                docId: docId,
                groupId: groupId
              });

              // Очищаем кэш
              self.clearDocumentPermissionsCache(docId);

              return res.json({ success: true });

            } catch (error) {
              console.error('Delete document permissions error:', error);
              return res.status(500).json({
                error: 'Failed to delete permissions',
                message: error.message
              });
            }
          });

          // ========================================
          // ПРОВЕРКА РАЗРЕШЕНИЙ
          // ========================================

          // Проверить может ли пользователь выполнить действие
          self.apos.app.post('/api/permissions/check', async (req, res) => {
            try {
              if (!req.user) {
                return res.json({ allowed: false });
              }

              const { action, docId, docType, locale } = req.body;

              const allowed = await self.checkPermission(req.user, action, {
                docId: docId,
                docType: docType,
                locale: locale
              });

              return res.json({ allowed: allowed });

            } catch (error) {
              console.error('Check permission error:', error);
              return res.json({ allowed: false });
            }
          });
        }
      }
    };
  },

  methods(self) {
    return {
      /**
       * Проверить разрешение пользователя
       */
      async checkPermission(user, action, options = {}) {
        try {
          // Админы могут все
          if (user.role === 'admin') {
            return true;
          }

          const { docId, docType, locale } = options;

          // Проверяем кэш
          const cacheKey = `${user._id}:${action}:${docId || docType}:${locale || ''}`;
          if (self.permissionsCache.has(cacheKey)) {
            return self.permissionsCache.get(cacheKey);
          }

          // Получаем группы пользователя
          const userGroups = user.groups || [];

          if (userGroups.length === 0) {
            return false;
          }

          // Получаем разрешения групп
          const groups = await self.apos.db.collection('advancedGroups')
            .find({ _id: { $in: userGroups.map(g => self.apos.db.ObjectId(g)) } })
            .toArray();

          // Проверяем разрешения на уровне документа
          if (docId) {
            const docPermissions = await self.apos.db.collection('documentPermissions')
              .find({
                docId: docId,
                groupId: { $in: userGroups }
              })
              .toArray();

            for (const perm of docPermissions) {
              if (perm.permissions && perm.permissions[action]) {
                self.permissionsCache.set(cacheKey, true);
                return true;
              }
            }
          }

          // Проверяем разрешения на уровне типа контента
          if (docType) {
            for (const group of groups) {
              // Проверяем локаль если указана
              if (locale && group.locale && group.locale !== locale) {
                continue;
              }

              if (group.permissions && group.permissions[docType]) {
                const typePerms = group.permissions[docType];
                if (typePerms[action] || typePerms['all']) {
                  self.permissionsCache.set(cacheKey, true);
                  return true;
                }
              }
            }
          }

          // Общие разрешения группы
          for (const group of groups) {
            if (group.permissions && group.permissions['*']) {
              const globalPerms = group.permissions['*'];
              if (globalPerms[action] || globalPerms['all']) {
                self.permissionsCache.set(cacheKey, true);
                return true;
              }
            }
          }

          self.permissionsCache.set(cacheKey, false);
          return false;

        } catch (error) {
          console.error('Check permission error:', error);
          return false;
        }
      },

      /**
       * Может ли пользователь управлять разрешениями документа
       */
      async canManagePermissions(user, docId) {
        if (user.role === 'admin') {
          return true;
        }

        // Проверяем владение документом
        const doc = await self.apos.doc.db.findOne({ _id: docId });
        if (doc && doc.createdBy === user._id) {
          return true;
        }

        // Проверяем специальное разрешение
        return await self.checkPermission(user, 'managePermissions', { docId: docId });
      },

      /**
       * Получить все разрешения пользователя
       */
      async getUserPermissions(userId) {
        try {
          const user = await self.apos.user.find(req, { _id: userId }).toObject();

          if (!user) {
            return null;
          }

          if (user.role === 'admin') {
            return {
              isAdmin: true,
              groups: [],
              permissions: { '*': { all: true } }
            };
          }

          const userGroups = user.groups || [];

          const groups = await self.apos.db.collection('advancedGroups')
            .find({ _id: { $in: userGroups.map(g => self.apos.db.ObjectId(g)) } })
            .toArray();

          // Объединяем разрешения из всех групп
          const mergedPermissions = {};

          groups.forEach(group => {
            if (group.permissions) {
              Object.keys(group.permissions).forEach(key => {
                if (!mergedPermissions[key]) {
                  mergedPermissions[key] = {};
                }
                Object.assign(mergedPermissions[key], group.permissions[key]);
              });
            }
          });

          return {
            isAdmin: false,
            groups: groups,
            permissions: mergedPermissions
          };

        } catch (error) {
          console.error('Get user permissions error:', error);
          return null;
        }
      },

      /**
       * Очистка кэша
       */
      clearPermissionsCache() {
        self.permissionsCache.clear();
      },

      clearUserPermissionsCache(userId) {
        for (const key of self.permissionsCache.keys()) {
          if (key.startsWith(`${userId}:`)) {
            self.permissionsCache.delete(key);
          }
        }
      },

      clearDocumentPermissionsCache(docId) {
        for (const key of self.permissionsCache.keys()) {
          if (key.includes(`:${docId}:`)) {
            self.permissionsCache.delete(key);
          }
        }
      }
    };
  }
};

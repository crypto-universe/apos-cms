# Advanced Permissions Module

## 🔐 Обзор

Модуль Advanced Permissions предоставляет детальную систему управления правами доступа для Apostrophe CMS, аналогичную Apostrophe Pro.

## ✨ Возможности

### Пользовательские группы
- Создание неограниченного количества групп
- Назначение пользователей в несколько групп
- Описания и метаданные для групп

### Разрешения на уровне документов
- Индивидуальные права для каждого документа
- Права просмотра, редактирования, публикации
- Наследование разрешений

### Разрешения по типам контента
- Управление доступом к разным типам (статьи, страницы, продукты)
- Отдельные CRUD права для каждого типа

### Локализованные разрешения
- Разные права для разных языков
- Управление переводчиками

## 📋 API Endpoints

### Группы

#### POST /api/permissions/groups
Создать новую группу
```json
{
  "name": "Editors",
  "description": "Content editors",
  "permissions": {
    "article": { "view": true, "edit": true, "create": true },
    "page": { "view": true, "edit": true }
  },
  "locale": "en"
}
```

#### GET /api/permissions/groups
Получить все группы

#### PUT /api/permissions/groups/:groupId
Обновить группу

#### DELETE /api/permissions/groups/:groupId
Удалить группу

### Пользователи в группах

#### POST /api/permissions/groups/:groupId/users
Добавить пользователя в группу
```json
{
  "userId": "user123"
}
```

#### DELETE /api/permissions/groups/:groupId/users/:userId
Удалить пользователя из группы

### Разрешения на документы

#### POST /api/permissions/documents/:docId
Установить разрешения на документ
```json
{
  "groupId": "group123",
  "permissions": {
    "view": true,
    "edit": true,
    "publish": false
  }
}
```

#### GET /api/permissions/documents/:docId
Получить разрешения документа

#### DELETE /api/permissions/documents/:docId/groups/:groupId
Удалить разрешения группы с документа

### Проверка разрешений

#### POST /api/permissions/check
Проверить разрешение пользователя
```json
{
  "action": "edit",
  "docId": "doc123",
  "docType": "article",
  "locale": "en"
}
```

## 💻 Использование в коде

### Проверка разрешений

```javascript
const advancedPermissions = self.apos.advancedPermissions;

// Проверить может ли пользователь выполнить действие
const canEdit = await advancedPermissions.checkPermission(
  req.user,
  'edit',
  {
    docId: article._id,
    docType: 'article',
    locale: 'en'
  }
);

if (!canEdit) {
  throw self.apos.error('forbidden');
}
```

### Middleware для защиты маршрутов

```javascript
self.apos.app.get('/admin/articles', async (req, res) => {
  const canView = await self.apos.advancedPermissions.checkPermission(
    req.user,
    'view',
    { docType: 'article' }
  );

  if (!canView) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // ... код
});
```

### Получение разрешений пользователя

```javascript
const permissions = await self.apos.advancedPermissions.getUserPermissions(userId);

console.log(permissions);
// {
//   isAdmin: false,
//   groups: [...],
//   permissions: {
//     article: { view: true, edit: true },
//     page: { view: true }
//   }
// }
```

## 🏗️ Структура разрешений

### Формат разрешений группы

```javascript
{
  "article": {
    "view": true,
    "edit": true,
    "create": true,
    "delete": false,
    "publish": false
  },
  "page": {
    "view": true,
    "edit": true
  },
  "*": {
    // Глобальные разрешения для всех типов
    "view": true
  }
}
```

### Действия (actions)

Стандартные действия:
- `view` - Просмотр
- `edit` - Редактирование
- `create` - Создание
- `delete` - Удаление
- `publish` - Публикация
- `managePermissions` - Управление разрешениями
- `all` - Все действия

### Приоритет разрешений

1. **Админы** - имеют все права всегда
2. **Разрешения на уровне документа** - самый высокий приоритет
3. **Разрешения на уровне типа** - средний приоритет
4. **Глобальные разрешения** (`*`) - низкий приоритет

## 🎨 UI Интерфейс

### Админ-панель

Доступна по адресу: `/admin/advanced-permissions` (планируется)

Возможности UI:
- Управление группами
- Матрица разрешений
- Назначение пользователей
- Drag-and-drop интерфейс

## ⚡ Производительность

### Кэширование

Модуль использует in-memory кэш для разрешений:
- Автоматическая инвалидация при изменениях
- Кэширование на уровне пользователя
- Кэширование на уровне документа

### Индексы MongoDB

Созданы индексы для оптимизации:
- `advancedGroups.name` - unique index
- `documentPermissions.docId + groupId` - compound index
- `documentPermissions.docId` - single index

## 🔧 Конфигурация

### Опции модуля

```javascript
// В app.js
'advanced-permissions': {
  options: {
    // Включить кэширование (по умолчанию true)
    enableCache: true,

    // Размер кэша (по умолчанию не ограничен)
    cacheMaxSize: 10000,

    // TTL кэша в секундах (по умолчанию infinity)
    cacheTTL: 3600
  }
}
```

## 📊 Схема MongoDB

### Коллекция: advancedGroups

```javascript
{
  _id: ObjectId,
  name: String,           // unique
  description: String,
  permissions: Object,    // структура разрешений
  locale: String,         // optional, для локализации
  createdAt: Date,
  createdBy: String,      // user._id
  updatedAt: Date,
  updatedBy: String
}
```

### Коллекция: documentPermissions

```javascript
{
  _id: ObjectId,
  docId: String,          // ID документа
  groupId: String,        // ID группы
  permissions: Object,    // разрешения для этой группы
  updatedAt: Date,
  updatedBy: String
}
```

### Расширение коллекции users

```javascript
{
  // ... стандартные поля
  groups: [String]        // массив ID групп
}
```

## 🚀 Миграция с базовых разрешений

Apostrophe имеет базовую систему `role`:
- `admin` - полный доступ
- `editor` - редактор
- `contributor` - автор
- `guest` - гость

Advanced Permissions расширяет эту систему:

```javascript
// До
if (req.user.role === 'editor') {
  // ...
}

// После
const canEdit = await self.apos.advancedPermissions.checkPermission(
  req.user,
  'edit',
  { docType: 'article' }
);
```

## 🐛 Отладка

### Включить debug логи

```javascript
// В modules/advanced-permissions/index.js
options: {
  debug: true
}
```

### Очистка кэша

```javascript
// Полная очистка
self.apos.advancedPermissions.clearPermissionsCache();

// Очистка для пользователя
self.apos.advancedPermissions.clearUserPermissionsCache(userId);

// Очистка для документа
self.apos.advancedPermissions.clearDocumentPermissionsCache(docId);
```

## 📝 TODO

- [ ] Admin UI interface
- [ ] Bulk operations API
- [ ] Export/Import permissions
- [ ] Audit log
- [ ] Permission templates
- [ ] Integration with @apostrophecms/user
- [ ] WebSocket updates для real-time

## 🤝 Совместимость

- **Apostrophe CMS**: 4.x
- **Node.js**: 18+
- **MongoDB**: 4.4+

## 📄 Лицензия

MIT

---

**Статус**: 🟡 Beta - Core функционал реализован, UI в разработке

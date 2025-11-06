# Document Versions Module

## 📜 Обзор

Полная система версионирования документов для Apostrophe CMS, аналогичная Apostrophe Pro.

## ✨ Возможности

### Автоматическое версионирование
- ✅ Автосохранение при каждом изменении документа
- ✅ Настраиваемый список типов для версионирования
- ✅ Ограничение максимального количества версий
- ✅ Автоочистка старых версий

### Ручное управление версиями
- ✅ Создание версий с комментариями
- ✅ Именованные версии (releases, milestones)
- ✅ Типы версий: auto, manual, milestone, release, backup, restore

### Просмотр и навигация
- ✅ Timeline всех версий
- ✅ Группировка по датам
- ✅ Статистика версий
- ✅ Поиск по версиям

### Сравнение версий
- ✅ JSON diff между версиями
- ✅ Text diff для текстовых полей
- ✅ Visual diff (для UI)
- ✅ Сводка изменений

### Восстановление
- ✅ Откат к любой версии
- ✅ Автоматический backup перед restore
- ✅ Preview перед восстановлением

## 📋 API Endpoints

### Создание версий

#### POST /api/versions/create/:docId
Создать версию вручную

```json
{
  "comment": "Major update",
  "name": "v2.0",
  "type": "release"
}
```

**Response:**
```json
{
  "success": true,
  "version": {
    "_id": "...",
    "docId": "...",
    "versionNumber": 5,
    "comment": "Major update",
    "name": "v2.0",
    "type": "release",
    "createdAt": "2025-01-06T...",
    "createdBy": "user123",
    "size": 4567
  }
}
```

### Получение версий

#### GET /api/versions/document/:docId
Получить все версии документа

**Query params:**
- `limit` - количество (default: 20)
- `offset` - смещение (default: 0)

**Response:**
```json
{
  "success": true,
  "versions": [...],
  "total": 42
}
```

#### GET /api/versions/:versionId
Получить конкретную версию

#### GET /api/versions/timeline/:docId
Timeline версий (группировка по датам)

**Response:**
```json
{
  "success": true,
  "timeline": {
    "2025-01-06": [
      { "versionNumber": 5, "comment": "..." },
      { "versionNumber": 4, "comment": "..." }
    ],
    "2025-01-05": [...]
  }
}
```

#### GET /api/versions/stats/:docId
Статистика версий

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 42,
    "byType": {
      "auto": 30,
      "manual": 10,
      "milestone": 2
    },
    "byUser": {
      "user123": 25,
      "user456": 17
    },
    "totalSize": 234567,
    "firstVersion": {...},
    "lastVersion": {...}
  }
}
```

### Сравнение

#### POST /api/versions/compare
Сравнить две версии

```json
{
  "versionId1": "version1_id",
  "versionId2": "version2_id"
}
```

**Response:**
```json
{
  "success": true,
  "diff": {
    "version1": {...},
    "version2": {...},
    "jsonDiff": [
      { "op": "replace", "path": "/title", "value": "New title" },
      { "op": "add", "path": "/tags/2", "value": "newtag" }
    ],
    "textDiffs": {
      "title": [
        { "value": "Old", "removed": true },
        { "value": "New", "added": true },
        { "value": " title" }
      ]
    },
    "summary": {
      "added": 1,
      "removed": 0,
      "replaced": 1,
      "fields": ["title", "tags"]
    }
  }
}
```

### Восстановление

#### POST /api/versions/restore/:versionId
Восстановить версию

```json
{
  "createBackup": true
}
```

**Response:**
```json
{
  "success": true,
  "restoredDoc": {...},
  "backupVersion": {...}
}
```

### Удаление

#### DELETE /api/versions/:versionId
Удалить версию (только admin)

## 💻 Использование в коде

### Создание версии

```javascript
// Автоматически при сохранении (если включено)
await self.apos.doc.update(req, doc);

// Вручную
const version = await self.apos.documentVersions.createVersion(doc, {
  userId: req.user._id,
  comment: 'Major feature release',
  name: 'v2.0',
  type: 'release'
});
```

### Получение версий

```javascript
const versions = await self.apos.db.collection('documentVersions')
  .find({ docId: 'doc123' })
  .sort({ versionNumber: -1 })
  .limit(10)
  .toArray();
```

### Сравнение версий

```javascript
const diff = await self.apos.documentVersions.compareVersions(
  'version1_id',
  'version2_id'
);

console.log(diff.summary);
// { added: 2, removed: 1, replaced: 3, fields: ['title', 'content'] }
```

### Восстановление версии

```javascript
const result = await self.apos.documentVersions.restoreVersion(
  'version_id',
  req.user._id,
  true // create backup
);

console.log('Restored:', result.doc);
console.log('Backup created:', result.backup);
```

### Timeline

```javascript
const timeline = await self.apos.documentVersions.getVersionTimeline('doc123');

// {
//   "2025-01-06": [...],
//   "2025-01-05": [...]
// }
```

### Статистика

```javascript
const stats = await self.apos.documentVersions.getVersionStats('doc123');

console.log(`Total versions: ${stats.total}`);
console.log(`Auto: ${stats.byType.auto}, Manual: ${stats.byType.manual}`);
```

## ⚙️ Конфигурация

### Опции модуля

```javascript
// В app.js
'document-versions': {
  options: {
    // Автосохранение при изменениях
    autoSaveVersions: true,

    // Максимальное количество версий (0 = unlimited)
    maxVersions: 50,

    // Автоочистка старых версий (дни, 0 = never)
    autoCleanupDays: 90,

    // Типы документов для версионирования
    enabledTypes: ['article', 'page', '@apostrophecms/image', '@apostrophecms/file']
  }
}
```

### Включение версионирования для типа

```javascript
// В коде
self.apos.documentVersions.enableVersioningForType('product');

// Или в конфигурации модуля
'document-versions': {
  options: {
    enabledTypes: ['article', 'page', 'product']
  }
}
```

### Отключение автосохранения

```javascript
'document-versions': {
  options: {
    autoSaveVersions: false
  }
}
```

## 📊 Схема MongoDB

### Коллекция: documentVersions

```javascript
{
  _id: ObjectId,
  docId: String,                 // ID документа
  docType: String,               // Тип документа
  versionNumber: Number,         // Номер версии (1, 2, 3, ...)
  snapshot: Object,              // Полный snapshot документа
  comment: String,               // Комментарий к версии
  name: String,                  // Именованная версия (optional)
  type: String,                  // Тип: auto, manual, milestone, release, backup, restore
  createdAt: Date,               // Дата создания
  createdBy: String,             // User ID
  size: Number                   // Размер snapshot в bytes
}
```

### Индексы

```javascript
// Поиск версий документа
{ docId: 1, versionNumber: -1 }

// Timeline
{ docId: 1, createdAt: -1 }

// Именованные версии
{ docId: 1, name: 1 }

// По пользователю
{ createdBy: 1 }

// TTL для автоочистки
{ createdAt: 1 } with expireAfterSeconds
```

## 🎯 Типы версий

| Тип | Описание | Когда создается |
|-----|----------|-----------------|
| `auto` | Автоматическая | При каждом сохранении (если включено) |
| `manual` | Ручная | Пользователь создал вручную |
| `milestone` | Milestone | Важная веха проекта |
| `release` | Release | Релиз версии |
| `backup` | Backup | Перед восстановлением другой версии |
| `restore` | Restore | После восстановления из версии |

## 🔍 Diff форматы

### JSON Diff (RFC 6902)

```json
[
  { "op": "replace", "path": "/title", "value": "New Title" },
  { "op": "add", "path": "/tags/-", "value": "newtag" },
  { "op": "remove", "path": "/oldField" }
]
```

**Operations:**
- `add` - добавление поля/элемента
- `remove` - удаление
- `replace` - замена значения
- `move` - перемещение
- `copy` - копирование

### Text Diff

```json
[
  { "value": "same text " },
  { "value": "removed", "removed": true },
  { "value": "added", "added": true },
  { "value": " more text" }
]
```

## 🚀 Best Practices

### 1. Именованные версии для важных изменений

```javascript
// Создавайте milestone версии перед большими изменениями
await self.apos.documentVersions.createVersion(doc, {
  userId: req.user._id,
  comment: 'Before major refactoring',
  name: 'pre-refactor',
  type: 'milestone'
});
```

### 2. Regular cleanup

```javascript
// Настройте автоочистку или делайте вручную
'document-versions': {
  options: {
    maxVersions: 50,        // Храним только 50 последних
    autoCleanupDays: 90     // Удаляем старше 90 дней
  }
}
```

### 3. Backup перед восстановлением

```javascript
// Всегда создавайте backup
await self.apos.documentVersions.restoreVersion(
  versionId,
  userId,
  true  // ← createBackup
);
```

### 4. Версионирование только нужных типов

```javascript
// Не версионируйте всё подряд
'document-versions': {
  options: {
    enabledTypes: ['article', 'page']  // Только важные типы
  }
}
```

## 📈 Производительность

### Оптимизации

1. **Индексы MongoDB** - быстрый поиск версий
2. **In-memory кэш** - для частых запросов
3. **Ограничение maxVersions** - контроль размера БД
4. **TTL индекс** - автоматическая очистка
5. **Compressed snapshots** (будущее) - экономия места

### Мониторинг

```javascript
// Проверка размера
const stats = await self.apos.documentVersions.getVersionStats(docId);
console.log(`Total size: ${stats.totalSize} bytes`);

// Количество версий
db.documentVersions.countDocuments({ docId: 'doc123' });
```

## 🐛 Troubleshooting

### Слишком много версий

**Проблема:** MongoDB растет слишком быстро

**Решение:**
```javascript
// Уменьшите maxVersions
'document-versions': {
  options: {
    maxVersions: 20,  // Меньше версий
    autoCleanupDays: 30  // Более агрессивная очистка
  }
}
```

### Версии не создаются автоматически

**Проблема:** autoSaveVersions не работает

**Решение:**
1. Проверьте что тип включен в `enabledTypes`
2. Проверьте что `autoSaveVersions: true`
3. Проверьте логи на ошибки

### Медленное восстановление

**Проблема:** restore занимает много времени

**Решение:**
- Используйте более мощный сервер MongoDB
- Оптимизируйте размер документов
- Рассмотрите incremental restores (будущее)

## 📝 TODO

- [ ] UI интерфейс для админ-панели
- [ ] Visual diff для текста
- [ ] Incremental versions (дельта вместо полного snapshot)
- [ ] Compression для старых версий
- [ ] Export/Import версий
- [ ] Version branches
- [ ] Merge versions
- [ ] Conflict resolution

## 🤝 Совместимость

- **Apostrophe CMS**: 4.x
- **Node.js**: 18+
- **MongoDB**: 4.4+
- **diff**: 5.x
- **fast-json-patch**: 3.x

## 📄 Лицензия

MIT

---

**Статус**: ✅ READY - Production-ready
**Приоритет**: 🟠 СРЕДНИЙ
**Phase**: 3/5 (Content Management)

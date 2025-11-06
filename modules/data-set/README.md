# Data Set Module - Documentation

Модуль для импорта CSV данных и их динамического отображения в виде таблиц, графиков и карт.

## 📋 Содержание

- [Обзор](#обзор)
- [Возможности](#возможности)
- [Установка](#установка)
- [API Endpoints](#api-endpoints)
- [Widget](#widget)
- [Примеры использования](#примеры-использования)
- [MongoDB Схема](#mongodb-схема)

---

## Обзор

Data Set модуль позволяет:
- Импортировать CSV файлы с автоматическим определением типов данных
- Хранить данные в MongoDB с полной поддержкой CRUD операций
- Версионировать datasets для отслеживания изменений
- Визуализировать данные в виде таблиц, графиков (bar, line, pie) и карт
- Экспортировать данные обратно в CSV

---

## Возможности

### ✅ Импорт данных
- Upload CSV файлов (до 10MB по умолчанию)
- Автоматическое определение типов: string, integer, number, boolean, date, latitude, longitude
- Mapping полей CSV к схеме
- Validation импортированных данных
- Batch import для производительности (1000 записей за раз)

### ✅ Хранение данных
- Dynamic MongoDB collections
- CRUD операции на datasets и records
- Версионирование datasets (до 10 версий по умолчанию)
- TTL-based cleanup старых версий (90 дней)
- In-memory кэширование для быстрого доступа

### ✅ Визуализация
- **Table widget** с поиском, фильтрацией и пагинацией
- **Chart widget** с поддержкой Bar, Line, Pie графиков (Chart.js)
- **Map widget** для геоданных (Leaflet)
- Responsive design для всех типов визуализации

### ✅ API
- REST API для доступа к datasets
- Query параметры для фильтрации
- Pagination для больших datasets
- Export в CSV формате

---

## Установка

### 1. Зависимости

Модуль требует следующие npm пакеты:

```bash
npm install papaparse csv-writer
```

### 2. Регистрация модуля

Добавьте модули в `app.js`:

```javascript
modules: {
  'data-set': {},
  'data-set-widget': {}
}
```

### 3. MongoDB

Модуль автоматически создаст следующие коллекции:
- `dataSets` - metadata о datasets
- `dataRecords` - actual data records
- `dataSchemas` - схемы данных
- `datasetVersions` - версии datasets

---

## API Endpoints

### POST `/api/data-set/import`

Импорт CSV файла.

**Request Body:**
```json
{
  "csvContent": "name,age,city\nJohn,30,NYC\nJane,25,LA",
  "name": "Users Dataset",
  "description": "List of users",
  "category": "general"
}
```

**Response:**
```json
{
  "success": true,
  "datasetId": "507f1f77bcf86cd799439011",
  "rowsImported": 2,
  "schema": {
    "name": { "type": "string", "nullable": false, "label": "Name" },
    "age": { "type": "integer", "nullable": false, "label": "Age" },
    "city": { "type": "string", "nullable": false, "label": "City" }
  }
}
```

---

### GET `/api/data-set/list`

Получить список всех datasets.

**Query Parameters:**
- `page` - номер страницы (default: 1)
- `limit` - записей на страницу (default: 20)
- `category` - фильтр по категории

**Response:**
```json
{
  "datasets": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Users Dataset",
      "description": "List of users",
      "category": "general",
      "rowCount": 2,
      "columnCount": 3,
      "isPublic": true,
      "createdAt": "2025-11-06T10:00:00.000Z",
      "updatedAt": "2025-11-06T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalRecords": 1,
    "totalPages": 1
  }
}
```

---

### GET `/api/data-set/:id`

Получить dataset по ID.

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Users Dataset",
  "description": "List of users",
  "category": "general",
  "rowCount": 2,
  "columnCount": 3,
  "schema": { ... },
  "isPublic": true,
  "createdAt": "2025-11-06T10:00:00.000Z"
}
```

---

### GET `/api/data-set/:id/records`

Получить records из dataset.

**Query Parameters:**
- `page` - номер страницы (default: 1)
- `limit` - записей на страницу (default: 50)
- `sort` - сортировка JSON (default: `{"rowNumber":1}`)
- `filter` - фильтр JSON

**Response:**
```json
{
  "records": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "datasetId": "507f1f77bcf86cd799439011",
      "rowNumber": 1,
      "data": {
        "name": "John",
        "age": 30,
        "city": "NYC"
      },
      "createdAt": "2025-11-06T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "totalRecords": 2,
    "totalPages": 1
  }
}
```

---

### GET `/api/data-set/:id/export`

Экспорт dataset в CSV.

**Response:**
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename="dataset_name_timestamp.csv"`

---

### GET `/api/data-set/:id/stats`

Получить статистику по dataset.

**Response:**
```json
{
  "rowCount": 2,
  "columnCount": 3,
  "createdAt": "2025-11-06T10:00:00.000Z",
  "updatedAt": "2025-11-06T10:00:00.000Z",
  "schema": { ... },
  "versions": 1,
  "columnStats": {
    "age": {
      "min": 25,
      "max": 30,
      "avg": 27.5,
      "count": 2
    }
  }
}
```

---

### DELETE `/api/data-set/:id`

Удалить dataset и все его records.

**Response:**
```json
{
  "success": true
}
```

---

## Widget

### Data Set Widget

Widget для отображения datasets на страницах.

#### Опции widget:

| Поле | Тип | Описание |
|------|-----|----------|
| `datasetId` | String | ID dataset для отображения |
| `visualizationType` | Select | Тип визуализации: table, bar, line, pie, map |
| `maxRows` | Integer | Максимум строк для отображения (1-500) |
| `showFilters` | Boolean | Показывать фильтры (только для table) |
| `showSearch` | Boolean | Показывать поиск (только для table) |
| `showPagination` | Boolean | Показывать пагинацию |
| `chartXAxis` | String | Поле для X оси (для bar, line) |
| `chartYAxis` | String | Поле для Y оси (для bar, line, pie) |
| `chartTitle` | String | Заголовок графика |
| `mapLatField` | String | Поле с latitude (для map) |
| `mapLonField` | String | Поле с longitude (для map) |
| `mapLabelField` | String | Поле для подписей маркеров |

#### Типы визуализации:

**1. Table**
- Полная таблица с данными
- Поиск по всем полям
- Pagination
- Responsive

**2. Bar Chart**
- Столбчатая диаграмма
- Chart.js
- Настраиваемые оси X и Y

**3. Line Chart**
- Линейный график
- Chart.js
- Smooth curves

**4. Pie Chart**
- Круговая диаграмма
- Chart.js
- Автоматическая генерация цветов

**5. Map**
- Интерактивная карта
- Leaflet + OpenStreetMap
- Markers с popup labels
- Auto-zoom к маркерам

---

## Примеры использования

### Пример 1: Импорт CSV через API

```javascript
// Frontend или Node.js
const csvContent = `name,age,salary,city
John Doe,30,75000,New York
Jane Smith,25,65000,Los Angeles
Bob Johnson,35,85000,Chicago`;

const response = await fetch('/api/data-set/import', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    csvContent: csvContent,
    name: 'Employees Dataset',
    description: 'Company employees data',
    category: 'financial'
  })
});

const result = await response.json();
console.log('Dataset ID:', result.datasetId);
console.log('Rows imported:', result.rowsImported);
```

---

### Пример 2: Программный импорт

```javascript
// В коде Apostrophe модуля
const dataSet = self.apos.modules['data-set'];

const result = await dataSet.importCSV(csvContent, {
  datasetName: 'Sales Data',
  description: 'Q1 2025 Sales',
  category: 'financial',
  userId: req.user._id
});

console.log('Dataset created:', result.datasetId);
```

---

### Пример 3: Получение и фильтрация данных

```javascript
// Получить records с фильтрацией
const response = await fetch('/api/data-set/507f1f77bcf86cd799439011/records?page=1&limit=10&filter=' +
  encodeURIComponent(JSON.stringify({ city: 'New York' }))
);

const data = await response.json();
console.log('Filtered records:', data.records);
```

---

### Пример 4: Статистика

```javascript
const stats = await fetch('/api/data-set/507f1f77bcf86cd799439011/stats');
const data = await stats.json();

console.log('Min age:', data.columnStats.age.min);
console.log('Max age:', data.columnStats.age.max);
console.log('Average age:', data.columnStats.age.avg);
```

---

## MongoDB Схема

### Collection: `dataSets`

```javascript
{
  _id: ObjectId,
  name: String,                // Название dataset
  description: String,         // Описание
  category: String,            // Категория (general, financial, geographic, etc.)
  tags: [String],              // Теги
  rowCount: Number,            // Количество строк
  columnCount: Number,         // Количество колонок
  schema: Object,              // Схема данных
  isPublic: Boolean,           // Публичный dataset
  createdAt: Date,
  createdBy: String,           // User ID
  updatedAt: Date
}
```

**Indexes:**
- `name`: 1
- `category`: 1
- `createdBy`: 1
- `createdAt`: -1

---

### Collection: `dataRecords`

```javascript
{
  _id: ObjectId,
  datasetId: String,           // ID dataset
  rowNumber: Number,           // Номер строки
  data: Object,                // Actual data
  createdAt: Date,
  updatedAt: Date              // (optional)
}
```

**Indexes:**
- `datasetId`: 1
- `datasetId, createdAt`: -1

---

### Collection: `dataSchemas`

```javascript
{
  _id: ObjectId,
  datasetId: String,           // ID dataset
  schema: Object,              // Схема {field: {type, nullable, label}}
  createdAt: Date
}
```

**Indexes:**
- `datasetId`: 1

---

### Collection: `datasetVersions`

```javascript
{
  _id: ObjectId,
  datasetId: String,           // ID dataset
  versionNumber: Number,       // Номер версии
  rowCount: Number,            // Количество строк в этой версии
  comment: String,             // Комментарий к версии
  createdAt: Date,             // TTL index: 90 дней
  createdBy: String            // User ID
}
```

**Indexes:**
- `datasetId, versionNumber`: -1
- `createdAt`: 1 (TTL: 90 дней)

---

## Настройки модуля

В `app.js` можно настроить опции:

```javascript
modules: {
  'data-set': {
    options: {
      maxFileSize: 10 * 1024 * 1024,  // 10MB (default)
      autoDetectTypes: true,           // Автоопределение типов
      enableVersioning: true,          // Версионирование
      maxVersions: 10                  // Максимум версий
    }
  }
}
```

---

## Типы данных

Модуль автоматически определяет следующие типы:

| Тип | Описание | Пример |
|-----|----------|--------|
| `string` | Текст | "John Doe" |
| `integer` | Целое число | 25 |
| `number` | Число с плавающей точкой | 25.5 |
| `boolean` | Булево значение | true, false |
| `date` | Дата | "2025-11-06" |
| `latitude` | Широта | 40.7128 |
| `longitude` | Долгота | -74.0060 |

---

## Ограничения

- Максимальный размер CSV файла: 10MB (настраиваемо)
- Максимальное количество версий: 10 (старые автоматически удаляются)
- TTL для версий: 90 дней
- Batch import: 1000 записей за раз

---

## Производительность

### Оптимизации:
- ✅ Batch insert (1000 записей за операцию)
- ✅ In-memory кэширование datasets
- ✅ MongoDB индексы на всех коллекциях
- ✅ TTL indexes для автоочистки
- ✅ Pagination для больших datasets

### Рекомендации:
- Для datasets > 10,000 записей используйте pagination
- Для частых запросов используйте кэширование
- Для геоданных создайте geospatial индексы

---

## Безопасность

- ✅ Authentication required для импорта и удаления
- ✅ Authorization checks (owner или admin)
- ✅ Public/private datasets
- ✅ Input validation
- ✅ SQL injection protection (MongoDB)

---

## Troubleshooting

### CSV не импортируется

**Проблема:** Ошибка при импорте CSV

**Решение:**
- Проверьте формат CSV (правильные headers, delimiter)
- Убедитесь, что файл < 10MB
- Проверьте encoding (должен быть UTF-8)

### Графики не отображаются

**Проблема:** Canvas пустой

**Решение:**
- Убедитесь, что Chart.js загружен
- Проверьте, что указаны правильные поля для осей X и Y
- Проверьте консоль браузера на ошибки

### Карта не загружается

**Проблема:** Map container пустой

**Решение:**
- Убедитесь, что Leaflet загружен
- Проверьте, что latitude/longitude поля содержат валидные координаты
- Проверьте интернет соединение (для tile layer)

---

## Лицензия

MIT

---

**Версия:** 1.0.0
**Дата:** 2025-11-06
**Автор:** Claude (Anthropic)

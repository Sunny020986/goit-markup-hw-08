# 🏠 Backend - Розумний Будинок

## Як запустити?

### 1️⃣ Встановити залежності
```bash
cd backend
npm install
```

### 2️⃣ Запустити сервер
```bash
npm start
```

Сервер запуститься на `http://localhost:3000`

---

## 📡 API Endpoints (Маршрути)

### 1. Отримати всі пристрої
```
GET http://localhost:3000/api/devices
```
**Повертає:** Список всіх пристроїв

### 2. Отримати один пристрій
```
GET http://localhost:3000/api/devices/1
```
**Повертає:** Інформацію про пристрій з ID 1

### 3. Оновити пристрій
```
PUT http://localhost:3000/api/devices/1
```
**Тіло запиту:**
```json
{
  "status": "вкл",
  "brightness": 85
}
```

### 4. Отримати метрики
```
GET http://localhost:3000/api/metrics
```
**Повертає:** Енергія, вода, CO2 рівні

### 5. Отримати історію пристрою (для графіків)
```
GET http://localhost:3000/api/devices/1/history
```
**Повертає:** Історію змін пристрою

### 6. Стан сервера (RAM, CPU, час роботи)
```
GET http://localhost:3000/api/status
```
**Повертає:** використання оперативної пам'яті, пам'ять процесу Node.js, навантаження CPU, uptime

### 7. Журнал стану сервера
```
GET  http://localhost:3000/api/status/history   # історія (останні 24 год)
POST http://localhost:3000/api/status/save      # зберегти стан зараз
```
Сервер сам записує стан у `status-log.json` при запуску і далі кожні 5 хвилин.

### 8. Пам'ять: збережені стани пристроїв (знімки)
```
GET    http://localhost:3000/api/memory              # список знімків
POST   http://localhost:3000/api/memory              # зберегти поточний стан
GET    http://localhost:3000/api/memory/:id          # один знімок
POST   http://localhost:3000/api/memory/:id/restore  # відновити стан пристроїв
DELETE http://localhost:3000/api/memory/:id          # видалити знімок
```
**Тіло для збереження (необов'язково):**
```json
{ "name": "Вечір" }
```
Знімки зберігаються у `memory.json` (до 50 штук).

---

## 📋 Типи Пристроїв

- `light` - Світло (статус, яскравість)
- `heating` - Опалення (статус, температура)
- `security` - Безпека (статус, датчики)
- `ac` - Кондиціонер (статус, температура)

---

## 🗂️ Структура

```
backend/
├── server.js         # Основний файл сервера
├── devices.json      # База даних з пристроями
├── memory.json       # Збережені стани (створюється автоматично)
├── status-log.json   # Журнал стану сервера (створюється автоматично)
├── package.json      # Конфігурація Node.js
└── README.md         # Цей файл
```

---

## ⚡ Як це працює?

1. **Frontend** надсилає запит на API
2. **Backend** отримує запит та обробляє його
3. **Base Data (devices.json)** зберігає інформацію про пристрої
4. **Backend** повертає відповідь фронтенду
5. **Frontend** виводить дані на сторінку

```
Frontend (HTML/JS) <---> Backend (Node.js) <---> Database (devices.json)
```

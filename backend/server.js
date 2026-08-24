// ===================================
// BACKEND ДЛЯ РОЗУМНОГО БУДИНКУ
// ===================================

// Підключаємо бібліотеки
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// Створюємо Express додаток
const app = express();
const PORT = 3000; // Порт на якому буде працювати сервер

// Налаштування middleware (це проміжна ПО, що обробляє запити)
app.use(cors()); // Дозволяємо запити з фронтенду
app.use(bodyParser.json()); // Обробляємо JSON запити

// ===================================
// БАЗА ДАНИХ (в JSON файлі)
// ===================================

// Шлях до файлу з даними пристроїв
const dataFile = path.join(__dirname, 'devices.json');

// Функція для читання даних з файлу
function readDevices() {
  try {
    const data = fs.readFileSync(dataFile, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    // Якщо файлу немає, повертаємо пусту БД
    console.log('Файл devices.json не знайдено. Створюємо нову БД...');
    return initializeDatabase();
  }
}

// Функція для запису даних в файл
function writeDevices(devices) {
  fs.writeFileSync(dataFile, JSON.stringify(devices, null, 2), 'utf8');
}

// Функція для ініціалізації БД (створюємо вихідні пристрої)
function initializeDatabase() {
  const defaultDevices = {
    devices: [
      {
        id: 1,
        name: 'Світло (Гостинна)',
        type: 'light',
        status: 'вкл',
        brightness: 75,
        history: [
          { time: '10:00', status: 'вкл', value: 75 },
          { time: '10:15', status: 'вкл', value: 80 },
          { time: '10:30', status: 'вкл', value: 75 }
        ]
      },
      {
        id: 2,
        name: 'Опалення',
        type: 'heating',
        status: 'вкл',
        temperature: 22,
        targetTemp: 22,
        history: [
          { time: '10:00', temp: 20 },
          { time: '10:15', temp: 21 },
          { time: '10:30', temp: 22 }
        ]
      },
      {
        id: 3,
        name: 'Безпека (Двері)',
        type: 'security',
        status: 'активна',
        sensors: { door: 'закрито', window: 'закрито' },
        history: []
      },
      {
        id: 4,
        name: 'Кондиціонер',
        type: 'ac',
        status: 'вимк',
        temperature: 24,
        history: [
          { time: '09:00', status: 'вимк' },
          { time: '10:00', status: 'вимк' }
        ]
      }
    ],
    metrics: {
      energyUsage: 42, // у відсотках
      waterUsage: 35,
      co2Level: 28
    }
  };

  writeDevices(defaultDevices);
  return defaultDevices;
}

// ===================================
// API МАРШРУТИ (ENDPOINTS)
// ===================================

// 1️⃣ ОТРИМАТИ ВСІ ПРИСТРОЇ
// GET http://localhost:3000/api/devices
app.get('/api/devices', (req, res) => {
  const data = readDevices();
  res.json(data.devices);
});

// 2️⃣ ОТРИМАТИ ОДИН ПРИСТРІЙ ПО ID
// GET http://localhost:3000/api/devices/1
app.get('/api/devices/:id', (req, res) => {
  const data = readDevices();
  const device = data.devices.find(d => d.id === parseInt(req.params.id));

  if (!device) {
    return res.status(404).json({ error: 'Пристрій не знайдено' });
  }

  res.json(device);
});

// 3️⃣ ОНОВИТИ СТАТУС ПРИСТРОЮ
// PUT http://localhost:3000/api/devices/1
// Тіло запиту: { "status": "вкл", "brightness": 85 }
app.put('/api/devices/:id', (req, res) => {
  const data = readDevices();
  const device = data.devices.find(d => d.id === parseInt(req.params.id));

  if (!device) {
    return res.status(404).json({ error: 'Пристрій не знайдено' });
  }

  // Оновлюємо властивості пристрою
  Object.assign(device, req.body);

  // Додаємо запис в історію
  const time = new Date().toLocaleTimeString('uk-UA');
  if (!device.history) {
    device.history = [];
  }

  // Записуємо зміни в залежності від типу пристрою
  if (device.type === 'light') {
    device.history.push({ time, status: device.status, value: device.brightness });
  } else if (device.type === 'heating') {
    device.history.push({ time, temp: device.temperature });
  } else {
    device.history.push({ time, status: device.status });
  }

  // Залишаємо тільки останні 20 записів (щоб файл не зростав нескінченно)
  if (device.history.length > 20) {
    device.history = device.history.slice(-20);
  }

  writeDevices(data);
  res.json(device);
});

// 4️⃣ ОТРИМАТИ МЕТРИКИ (енергія, вода, CO2)
// GET http://localhost:3000/api/metrics
app.get('/api/metrics', (req, res) => {
  const data = readDevices();
  res.json(data.metrics);
});

// 5️⃣ ОНОВИТИ МЕТРИКИ
// PUT http://localhost:3000/api/metrics
app.put('/api/metrics', (req, res) => {
  const data = readDevices();
  Object.assign(data.metrics, req.body);
  writeDevices(data);
  res.json(data.metrics);
});

// 6️⃣ ОТРИМАТИ ІСТОРІЮ ПРИСТРОЮ (ДЛЯ ГРАФІКІВ)
// GET http://localhost:3000/api/devices/1/history
app.get('/api/devices/:id/history', (req, res) => {
  const data = readDevices();
  const device = data.devices.find(d => d.id === parseInt(req.params.id));

  if (!device) {
    return res.status(404).json({ error: 'Пристрій не знайдено' });
  }

  res.json(device.history || []);
});

// 7️⃣ ЗДОРОВЕННЯ (для перевірки чи сервер працює)
// GET http://localhost:3000/api/health
app.get('/api/health', (req, res) => {
  res.json({ status: 'Сервер працює!' });
});

// ===================================
// ЗАПУСК СЕРВЕРА
// ===================================

app.listen(PORT, () => {
  console.log(`🏠 Сервер розумного будинку запущено на http://localhost:${PORT}`);
  console.log(`📍 API доступна за адресою http://localhost:${PORT}/api`);
});

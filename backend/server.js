// ===================================
// BACKEND ДЛЯ РОЗУМНОГО БУДИНКУ
// ===================================

// ІМПОРТУЄМО (підключаємо) БІБЛІОТЕКИ
const express = require('express'); // Фреймворк для створення веб-сервера
const cors = require('cors'); // Дозволяє запити з іншого домену (фронтенд)
const bodyParser = require('body-parser'); // Парсер для обробки JSON даних з запитів
const fs = require('fs'); // Модуль для роботи з файлами (читати, писати)
const path = require('path'); // Модуль для роботи з шляхами файлів
const os = require('os'); // Модуль для інформації про систему (пам'ять, CPU, uptime)

// СТВОРЮЄМО СЕРВЕР
const app = express(); // Створюємо новий Express додаток (це наш сервер)
const PORT = 3000; // Змінна з номером порту (3000 - це можна змінити)

// НАЛАШТУВАННЯ MIDDLEWARE (ОБРОБНИКИ ЗАПИТІВ)
// Middleware - це функції, що обробляють всі приходящі запити

app.use(cors()); // Дозволяємо CORS - це дозволяє фронтенду надсилати запити з інших доменів
app.use(bodyParser.json()); // Парсимо JSON - перетворюємо JSON текст на об'єкти JavaScript
app.use(express.static(path.join(__dirname, '..'))); // Подаємо статичні файли (HTML, CSS, JS) з кореневої папки

// ===================================
// БАЗА ДАНИХ (ФАЙЛ devices.json)
// ===================================

// ПУТЬ ДО ФАЙЛУ З ДАНИМИ
// __dirname - це спеціальна змінна, що означає папку, де знаходиться цей файл
// path.join - об'єднує шляхи правильно для операційної системи
const dataFile = path.join(__dirname, 'devices.json');

// ФУНКЦІЯ ДЛЯ ЧИТАННЯ ПРИСТРОЇВ З ФАЙЛУ
// function - це ключове слово для створення функції
// readDevices - назва функції (робить те, що з назвою)
function readDevices() {
  // TRY-CATCH - це блок для обробки помилок
  // try - намагаємось виконати код тут
  // catch - якщо буває помилка, виконуємо код тут
  try {
    // fs.readFileSync - синхронно читаємо файл (чекаємо поки прочитається)
    // dataFile - це шлях до файлу
    // 'utf8' - кодування (як інтерпретувати символи)
    const data = fs.readFileSync(dataFile, 'utf8');

    // JSON.parse - перетворюємо текст JSON на об'єкт JavaScript
    // Наприклад: '{"ім"я": "Іван"}' → {імя: "Іван"}
    return JSON.parse(data);
  } catch (err) {
    // Якщо сталася помилка (файлу немає або він бракований)
    // console.log - виводимо повідомлення в консоль (видно при запуску)
    console.log('Файл devices.json не знайдено. Створюємо нову БД...');

    // Повертаємо результат функції initializeDatabase (створюємо нову БД)
    return initializeDatabase();
  }
}

// ФУНКЦІЯ ДЛЯ ЗАПИСУ ПРИСТРОЇВ У ФАЙЛ
// devices - це параметр (об'єкт JavaScript, який хочемо зберегти)
function writeDevices(devices) {
  // fs.writeFileSync - СИНХРОННО пишемо в файл (чекаємо поки напишеться)
  // dataFile - шлях до файлу (devices.json)
  // JSON.stringify - перетворюємо об'єкт на текст JSON
  //   devices - об'єкт для перетворення
  //   null - не фільтруємо властивості (записуємо все)
  //   2 - інтервал в 2 пробіли (робить JSON красивим для читання)
  // 'utf8' - кодування (як кодуватимуться символи у файлі)
  writeJsonAtomic(dataFile, devices);
}

// БЕЗПЕЧНИЙ (АТОМАРНИЙ) ЗАПИС JSON У ФАЙЛ
// Спочатку пишемо в тимчасовий файл, потім перейменовуємо його.
// Якщо сервер "впаде" посеред запису, старий файл залишиться цілим.
function writeJsonAtomic(file, obj) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}

// ЧИТАННЯ JSON З ФАЙЛУ (якщо файлу немає або він пошкоджений, повертаємо fallback)
function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    return fallback;
  }
}

// ФУНКЦІЯ ДЛЯ ІНІЦІАЛІЗАЦІЇ БД (СТВОРЮЄ ВИХІДНІ ДАНІ)
// Ця функція виконується, коли файлу devices.json немає
function initializeDatabase() {
  // СТВОРЮЄМО ВИХІДНИЙ ОБ'ЕКТ З ДАНИМИ
  const defaultDevices = {
    // МАСИВ ПРИСТРОЇВ (список всіх приладів в домі)
    devices: [
      {
        // ПРИСТРІЙ 1 - СВІТЛО В ГОСТИННІЙ
        id: 1, // Унікальний номер пристрою (використовується для пошуку)
        name: 'Світло (Гостинна)', // Красива назва для користувача
        type: 'light', // Тип: 'light' (світло), 'heating' (опалення), тощо
        status: 'вкл', // 'вкл' = включено, 'вимк' = вимкнено
        brightness: 75, // Яскравість від 0 до 100%
        // ІСТОРІЯ - ЗАПИСИ ПРО ЗМІНЕННЯ ЯСКРАВОСТІ
        history: [
          // Кожен запис: час, статус, значення яскравості
          { time: '10:00', status: 'вкл', value: 75 },
          { time: '10:15', status: 'вкл', value: 80 },
          { time: '10:30', status: 'вкл', value: 75 }
        ]
      },
      {
        // ПРИСТРІЙ 2 - СИСТЕМА ОПАЛЕННЯ
        id: 2,
        name: 'Опалення',
        type: 'heating', // Тип - система опалення
        status: 'вкл', // Опалення включено
        temperature: 22, // Поточна температура в кімнаті (°C)
        targetTemp: 22, // Бажана температура (на яку налаштовуємо)
        // ІСТОРІЯ - ЗАПИСИ ПРО ЗМІНЕННЯ ТЕМПЕРАТУРИ
        history: [
          { time: '10:00', temp: 20 }, // В 10:00 було 20 градусів
          { time: '10:15', temp: 21 }, // В 10:15 стало 21 градус
          { time: '10:30', temp: 22 } // В 10:30 досягла 22 градуса
        ]
      },
      {
        // ПРИСТРІЙ 3 - СИСТЕМА БЕЗПЕКИ (ДАТЧИКИ)
        id: 3,
        name: 'Безпека (Двері)',
        type: 'security', // Тип - система безпеки
        status: 'активна', // 'активна' = датчики працюють, 'неактивна' = вимкнено
        // ДАТЧИКИ - ОБ'ЕКТ ІЗ СТАНОМ ДАТЧИКІВ
        sensors: {
          door: 'закрито', // Стан двері: 'закрито' або 'відкрито'
          window: 'закрито' // Стан вікна: 'закрито' або 'відкрито'
        },
        history: [] // Порожня історія (немає записів про зміни)
      },
      {
        // ПРИСТРІЙ 4 - КОНДИЦІОНЕР
        id: 4,
        name: 'Кондиціонер',
        type: 'ac', // 'ac' = air conditioner (кондиціонер)
        status: 'вимк', // Вимкнено
        temperature: 24, // Встановлена температура
        history: [
          { time: '09:00', status: 'вимк' }, // Був вимкнено
          { time: '10:00', status: 'вимк' } // Залишається вимкнено
        ]
      }
    ],
    // МЕТРИКИ - ЗАГАЛЬНІ ПОКАЗНИКИ ДОМУ (не про конкретний пристрій)
    metrics: {
      energyUsage: 42, // Споживання енергії 42% від максимуму
      waterUsage: 35, // Споживання води 35%
      co2Level: 28 // Рівень CO2 у повітрі 28%
    }
  };

  // ЗБЕРІГАЄМО ДАНІ У ФАЙЛ
  // Викликаємо функцію writeDevices, щоб записати вихідні дані в devices.json
  writeDevices(defaultDevices);

  // ПОВЕРТАЄМО ДАНІ
  // return - повернути значення з функції
  // Коли запускаємо initializeDatabase(), отримуємо об'єкт defaultDevices
  return defaultDevices;
}

// ===================================
// API МАРШРУТИ (ENDPOINTS)
// ===================================

// ╔════════════════════════════════════════════════════════════╗
// ║ МАРШРУТ 1️⃣ - ОТРИМАТИ ВСІ ПРИСТРОЇ                          ║
// ║ Тип запиту: GET                                             ║
// ║ Адреса: http://localhost:3000/api/devices                  ║
// ╚════════════════════════════════════════════════════════════╝

// app.get - визначаємо маршрут для GET запиту
// '/api/devices' - адреса, до якої фронтенд надсилає запит
// (req, res) => { ... } - функція, що обробляє запит
//   req (request) - об'єкт з інформацією про запит від клієнта
//   res (response) - об'єкт для відправки відповіді клієнту
app.get('/api/devices', (req, res) => {
  // Читаємо дані з файлу devices.json
  // readDevices() повертає весь об'єкт { devices: [...], metrics: {...} }
  const data = readDevices();

  // res.json() - надсилаємо відповідь у форматі JSON
  // data.devices - беремо тільки масив пристроїв (без метрик)
  // Фронтенд отримує масив всіх пристроїв
  res.json(data.devices);
});

// ╔════════════════════════════════════════════════════════════╗
// ║ МАРШРУТ 2️⃣ - ОТРИМАТИ ОДИН ПРИСТРІЙ ПО ID                  ║
// ║ Тип запиту: GET                                             ║
// ║ Адреса: http://localhost:3000/api/devices/1                ║
// ║ (число 1 - це ID пристрою)                                 ║
// ╚════════════════════════════════════════════════════════════╝

// ':id' - це параметр адреси (динамічна частина URL)
// Якщо фронтенд запитує /api/devices/5, то req.params.id = '5'
app.get('/api/devices/:id', (req, res) => {
  // Читаємо всі дані
  const data = readDevices();

  // ПОШУК ПРИСТРОЮ
  // data.devices.find() - шукаємо в масиві пристроїв
  // d => d.id === parseInt(req.params.id) - умова пошуку:
  //   d - поточний пристрій у масиві
  //   d.id - ID пристрою
  //   parseInt(req.params.id) - перетворюємо текст '5' на число 5
  //   === - перевіряємо рівність
  const device = data.devices.find(d => d.id === parseInt(req.params.id));

  // ПЕРЕВІРКА: ЧИ ЗНАЙДЕНО ПРИСТРІЙ?
  // if (!device) - якщо пристрій не знайдено
  if (!device) {
    // res.status(404) - надсилаємо статус 404 (не знайдено)
    // res.json() - відповідь у форматі JSON
    return res.status(404).json({ error: 'Пристрій не знайдено' });
  }

  // УСПІШНА ВІДПОВІДЬ
  // Надсилаємо дані знайденого пристрою
  res.json(device);
});

// ╔════════════════════════════════════════════════════════════╗
// ║ МАРШРУТ 3️⃣ - ОНОВИТИ ПРИСТРІЙ (змінити його стан)          ║
// ║ Тип запиту: PUT                                             ║
// ║ Адреса: http://localhost:3000/api/devices/1                ║
// ║ Тіло запиту: { "status": "вкл", "brightness": 85 }        ║
// ║ Фронтенд надсилає нові дані у тілі запиту                  ║
// ╚════════════════════════════════════════════════════════════╝

// PUT - це HTTP метод для оновлення даних (на відміну від GET - отримання)
app.put('/api/devices/:id', async (req, res) => {
  // Читаємо поточні дані з файлу
  const data = readDevices();

  // Знаходимо пристрій, який потрібно оновити
  const device = data.devices.find(d => d.id === parseInt(req.params.id));

  // Перевіряємо, чи існує пристрій
  if (!device) {
    return res.status(404).json({ error: 'Пристрій не знайдено' });
  }

  // ╔════════════════════════════════════════════════════════════╗
  // ║ ОНОВЛЮЄМО ВЛАСТИВОСТІ ПРИСТРОЮ                            ║
  // ╚════════════════════════════════════════════════════════════╝

  // Object.assign() - це функція для злиття об'єктів
  // device - об'єкт, який змінюємо
  // req.body - дані, що прийшли від фронтенду
  // Результат: всі властивості з req.body копіюються в device
  // Наприклад, якщо req.body = {brightness: 85},
  // то device.brightness стане 85
  // Поле control (адреси пристрою) змінюємо лише через окремий маршрут /control
  const changes = { ...req.body };
  delete changes.control;

  // ╔════════════════════════════════════════════════════════════╗
  // ║ НАДСИЛАЄМО GET-ЗАПИТ НА СПРАВЖНІЙ ПРИСТРІЙ                 ║
  // ╚════════════════════════════════════════════════════════════╝
  // Якщо в пристрою вказані адреси (device.control), сервер сам "натисне"
  // кнопку на реальному пристрої. Якщо пристрій не відповів - стан не змінюємо.
  const control = await sendDeviceCommand(device, changes);
  if (control && !control.ok) {
    device.online = false;
    writeDevices(data);
    return res.status(502).json({ error: `Пристрій не відповідає: ${control.error}`, control });
  }
  if (control) device.online = true;

  Object.assign(device, changes);

  // ╔════════════════════════════════════════════════════════════╗
  // ║ ДОДАЄМО ЗАПИС ДО ІСТОРІЇ ЗМІН                             ║
  // ╚════════════════════════════════════════════════════════════╝

  // new Date().toLocaleTimeString('uk-UA') - отримуємо поточний час
  // 'uk-UA' - формат для України
  // Наприклад: '10:45:30'
  const time = new Date().toLocaleTimeString('uk-UA');

  // Перевіряємо, чи існує масив history
  // Якщо нема, створюємо порожній масив
  if (!device.history) {
    device.history = [];
  }

  // ╔════════════════════════════════════════════════════════════╗
  // ║ ЗАПИСУЄМО ЗМІНИ ЗАЛЕЖНО ВІД ТИПУ ПРИСТРОЮ                 ║
  // ╚════════════════════════════════════════════════════════════╝

  // Для різних типів пристроїв записуємо різні дані
  if (device.type === 'light') {
    // Для СВІТЛА: записуємо час, статус та яскравість
    device.history.push({ time, status: device.status, value: device.brightness });
  } else if (device.type === 'heating') {
    // Для ОПАЛЕННЯ: записуємо час та температуру
    device.history.push({ time, temp: device.temperature });
  } else {
    // Для ІНШИХ типів: записуємо час та статус
    device.history.push({ time, status: device.status });
  }

  // ╔════════════════════════════════════════════════════════════╗
  // ║ ОЧИЩЕННЯ ІСТОРІЇ (ЩОБ НЕ ЗРОСТАЛА НЕСКІНЧЕННО)            ║
  // ╚════════════════════════════════════════════════════════════╝

  // Залишаємо тільки останні 20 записів
  // Це запобігає тому, що файл буде занадто великим
  // device.history.length - кількість записів в історії
  // > 20 - якщо більше ніж 20 записів
  if (device.history.length > 20) {
    // .slice(-20) - бере останні 20 записів
    // Наприклад: якщо 25 записів, залишаємо тільки останні 20
    device.history = device.history.slice(-20);
  }

  // ╔════════════════════════════════════════════════════════════╗
  // ║ ЗБЕРІГАЄМО ОНОВЛЕНІ ДАНІ У ФАЙЛ                           ║
  // ╚════════════════════════════════════════════════════════════╝

  // writeDevices(data) - записуємо всі дані назад у devices.json
  writeDevices(data);

  // Додаємо до відповіді результат GET-запиту (щоб фронтенд бачив, що пристрій відповів)
  if (control) {
    return res.json({ ...device, control });
  }

  // res.json(device) - надсилаємо оновлений пристрій до фронтенду
  // Фронтенд побачить нові дані та оновить сторінку
  res.json(device);
});

// ╔════════════════════════════════════════════════════════════╗
// ║ МАРШРУТ 4️⃣ - ОТРИМАТИ МЕТРИКИ                               ║
// ║ Тип запиту: GET                                             ║
// ║ Адреса: http://localhost:3000/api/metrics                  ║
// ║ Повертає: енергія, вода, CO2 рівні                         ║
// ╚════════════════════════════════════════════════════════════╝

// Це маршрут для отримання глобальних метрик дому
app.get('/api/metrics', (req, res) => {
  // Читаємо всі дані з файлу
  const data = readDevices();

  // Надсилаємо тільки метрики (без пристроїв)
  // data.metrics = { energyUsage: 42, waterUsage: 35, co2Level: 28 }
  res.json(data.metrics);
});

// ╔════════════════════════════════════════════════════════════╗
// ║ МАРШРУТ 5️⃣ - ОНОВИТИ МЕТРИКИ                               ║
// ║ Тип запиту: PUT                                             ║
// ║ Адреса: http://localhost:3000/api/metrics                  ║
// ║ Тіло: { "energyUsage": 50 }                                ║
// ╚════════════════════════════════════════════════════════════╝

// Цей маршрут для оновлення глобальних метрик
app.put('/api/metrics', (req, res) => {
  // Читаємо дані
  const data = readDevices();

  // Оновлюємо метрики на основі даних з фронтенду
  // Object.assign() копіює нові значення в data.metrics
  Object.assign(data.metrics, req.body);

  // Зберігаємо оновлені дані у файл
  writeDevices(data);

  // Надсилаємо оновлені метрики до фронтенду
  res.json(data.metrics);
});

// ╔════════════════════════════════════════════════════════════╗
// ║ МАРШРУТ 6️⃣ - ОТРИМАТИ ІСТОРІЮ ПРИСТРОЮ                     ║
// ║ Тип запиту: GET                                             ║
// ║ Адреса: http://localhost:3000/api/devices/1/history       ║
// ║ Повертає: Масив всіх змін пристрою (для графіків)         ║
// ╚════════════════════════════════════════════════════════════╝

// Цей маршрут для отримання історії змін конкретного пристрою
// Потрібен для побудови графіків
app.get('/api/devices/:id/history', (req, res) => {
  // Читаємо всі дані
  const data = readDevices();

  // Знаходимо пристрій за ID
  const device = data.devices.find(d => d.id === parseInt(req.params.id));

  // Перевіряємо, чи існує пристрій
  if (!device) {
    return res.status(404).json({ error: 'Пристрій не знайдено' });
  }

  // Надсилаємо історію пристрою
  // device.history || [] - якщо історія пуста, надсилаємо порожній масив
  // || (або) - якщо device.history не існує, використовуємо []
  res.json(device.history || []);
});

// ╔════════════════════════════════════════════════════════════╗
// ║ МАРШРУТ 7️⃣ - ПЕРЕВІРКА ЧИ СЕРВЕР ПРАЦЮЄ                   ║
// ║ Тип запиту: GET                                             ║
// ║ Адреса: http://localhost:3000/api/health                  ║
// ║ Призначення: Простий тест для перевірки здоров'я сервера  ║
// ╚════════════════════════════════════════════════════════════╝

// Фронтенд може використовувати цей маршрут, щоб перевірити,
// чи працює сервер перед тим як запитувати інші дані
app.get('/api/health', (req, res) => {
  // Надсилаємо просту відповідь, що сервер живий
  res.json({ status: 'Сервер працює!' });
});


// ===================================
// КЕРУВАННЯ РЕАЛЬНИМИ ПРИСТРОЯМИ (GET-ЗАПИТИ)
// ===================================
// У devices.json кожен пристрій може мати поле "control" з адресами:
//
//   "control": {
//     "onUrl":  "http://192.168.1.50/relay/0?turn=on",    ← GET при "Включити"
//     "offUrl": "http://192.168.1.50/relay/0?turn=off",   ← GET при "Вимкнути"
//     "brightnessUrl": "http://192.168.1.50/light/0?brightness={value}", ← яскравість
//     "tempUrl": "http://192.168.1.60/set?temp={value}"   ← бажана температура
//   }
//
// {value} автоматично замінюється на число (яскравість або температуру).
// Порожня адреса "" означає: для цієї дії запит не надсилати.

const DEVICE_TIMEOUT_MS = 5000; // Скільки чекати відповіді від пристрою (5 секунд)

// Статуси, які означають "увімкнути" / "вимкнути"
const ON_STATUSES = ['вкл', 'активна', 'on'];
const OFF_STATUSES = ['вимк', 'неактивна', 'off'];

// Вибираємо, яку адресу викликати, залежно від того, що змінюється
function pickControlUrl(control, changes) {
  if (changes.status !== undefined) {
    if (ON_STATUSES.includes(changes.status)) return control.onUrl;
    if (OFF_STATUSES.includes(changes.status)) return control.offUrl;
  }
  if (changes.brightness !== undefined && control.brightnessUrl) {
    return control.brightnessUrl.replace('{value}', encodeURIComponent(changes.brightness));
  }
  if (changes.targetTemp !== undefined && control.tempUrl) {
    return control.tempUrl.replace('{value}', encodeURIComponent(changes.targetTemp));
  }
  return null;
}

// Надсилаємо GET-запит на пристрій.
// Повертає null, якщо для цієї дії адреси немає (тоді просто змінюємо стан у файлі).
async function sendDeviceCommand(device, changes) {
  if (!device.control) return null;
  const url = pickControlUrl(device.control, changes);
  if (!url) return null;

  const started = Date.now();
  try {
    // fetch() вбудований у Node.js 18+; AbortSignal.timeout - обмеження часу очікування
    const response = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(DEVICE_TIMEOUT_MS) });
    const body = (await response.text()).slice(0, 500); // Відповідь пристрою (обрізаємо, щоб не була величезною)
    const result = { ok: response.ok, url, httpStatus: response.status, ms: Date.now() - started, response: body };
    if (!response.ok) result.error = `HTTP ${response.status}`;
    console.log(`🔌 GET ${url} → ${response.status} (${result.ms} мс)`);
    return result;
  } catch (err) {
    // Перекладаємо технічні помилки на зрозумілу мову
    const code = err.cause && err.cause.code;
    const messages = {
      ECONNREFUSED: 'пристрій відхилив з\'єднання (неправильний порт або пристрій вимкнений)',
      EHOSTUNREACH: 'пристрій недоступний у мережі (перевірте IP-адресу)',
      ENOTFOUND: 'адресу не знайдено (перевірте IP-адресу або назву)',
      ETIMEDOUT: 'час очікування з\'єднання вичерпано'
    };
    const error =
      err.name === 'TimeoutError'
        ? `немає відповіді за ${DEVICE_TIMEOUT_MS / 1000} с`
        : messages[code] || (code ? `${err.message} (${code})` : err.message);
    console.log(`⚠️  GET ${url} → помилка: ${error}`);
    return { ok: false, url, ms: Date.now() - started, error };
  }
}

// Перевіряємо, що адреса - це http(s) посилання (або порожня)
function isValidUrl(value) {
  if (value === '' || value === undefined) return true;
  try {
    const u = new URL(String(value).replace('{value}', '0'));
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

// GET /api/devices/:id/control → подивитися адреси пристрою
app.get('/api/devices/:id/control', (req, res) => {
  const device = readDevices().devices.find(d => d.id === parseInt(req.params.id));
  if (!device) return res.status(404).json({ error: 'Пристрій не знайдено' });
  res.json(device.control || {});
});

// PUT /api/devices/:id/control → задати адреси пристрою
// Тіло: { "onUrl": "http://...", "offUrl": "http://..." }
app.put('/api/devices/:id/control', (req, res) => {
  const data = readDevices();
  const device = data.devices.find(d => d.id === parseInt(req.params.id));
  if (!device) return res.status(404).json({ error: 'Пристрій не знайдено' });

  const allowed = ['onUrl', 'offUrl', 'brightnessUrl', 'tempUrl'];
  const control = { ...(device.control || {}) };
  for (const key of allowed) {
    if (req.body[key] === undefined) continue;
    if (!isValidUrl(req.body[key])) {
      return res.status(400).json({ error: `Неправильна адреса в полі ${key} (потрібно http:// або https://)` });
    }
    control[key] = String(req.body[key]).trim();
  }
  device.control = control;
  writeDevices(data);
  res.json(control);
});

// GET /api/devices/:id/test?action=on → перевірити зв'язок з пристроєм,
// не змінюючи стан у devices.json (action: on, off)
app.get('/api/devices/:id/test', async (req, res) => {
  const device = readDevices().devices.find(d => d.id === parseInt(req.params.id));
  if (!device) return res.status(404).json({ error: 'Пристрій не знайдено' });
  const status = req.query.action === 'off' ? 'вимк' : 'вкл';
  const result = await sendDeviceCommand(device, { status });
  if (!result) return res.status(400).json({ error: 'Для пристрою не задано адресу (control.onUrl / control.offUrl)' });
  res.status(result.ok ? 200 : 502).json(result);
});

// ===================================
// СТАН СЕРВЕРА ТА ПАМ'ЯТЬ (RAM)
// ===================================

// Файл, де зберігається журнал стану сервера (історія використання пам'яті)
const statusFile = path.join(__dirname, 'status-log.json');
const STATUS_LOG_LIMIT = 288; // 288 записів × 5 хв = останні 24 години
const STATUS_INTERVAL_MS = 5 * 60 * 1000; // Записуємо стан кожні 5 хвилин

// Байти → мегабайти (з округленням до 1 знака)
function toMB(bytes) {
  return Math.round((bytes / 1024 / 1024) * 10) / 10;
}

// ЗБИРАЄМО ПОТОЧНИЙ СТАН СЕРВЕРА
function getServerStatus() {
  const total = os.totalmem(); // Вся оперативна пам'ять системи
  const free = os.freemem(); // Вільна пам'ять
  const used = total - free; // Зайнята пам'ять
  const proc = process.memoryUsage(); // Пам'ять, яку займає сам Node.js процес

  return {
    time: new Date().toISOString(), // Час у форматі ISO (2026-11-06T10:00:00.000Z)
    hostname: os.hostname(), // Ім'я машини (наприклад, назва VM на Proxmox)
    platform: `${os.type()} ${os.release()}`,
    uptimeServer: Math.round(os.uptime()), // Скільки секунд працює система
    uptimeProcess: Math.round(process.uptime()), // Скільки секунд працює цей сервер
    cpu: {
      cores: os.cpus().length,
      load1: Math.round(os.loadavg()[0] * 100) / 100 // Середнє навантаження за 1 хв
    },
    memory: {
      totalMB: toMB(total),
      usedMB: toMB(used),
      freeMB: toMB(free),
      usedPercent: Math.round((used / total) * 100)
    },
    processMemory: {
      rssMB: toMB(proc.rss), // Загальна пам'ять процесу
      heapUsedMB: toMB(proc.heapUsed) // Пам'ять, зайнята JavaScript об'єктами
    }
  };
}

// ЗБЕРІГАЄМО ОДИН ЗАПИС СТАНУ В ЖУРНАЛ (status-log.json)
function saveStatusSnapshot() {
  const s = getServerStatus();
  const log = readJson(statusFile, []);
  // У журнал пишемо лише короткі дані, щоб файл був невеликим
  log.push({
    time: s.time,
    memUsedPercent: s.memory.usedPercent,
    memUsedMB: s.memory.usedMB,
    processRssMB: s.processMemory.rssMB,
    load1: s.cpu.load1
  });
  writeJsonAtomic(statusFile, log.slice(-STATUS_LOG_LIMIT));
  return s;
}

// GET /api/status → поточний стан сервера (без запису)
app.get('/api/status', (req, res) => {
  res.json(getServerStatus());
});

// GET /api/status/history → журнал збереженого стану (для графіків)
app.get('/api/status/history', (req, res) => {
  res.json(readJson(statusFile, []));
});

// POST /api/status/save → зберегти стан прямо зараз (вручну)
app.post('/api/status/save', (req, res) => {
  res.status(201).json(saveStatusSnapshot());
});

// ===================================
// ПАМ'ЯТЬ ПРИСТРОЇВ (ЗНІМКИ / СЦЕНИ)
// ===================================
// "Знімок" - це збережений стан усіх пристроїв (статус, яскравість, температура).
// Можна зберегти, наприклад, "Вечір" або "Пішов з дому" і потім відновити одним кліком.

const memoryFile = path.join(__dirname, 'memory.json');
const MEMORY_LIMIT = 50; // Максимум збережених знімків

// Поля, які зберігаємо у знімку (історію не зберігаємо, щоб не дублювати)
const SAVED_FIELDS = ['status', 'brightness', 'temperature', 'targetTemp', 'sensors'];

// Витягуємо зі пристрою лише потрібні поля
function pickState(device) {
  const state = { id: device.id };
  SAVED_FIELDS.forEach(field => {
    if (device[field] !== undefined) state[field] = device[field];
  });
  return state;
}

// GET /api/memory → список усіх знімків
app.get('/api/memory', (req, res) => {
  res.json(readJson(memoryFile, []));
});

// POST /api/memory → зберегти поточний стан пристроїв
// Тіло запиту (необов'язково): { "name": "Вечір" }
app.post('/api/memory', (req, res) => {
  const name = String((req.body && req.body.name) || '').trim().slice(0, 50);
  const data = readDevices();
  const memory = readJson(memoryFile, []);

  const snapshot = {
    id: Date.now(), // Унікальний ID - поточний час у мілісекундах
    name: name || `Знімок ${new Date().toLocaleString('uk-UA')}`,
    createdAt: new Date().toISOString(),
    devices: data.devices.map(pickState),
    metrics: { ...data.metrics }
  };

  memory.push(snapshot);
  writeJsonAtomic(memoryFile, memory.slice(-MEMORY_LIMIT));
  res.status(201).json(snapshot);
});

// GET /api/memory/:id → один знімок
app.get('/api/memory/:id', (req, res) => {
  const snapshot = readJson(memoryFile, []).find(m => m.id === Number(req.params.id));
  if (!snapshot) return res.status(404).json({ error: 'Знімок не знайдено' });
  res.json(snapshot);
});

// POST /api/memory/:id/restore → відновити стан пристроїв зі знімка
app.post('/api/memory/:id/restore', (req, res) => {
  const snapshot = readJson(memoryFile, []).find(m => m.id === Number(req.params.id));
  if (!snapshot) return res.status(404).json({ error: 'Знімок не знайдено' });

  const data = readDevices();
  const time = new Date().toLocaleTimeString('uk-UA');

  snapshot.devices.forEach(saved => {
    const device = data.devices.find(d => d.id === saved.id);
    if (!device) return; // Пристрій могли видалити - пропускаємо
    SAVED_FIELDS.forEach(field => {
      if (saved[field] !== undefined) device[field] = saved[field];
    });
    // Записуємо у історію, що стан відновлено з пам'яті
    device.history = device.history || [];
    device.history.push({ time, status: device.status, restoredFrom: snapshot.name });
    device.history = device.history.slice(-20);
  });

  if (snapshot.metrics) Object.assign(data.metrics, snapshot.metrics);
  writeDevices(data);
  res.json(data.devices);
});

// DELETE /api/memory/:id → видалити знімок
app.delete('/api/memory/:id', (req, res) => {
  const memory = readJson(memoryFile, []);
  const rest = memory.filter(m => m.id !== Number(req.params.id));
  if (rest.length === memory.length) {
    return res.status(404).json({ error: 'Знімок не знайдено' });
  }
  writeJsonAtomic(memoryFile, rest);
  res.json({ deleted: true });
});

// ╔════════════════════════════════════════════════════════════╗
// ║ ЗАПУСК СЕРВЕРА                                              ║
// ║ Це останній крок - сервер починає слухати запити           ║
// ╚════════════════════════════════════════════════════════════╝

// app.listen() - запускаємо Express сервер
// PORT - номер порту (3000)
// () => { ... } - функція, що виконується при успішному запуску
app.listen(PORT, () => {
  // console.log() - виводить повідомлення в консоль
  // `` - шаблонна строка (можемо вставляти змінні через ${})
  // Коли ви запустите сервер, побачите це повідомлення
  console.log(`🏠 Сервер розумного будинку запущено на http://localhost:${PORT}`);
  console.log(`📍 API доступна за адресою http://localhost:${PORT}/api`);

  // Одразу зберігаємо стан сервера і далі - кожні 5 хвилин
  saveStatusSnapshot();
  setInterval(saveStatusSnapshot, STATUS_INTERVAL_MS);

  // Тепер ви можете:
  // 1. Відкрити http://localhost:3000/api/devices в браузері
  // 2. Запустити фронтенд, який з'єднається з цим сервером
  // 3. Отримувати дані про пристрої та управляти ними
});

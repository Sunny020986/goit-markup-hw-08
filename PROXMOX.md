# 🚀 Розгортання Розумного Будинку на Proxmox

Цей документ описує, як розгорнути Node.js backend та фронтенд на віртуальній машині Proxmox.

---

## 📋 Вимоги

- **Proxmox VE** встановлено і налаштовано
- **Ubuntu 20.04+** або **Debian 11+** VM на Proxmox
- **SSH доступ** до VM
- **Node.js 16+** (мы встановимо)
- **npm** (йде разом з Node.js)

---

## 🔧 Крок 1: Встановити Node.js на Proxmox VM

### 1.1 Підключитися до VM через SSH

```bash
ssh user@proxmox-ip-address
```

### 1.2 Оновити систему

```bash
sudo apt update
sudo apt upgrade -y
```

### 1.3 Встановити Node.js (версія 18 LTS рекомендується)

```bash
# Завантажити скрипт встановлення Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Встановити Node.js та npm
sudo apt install -y nodejs
```

### 1.4 Перевірити встановлення

```bash
node --version   # має показати v18.x.x або більше
npm --version    # має показати 8.x.x або більше
```

---

## 📦 Крок 2: Клонувати репозиторій на Proxmox

### 2.1 Перейти в домашню папку

```bash
cd ~
```

### 2.2 Клонувати репозиторій

```bash
git clone https://github.com/sunny020986/goit-markup-hw-08.git
cd goit-markup-hw-08
```

Якщо використовуєте SSH ключі для GitHub:

```bash
git clone git@github.com:sunny020986/goit-markup-hw-08.git
cd goit-markup-hw-08
```

---

## 📥 Крок 3: Встановити залежності Backend

```bash
cd backend
npm install
```

Це встановить:
- **express** - веб-сервер
- **cors** - дозволи для запитів
- **body-parser** - парсер JSON

---

## ▶️ Крок 4: Запустити Backend вручну (тестування)

```bash
npm start
```

Ви повинні побачити:
```
🏠 Сервер розумного будинку запущено на http://localhost:3000
📍 API доступна за адресою http://localhost:3000/api
```

**Тестування:**
- Відкрийте браузер: `http://proxmox-ip:3000`
- Ви повинні побачити дашборд "Розумного Будинку"

**Зупинити сервер:** `Ctrl+C`

---

## 🔄 Крок 5: Налаштування постійного запуску (PM2)

Для того щоб сервер працював постійно і перезапускався після перезавантаження, використовуємо **PM2**.

### 5.1 Встановити PM2 глобально

```bash
sudo npm install -g pm2
```

### 5.2 Запустити backend через PM2

```bash
# З папки backend/
pm2 start server.js --name "smart-home"
```

### 5.3 Налаштувати автозапуск при перезавантаженні

```bash
# Сгенерувати скрипт автозапуску для systemd
pm2 startup systemd -u $USER

# Зберегти поточні процеси PM2
pm2 save
```

### 5.4 Перевірити статус PM2

```bash
# Список всіх процесів
pm2 list

# Переглянути логи
pm2 logs smart-home

# Отримати інформацію про процес
pm2 info smart-home
```

### 5.5 Корисні команди PM2

```bash
# Перезапустити сервер
pm2 restart smart-home

# Зупинити сервер
pm2 stop smart-home

# Видалити з PM2
pm2 delete smart-home

# Перезапустити після оновлення коду
pm2 restart smart-home
```

---

## 🌐 Крок 6: Налаштування мережі на Proxmox

### 6.1 Знайти IP адресу VM

```bash
ip addr show
# або
hostname -I
```

### 6.2 Відкрити порт 3000 на VM (якщо потрібно)

```bash
# Перевірити статус UFW (файервол)
sudo ufw status

# Якщо UFW активний, дозволити порт 3000
sudo ufw allow 3000/tcp
```

### 6.3 Доступ до дашборду

Тепер ви можете отримати доступ до дашборду із будь-якої машини в мережі:

```
http://proxmox-vm-ip:3000
```

---

## 📁 Крок 7: Розуміння структури файлів

```
goit-markup-hw-08/
├── backend/
│   ├── server.js           # 🚀 Node.js Express сервер
│   ├── package.json        # 📦 Залежності проекту
│   ├── devices.json        # 💾 База даних (пристрої)
│   └── README.md           # 📚 API документація
│
├── smart-home.html         # 🌐 Фронтенд дашборд
├── index.html              # 🏠 Головна сторінка
├── portfolio.html          # 🎨 Портфоліо
├── contacts.html           # 📞 Контакти
├── css/                    # 🎨 Стилі
├── js/                     # 📜 JavaScript
├── images/                 # 🖼️ Зображення
│
├── ЗАПУСК.md               # 📖 Інструкції для локального запуску
└── PROXMOX.md              # 📖 Цей файл
```

---

## 📊 Крок 8: Виконання операцій з базою даних

### 8.1 Резервна копія devices.json

```bash
# Створити резервну копію
cp backend/devices.json backend/devices.json.backup

# Дата-час резервної копії
cp backend/devices.json "backend/devices.json.$(date +%Y%m%d_%H%M%S).backup"
```

### 8.2 Скинути дані до початкового стану

```bash
# PM2 зупинить сервер, змінимо файл, перезапустимо
pm2 stop smart-home

# Видалити devices.json, сервер створить новий при запуску
rm backend/devices.json

# Перезапустити
pm2 start server.js --name "smart-home"
```

---

## 🚨 Крок 9: Розв'язання проблем

### Проблема: Сервер не запускається

```bash
# Перевірити логи
pm2 logs smart-home

# Перевірити, чи повний шлях до файлу
pwd  # перевірити поточну папку

# Перевірити, чи всі залежності встановлені
npm list
```

### Проблема: Порт 3000 уже використовується

```bash
# Знайти процес, що використовує порт 3000
sudo lsof -i :3000

# Якщо це старий PM2 процес:
pm2 kill
pm2 start server.js --name "smart-home"

# Або змінити порт у server.js (рядок 14):
# const PORT = 3001;  // замість 3000
```

### Проблема: Помилка дозволів файлів

```bash
# Перевірити дозволи
ls -la backend/devices.json

# Дозволити читання/запис
chmod 644 backend/devices.json
chmod 755 backend/
```

### Проблема: API недоступна

```bash
# Перевірити, чи сервер працює
pm2 list

# Перевірити логи помилок
pm2 logs smart-home --err

# Перевірити мережну конфігурацію
curl http://localhost:3000/api/health
```

---

## 🔐 Крок 10: Безпека (опціонально)

### 10.1 Встановити Nginx як зворотний проксі

```bash
# Встановити Nginx
sudo apt install nginx -y

# Зупинити Apache, якщо працює
sudo systemctl stop apache2 2>/dev/null || true

# Запустити Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 10.2 Налаштувати Nginx конфігурацію

Створити файл `/etc/nginx/sites-available/smart-home`:

```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Активувати конфігурацію:

```bash
sudo ln -s /etc/nginx/sites-available/smart-home /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Тепер доступ без указання порту: `http://proxmox-vm-ip`

---

## 📈 Крок 11: Моніторинг та техническое обслуживание

### 11.1 Переглянути статистику CPU і RAM

```bash
pm2 monit
```

### 11.2 Автоматичне перезавантаження при збої

```bash
# PM2 вже налаштований на автоперезапуск
# Перевірити статус
pm2 info smart-home
```

### 11.3 Регулярне оновлення коду

```bash
# Перейти в папку проекту
cd ~/goit-markup-hw-08

# Отримати останні зміни
git pull origin master

# Перейти в backend
cd backend

# Оновити залежності (якщо потрібно)
npm install

# Перезапустити сервер
pm2 restart smart-home
```

---

## ✅ Перевірка після розгортання

### Сервер працює?

```bash
curl http://localhost:3000/api/health
# Має повернути: {"status":"Сервер працює!"}
```

### Дашборд доступний?

```bash
curl http://localhost:3000/smart-home.html
# або відкрийте браузер: http://proxmox-ip:3000
```

### Пристрої завантажуються?

```bash
curl http://localhost:3000/api/devices
# Має повернути JSON з масивом пристроїв
```

### Метрики доступні?

```bash
curl http://localhost:3000/api/metrics
# Має повернути: {"energyUsage":42,"waterUsage":35,"co2Level":28}
```

---

## 🎯 Крок 12: Готово!

Ваш "Розумний Будинок" тепер розгорнено на Proxmox! 🎉

**Що має працювати:**
- ✅ Дашборд доступний на `http://proxmox-ip:3000`
- ✅ Можливо включати/вимикати пристрої
- ✅ Змінювати яскравість і температуру
- ✅ Переглядати метрики
- ✅ Дані оновлюються кожні 5 секунд
- ✅ Сервер перезапускається після перезавантаження VM

---

## 📞 Часті питання

**P: Як змінити порт з 3000 на інший?**
A: Відредагуйте `backend/server.js` лінія 14: `const PORT = 8080;`

**P: Як дозволити доступ з інших машин?**
A: Сервер вже слухає на всіх IP адресах. Просто переконайтеся, що порт відкритий в файерволі.

**P: Як зберегти дані при перезавантаженні?**
A: Дані автоматично зберігаються в `backend/devices.json`, який персистує на диску VM.

**P: Як оновити фронтенд код?**
A: Просто оновіть файли HTML/CSS/JS і перезавантажте сторінку в браузері.

---

## 📚 Документація

- [Express.js](https://expressjs.com/)
- [PM2](https://pm2.keymetrics.io/)
- [Node.js](https://nodejs.org/)
- [Ubuntu Server](https://ubuntu.com/download/server)
- [Proxmox VE](https://www.proxmox.com/en/proxmox-ve)

---

**Останнє оновлення:** 2026-08-26  
**Версія:** 1.0

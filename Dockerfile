# Образ для сайту + Node.js backend "Розумний будинок"
FROM node:20-alpine

WORKDIR /app

# Спочатку лише залежності — так Docker кешує npm install між збірками
COPY backend/package*.json backend/
RUN cd backend && npm ci --omit=dev

# Потім увесь сайт (HTML, CSS, JS, images) і код сервера
COPY . .

# Папка для даних (devices.json), монтується як volume
RUN mkdir -p /data && cp backend/devices.json /data/devices.json && chown -R node:node /data

ENV NODE_ENV=production \
    PORT=3000 \
    DATA_FILE=/data/devices.json

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "backend/server.js"]

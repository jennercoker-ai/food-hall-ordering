# Event Ordering – production image (Railway, Fly, etc.)
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --production

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server/index.js"]

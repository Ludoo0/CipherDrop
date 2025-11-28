FROM node:18-alpine AS base
WORKDIR /app

FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm install

FROM dependencies AS build
COPY . .
RUN npm run build

FROM base AS production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --only=production

COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
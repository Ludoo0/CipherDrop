# ---- Basisimage ----
FROM node:20-alpine AS builder

# Arbeitsverzeichnis
WORKDIR /app

# Package-Dateien zuerst kopieren (bessere Caching-Effizienz)
COPY package*.json ./

# Dev-Dependencies installieren (inkl. TypeScript)
RUN npm install

# Restlichen Code kopieren
COPY . .

# TypeScript-Code bauen
RUN npx tsc

# ---- Produktions-Image ----
FROM node:20-alpine

WORKDIR /app

# Nur production dependencies installieren
COPY package*.json ./
RUN npm install --production

# Kompilierten Code kopieren
COPY --from=builder /app/dist ./dist

# Falls dein Server auf Port 3000 läuft
EXPOSE 3000

# Startbefehl: kompilierten JS-Code aus dist ausführen
CMD [ "npm", "start" ]

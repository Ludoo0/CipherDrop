# Basisimage
FROM node:20-alpine

# Arbeitsverzeichnis
WORKDIR /app

# Package-Dateien zuerst kopieren (bessere Caching-Effizienz)
COPY package*.json ./

# Dependencies installieren
RUN npm install --production

# Restlichen Code kopieren
COPY . .

# Falls dein Server auf Port 3000 läuft
EXPOSE 3000

# Startbefehl
CMD [ "npm", "start" ]

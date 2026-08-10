# Dockerfile de producción para despliegue automático en Google Cloud Run / Gemini Enterprise Agent Platform
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias de compilación
COPY package*.json ./
RUN npm ci

# Copiar el código fuente completo
COPY . .

# Compilar la aplicación (Vite Frontend + Esbuild Backend server.cjs)
RUN npm run build

# Imagen ejecutable de producción
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Instalar solo dependencias de producción
COPY package*.json ./
RUN npm ci --only=production

# Copiar los artefactos compilados
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.cjs"]

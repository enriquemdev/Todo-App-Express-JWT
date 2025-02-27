# Usar una imagen oficial de Node.js como base
FROM node:18

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar package.json y package-lock.json para instalar dependencias antes de copiar el código
COPY package*.json ./

# Instalar dependencias
RUN npm install --omit=dev

# Copiar el resto del código
COPY . .

# Exponer el puerto de la aplicación
EXPOSE 3000

# Ejecutar la aplicación
CMD ["node", "app.js"]

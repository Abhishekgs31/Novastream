# backend-gateway/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm install

COPY . .

# Expose the port and start the server
EXPOSE 5000
CMD ["node", "server.js"]
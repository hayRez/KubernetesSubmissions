FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY todo-backend.js .
EXPOSE 3001
CMD ["node", "todo-backend.js"]

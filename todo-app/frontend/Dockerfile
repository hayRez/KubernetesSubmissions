FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY todo-frontend.js .
RUN mkdir -p /app/data
EXPOSE 3000
CMD ["node", "todo-frontend.js"]

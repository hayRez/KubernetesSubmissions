# -------- Stage 1: Build --------
FROM node:18-alpine AS builder

WORKDIR /app

# Copy only package files first (better caching)
COPY package*.json ./

# Install dependencies (including dev if needed for build)
RUN npm install --production

# Copy the rest of the app
COPY . .

# -------- Stage 2: Production --------
FROM node:18-alpine AS production

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app /app

# Expose the port
EXPOSE 3000

# Start the app
CMD ["node", "server.js"]

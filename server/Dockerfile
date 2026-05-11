# ── Stage 1: Base image ───────────────────────────────────────
# Use official Node.js 18 on lightweight Alpine Linux
FROM node:18-alpine

# ── Stage 2: Set working directory ───────────────────────────
# All commands after this run inside /app in the container
WORKDIR /app

# ── Stage 3: Copy package files first ────────────────────────
# We copy package.json BEFORE source code so Docker can
# cache the npm install layer (faster rebuilds)
COPY package*.json ./

# ── Stage 4: Install dependencies ────────────────────────────
RUN npm install --only=production

# ── Stage 5: Copy the rest of the source code ────────────────
# This includes server.js, controllers, models, routes,
# and the client/build folder (React static files)
COPY . .

# ── Stage 6: Expose port ──────────────────────────────────────
# Tell Docker this container listens on port 5000
EXPOSE 5000

# ── Stage 7: Start the server ────────────────────────────────
CMD ["node", "server.js"]

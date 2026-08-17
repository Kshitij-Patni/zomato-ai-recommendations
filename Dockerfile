# ── Zomato AI Recommendations — Backend ─────────────────────────────
# Railway auto-detects this Dockerfile and builds from it.
# Only the backend (Express + Node.js) is deployed here.

FROM node:20-slim

WORKDIR /app

# Copy only backend package files first (layer caching)
COPY backend/package.json backend/package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy backend source code
COPY backend/server.js ./server.js
COPY backend/routes/ ./routes/
COPY backend/services/ ./services/
COPY backend/utils/ ./utils/
COPY backend/data/ ./data/

# Railway injects PORT as env var; default to 3000
ENV PORT=3000
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=450"

EXPOSE 3000

CMD ["node", "server.js"]

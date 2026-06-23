# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Dependencies
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Production image
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup -S apexfit && adduser -S apexfit -G apexfit

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN rm -rf __tests__ .env.example .gitignore
RUN mkdir -p logs && chown -R apexfit:apexfit /app

USER apexfit
EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3003/health || exit 1

CMD ["node", "src/server.js"]

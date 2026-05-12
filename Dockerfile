FROM node:20-alpine AS base
WORKDIR /app

# ── Dependências ────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json* yarn.lock* ./

# Usa npm ci para instalação determinística com as versões exatas do lock
RUN npm install --legacy-peer-deps

# ── Build ───────────────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Usa o Prisma local (6.8.2) — evita conflito com versão global
RUN ./node_modules/.bin/prisma generate
RUN npm run build

# ── Runner (imagem final enxuta) ────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

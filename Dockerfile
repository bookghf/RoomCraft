# syntax=docker/dockerfile:1
#
# RoomCraft web (Next.js 16, standalone output).
#
#   docker build --build-arg API_URL=https://api.example.com -t roomcraft-web .
#   docker run -p 3000:3000 -e API_URL=https://api.example.com roomcraft-web
#
# API_URL is needed twice: at build time, because pages using "use cache" are prerendered
# with catalog data from the API, and at run time for everything else (server-side only).

# ---- Dependencies ----
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- Build ----
FROM node:24-alpine AS build
WORKDIR /app
ARG API_URL
ENV API_URL=${API_URL} \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- Run ----
FROM node:24-alpine AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]

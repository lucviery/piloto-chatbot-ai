FROM node:22.22.1-alpine3.22 AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22.22.1-alpine3.22 AS build
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22.22.1-alpine3.22
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
WORKDIR /app
USER node
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
EXPOSE 3001
CMD ["node", "server.js"]


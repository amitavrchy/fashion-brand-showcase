FROM node:22-alpine
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npx prisma generate && npm run build
RUN mkdir -p /app/.data/uploads && chown -R node:node /app/.data
ENV HOST=0.0.0.0
ENV PORT=4000
ENV NODE_ENV=production
USER node
VOLUME ["/app/.data/uploads"]
EXPOSE 4000
CMD ["node", "dist/main.js"]

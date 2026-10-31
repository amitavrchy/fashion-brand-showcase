FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npx prisma generate && npm run build
ENV HOST=0.0.0.0
ENV PORT=4000
EXPOSE 4000
CMD ["node", "dist/main.js"]

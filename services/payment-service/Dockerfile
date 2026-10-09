FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY package*.json ./

# Clean command relying on NODE_ENV=production
RUN npm install --omit=dev

COPY . .

USER node

EXPOSE 8081

CMD ["node", "index.js"]

FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY package.json ./

# Generate dependencies directly during build
RUN npm install --omit=dev

COPY . .

USER node
EXPOSE 8080
CMD ["node", "index.js"]

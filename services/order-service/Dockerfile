FROM node:20-alpine

# Set to production to omit devDependencies and optimize Express
ENV NODE_ENV=production

WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Best Practice: Run as non-root user built into the Node image
USER node

EXPOSE 8080

CMD ["node", "index.js"]

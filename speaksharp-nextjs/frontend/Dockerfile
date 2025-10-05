FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy application
COPY . .

# Build the application
RUN npm run build

# Run the application
CMD ["npm", "start"]
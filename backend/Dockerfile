FROM node:18-alpine

WORKDIR /app

# Install dependencies based on package.json
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 5000

# Install netcat for wait-for-it script (optional but good for checking db)
RUN apk add --no-cache netcat-openbsd

# Default command (will be overridden by entrypoint or CMD if needed)
# We will use a custom command in docker-compose or here to run migrations first
CMD ["npm", "start"]

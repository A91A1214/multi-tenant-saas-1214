# Build Stage
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production Stage (Using serve or nginx, but requirement says "Frontend accessible at http://localhost:3000")
# Using a simple node server to serve the static build on port 3000
FROM node:18-alpine

WORKDIR /app
RUN npm install -g serve

COPY --from=build /app/dist /app/dist

EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]

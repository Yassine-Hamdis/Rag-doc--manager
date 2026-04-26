# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- run stage ----
FROM nginx:alpine
# Copy built static files
COPY --from=build /app/dist /usr/share/nginx/html

# SPA routing (React Router) support:
# if you refresh /dashboard it should still load index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
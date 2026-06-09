# Build stage
FROM node:20-alpine as build
WORKDIR /app

# Kopieer package.json
COPY package*.json ./
RUN npm install

# Kopieer de rest van de code
COPY . .

# Stel environment variabelen in tijdens het bouwen (komt vanuit docker-compose of build args)
ARG VITE_HA_URL
ARG VITE_HA_TOKEN
ENV VITE_HA_URL=$VITE_HA_URL
ENV VITE_HA_TOKEN=$VITE_HA_TOKEN

# Bouw de React app (Vite)
RUN npm run build

# Serve stage met Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

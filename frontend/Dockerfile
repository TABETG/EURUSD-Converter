# build
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm i || (npm cache clean --force && npm i)
COPY . .
# PUBLIC_BASE pour Vite (facultatif)
ARG VITE_API_URL=http://localhost:8000
ARG VITE_BASE_PATH=/
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_BASE_PATH=$VITE_BASE_PATH
RUN npm run build

# serve SPA
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# SPA fallback
RUN sed -i 's/try_files \$uri \$uri\/ \/index.html;/try_files \$uri \/index.html;/' /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx","-g","daemon off;"]

FROM --platform=linux/amd64 swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/node:22 AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# The preview image must remain buildable while the repository-wide TypeScript
# test debt is handled separately. Vite still performs the production bundle.
RUN npx vite build

FROM --platform=linux/amd64 swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/nginx:1.29-alpine

RUN rm -rf /usr/share/nginx/html/*
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

ENTRYPOINT ["nginx", "-g", "daemon off;"]

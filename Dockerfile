
# 使用 Node 官方镜像作为基础镜像
FROM node:21.0.0
COPY ./dist /app/dist
COPY ./node_modules /app/node_modules
COPY ./package.json /app

WORKDIR /app
ENV NODE_ENV=production


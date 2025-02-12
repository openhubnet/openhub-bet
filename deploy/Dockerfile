# 使用 Node 官方镜像作为基础镜像
FROM node:20.18.3-slim
#FROM bitnami/node:latest

# 设置工作目录
WORKDIR /app

COPY ./dist /app/dist

COPY ./deploy/.env /app/dist/.env

COPY ./node_modules /app/node_modules

CMD ["node", "dist/main"]
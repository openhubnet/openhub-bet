
# 使用 Node 官方镜像作为基础镜像
FROM node:21.0.0
# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json 文件
COPY package*.json ./

# 安装依赖
RUN yarn install

# 复制所有项目文件
COPY . .

# 编译项目（如果你有 TypeScript 编译步骤）
RUN yarn build

# 启动 NestJS 应用
CMD ["npm", "run", "start:prod"]

# 容器暴露的端口
EXPOSE 8900

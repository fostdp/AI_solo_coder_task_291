# ============================================
# 构建阶段 - 前端构建和依赖安装
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# 复制包文件
COPY package*.json ./

# 安装所有依赖（包括开发依赖用于构建）
RUN npm ci

# 复制源代码
COPY . .

# 执行前端构建（Tree Shaking + 压缩优化）
RUN npm run build

# ============================================
# 生产阶段 - 精简镜像
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# 设置生产环境变量
ENV NODE_ENV=production
ENV PORT=3001

# 复制包文件
COPY package*.json ./

# 仅安装生产依赖
RUN npm ci --only=production && \
    npm cache clean --force

# 从构建阶段复制构建产物
COPY --from=builder /app/dist ./dist

# 复制服务器文件
COPY server.js ./

# 创建数据目录用于SQLite持久化
RUN mkdir -p /app/data && \
    chown -R node:node /app

# 切换到非root用户运行
USER node

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://localhost:3001/api/configs').then(r=>process.exit(r.ok?0:1))" || exit 1

# 启动服务
CMD ["node", "server.js"]

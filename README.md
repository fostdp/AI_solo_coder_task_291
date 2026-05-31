# ⚛️ 分子振动可视化应用

> 化学分子简谐振动可视化Web应用，支持多种渲染模式切换和Docker容器化部署。

## ✨ 特性

- 🔬 **多种预设分子（水分子、二氧化碳、甲烷、氨气、氮气
- 🎨 **三种渲染模式：球棍模型、空间填充、线框
- 🌡️ 温度控制振动幅度
- 💾 SQLite数据库持久化配置
- 🐳 Docker容器化部署
- ⚡ Vite构建优化 + Tree Shaking

## 🏗️ 架构设计

```
├── src/
│   ├── molecule-engine.js    # 核心引擎模块
│   │   ├── Physics            # 纯函数物理引擎
│   │   ├── Renderers        # 渲染器抽象层
│   │   └── MoleculeState  # 状态管理
│   ├── index.html           # 主应用入口
│   └── test.html            # 测试页面
├── server.js                 # Express API服务器
├── vite.config.js            # Vite构建配置
├── Dockerfile               # Docker镜像定义
└── docker-compose.yml       # Docker Compose编排
```

## 🚀 快速开始

### 方式一：本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问: http://localhost:3001
```

### 方式二：Docker生产构建

```bash
# 安装依赖
npm install

# 前端构建（Tree Shaking + 压缩优化）
npm run build

# 启动生产服务器
npm start
```

### 方式三：Docker Compose（推荐生产环境

```bash
# 构建并启动生产服务
docker-compose up -d app

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 📦 构建优化说明

### Tree Shaking配置

Vite基于Rollup实现深度Tree Shaking：

- ✅ 移除未使用代码
- ✅ 多轮压缩优化（3次pass）
- ✅ 生产环境移除console.log
- ✅ 代码分割（Code Splitting）
- ✅ 资源哈希缓存

### 构建命令

```bash
# 开发构建（含sourcemap
npm run build

# 预览构建结果
npm run preview
```

## 🐳 Docker部署

### 生产环境部署

```bash
# 构建镜像
docker-compose build app

# 启动服务
docker-compose up -d app

# 健康检查
docker-compose ps
```

### 开发模式（热重载）

```bash
docker-compose up -d dev
```

### 数据持久化

SQLite数据库通过Docker Volume持久化：

```bash
# 查看数据卷
docker volume ls | grep molecule

# 备份数据库
docker run --rm -v molecule-data:/data -v $(pwd):/backup alpine tar cvf /backup/molecule-db.tar /data
```

## 🔧 配置说明

### 环境变量

复制`.env.example`为`.env`：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| PORT | 服务端口 | 3001 |
| NODE_ENV | 运行环境 | development |
| DB_PATH | 数据库路径 | ./data/molecules.db |

### API接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/configs | 获取所有配置 |
| POST | /api/configs | 保存配置 |
| DELETE | /api/configs/:id | 删除配置 |

## 📊 项目脚本

| 命令 | 说明 |
|------|------|
| npm run dev | 开发模式启动 |
| npm run build | 生产构建 |
| npm run start | 生产模式启动 |
| npm run docker:build | Docker构建镜像 |
| npm run docker:up | Docker启动服务 |
| npm run docker:down | Docker停止服务 |
| npm run docker:logs | 查看Docker日志 |

## 🏛️ 核心模块说明

### Physics物理引擎（纯函数）

```javascript
// 简谐振动计算
Physics.harmonicVibration(atoms, temperature, time)

// 3D旋转
Physics.rotatePoint3D(x, y, z, rx, ry)

// 透视投影
Physics.perspectiveProject(x, y, z, scale)
```

### Renderers渲染器

- `BallAndStickRenderer` - 球棍模型
- `SpaceFillingRenderer` - 空间填充
- `WireframeRenderer` - 线框模式

扩展新渲染模式：

```javascript
class CustomRenderer extends AbstractRenderer {
  render(atoms, bonds, rotationX, rotationY, time) {
    // 自定义渲染逻辑
  }
}
```

## 📁 项目结构

```
├── public/
│   ├── index.html          # 主应用
│   ├── test.html          # 测试页面
│   └── molecule-engine.js  # 核心引擎
├── dist/                    # 构建产物（git忽略）
├── data/                    # 数据库目录（git忽略）
├── server.js                # API服务器
├── vite.config.js          # 构建配置
├── Dockerfile             # Docker镜像
├── docker-compose.yml     # Docker编排
└── package.json          # 项目配置
```

## 🔒 安全最佳实践

- ✅ 使用非root用户运行Docker容器
- ✅ 健康检查机制
- ✅ 数据库路径配置（.gitignore敏感文件
- ✅ CORS配置
- ✅ 输入参数校验

## 📄 License

MIT

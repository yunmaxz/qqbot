# QQ 多功能机器人管理系统

基于 **OneBot 协议**的 QQ 机器人管理平台，提供 Web 可视化后台，支持 AI 对话、语音消息、关键词回复、群管理等多种功能。

> **⚠️ 免责声明**
>
> 本项目使用 QQ **个人账号**接入 OneBot 协议，属于第三方客户端行为，**违反腾讯 QQ 服务条款**。  
> 使用本项目可能导致 **QQ 账号被限制、冻结或永久封禁**，风险由使用者自行承担。  
> 本项目仅供**个人学习与娱乐**使用，请勿用于违法违规行为，开发者不承担任何法律责任。

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Node.js + Express |
| 数据库 | MySQL + Sequelize ORM |
| 实时通信 | WebSocket（OneBot 协议） |
| 认证 | JWT |
| 前端 | Vue 3 + Pinia + Element Plus |
| 构建工具 | Vite |
| TTS | Microsoft Edge TTS（msedge-tts） |

## 功能特性

### AI 对话
- 支持接入任意 OpenAI 兼容接口（OpenAI、DeepSeek、本地模型等）
- 多 AI 服务商管理，可随时切换
- 多人设配置，支持自定义系统提示词
- 人设可按群组/私聊维度单独绑定
- 保留对话上下文记忆
- 群聊中 **@机器人** 触发，私聊直接对话

### 🎙️ 语音消息（TTS）
- 基于 **Microsoft Edge TTS**，免费无需 API Key
- 支持多种中文女声音色：晓晓（温柔甜美）、晓伊（活泼可爱）、晓墨（沉稳）、晓萱（亲切）等
- 在人设中配置**聊天语音概率**，AI 回复时按概率自动发送语音条代替文字
- 发送前自动过滤动作描述等不适合朗读的内容

### 💌 主动消息
在人设中启用后，机器人会主动给用户发送语音/文字消息，支持两种触发模式：

| 模式 | 说明 |
|------|------|
| **收到消息后触发** | 用户发消息后，随机延迟一段时间主动回一条 |
| **全天随机触发** | Bot 启动后全天自动运行，随机挑一个绑定的私聊用户发送，无需对方先开口 |

可在人设配置中自定义：触发概率、最短/最长延迟时间、主动消息的 AI 提示词。

### 关键词回复
- 支持**精确匹配**、**包含匹配**、**正则表达式**三种模式
- 优先级排序，高优先级规则优先匹配
- 后台可视化管理，随时增删改

### 群管理
- **违禁词检测**：支持精确/包含/正则三种匹配，违规自动禁言
- **刷屏检测**：时间窗口内超出消息数量阈值自动禁言
- **长消息检测**：超出字数限制自动处理
- **白名单机制**：白名单用户免于所有群管检测
- **违规记录**：完整记录用户违规历史

### 指令系统

| 指令 | 说明 | 权限 |
|------|------|------|
| `/help` / `/帮助` | 查看帮助菜单 | 所有人 |
| `/菜单` | 查看群功能菜单 | 所有人 |
| `/禁言 @用户 时长(分钟)` | 禁言成员 | 群主/管理员 |
| `/解除禁言 @用户` | 解除禁言 | 群主/管理员 |
| `/踢人 @用户` | 移出群聊 | 群主/管理员 |
| `/星座 [星座名]` | 查询星座运势 | 所有人 |
| `/看看腿` | 随机发送图片 | 所有人 |
| `/小姐姐` | 随机发送视频 | 所有人 |

> 禁言/解除禁言/踢人指令名称可在后台自定义

### 群事件
- **入群欢迎**：新成员加入时自动发送欢迎消息，支持 `{at}` `{nickname}` 占位符
- **退群提示**：成员退群时自动发送提示消息

### Web 管理后台
- **数据看板**：总消息数、今日消息、AI 对话数、关键词触发数、机器人连接状态
- **机器人配置**：OneBot 连接地址/Token、功能开关管理
- **AI 人设管理**：创建/编辑人设，配置音色、语音概率、主动消息策略，绑定到指定群或私聊
- **AI 服务商管理**：配置多个 API 服务商
- **关键词管理**：可视化配置关键词回复规则
- **群组管理**：群配置、禁言记录、群管策略、群菜单配置
- **消息日志**：查看所有消息及机器人回复记录

## 环境要求

| 依赖 | 版本要求 |
|------|---------|
| Node.js | >= 18（推荐 22.x LTS） |
| MySQL | >= 8.0 |
| OneBot 协议端 | LLOneBot 或 NapCat |

> **语音功能说明**：TTS 使用 Microsoft Edge TTS，无需额外安装。语音发送依赖 OneBot 协议端的音频格式转换能力，LLOneBot 和 NapCat 均内置 ffmpeg，开箱即用。

## 环境安装

### Node.js

推荐安装 **v22.17.0 LTS** 版本。

**Windows：**

前往以下地址下载安装包，一路 Next 安装即可：

[https://nodejs.org/dist/v22.17.0/node-v22.17.0-x64.msi](https://nodejs.org/dist/v22.17.0/node-v22.17.0-x64.msi)


**验证安装：**
```bash
node -v   # 应输出 v22.x.x
npm -v
```

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/yunmaxz/qqbot.git
cd qqbot
```

### 2. 安装依赖

```bash
# 一键安装前后端所有依赖
npm run install:all
```

### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=你的数据库用户名
DB_PASSWORD=你的数据库密码
DB_NAME=你的数据库名

JWT_SECRET=运行npm run gen:secret
JWT_EXPIRES_IN=24h

SERVER_PORT=3000
SERVER_HOST=0.0.0.0
```

### 4. 初始化数据库

在 MySQL 中执行以下 SQL 文件：

```bash
mysql -u root -p < database/init.sql
mysql -u root -p qqbot < database/group_management.sql
```

### 5. 构建前端

```bash
npm run build
```

### 6. 启动服务

```bash
# 生产环境
npm start

# 开发环境（热重载）
npm run dev
```

启动后访问 `http://localhost:3000`，默认账号：

- 用户名：`admin`
- 密码：`123456`

> **请在首次登录后立即修改默认密码**

### 7. 配置 OneBot 连接

登录后台 → **机器人配置** → 填写 OneBot WebSocket 地址（如 `ws://127.0.0.1:3001`）和 Token（无则留空）→ 保存后自动重连。

### 8. LLOneBot 在 Linux（无 GUI）下运行

以 `llbot` 目录为例，先进入目录：

```bash
cd /www/wwwroot/qqbot/llbot
```

首次启动（用于登录 QQ）：

```bash
./start.sh
```

登录成功后，使用后台方式运行：

```bash
nohup ./start.sh > llbot.log 2>&1 &
```

查看日志并获取扫码信息：

```bash
tail -f llbot.log
```

停止 llbot：

```bash
pkill -f "./start.sh"
```

### 9. 配置语音人设（可选）

登录后台 → **AI 人设管理** → 编辑人设 → 开启「语音设置」：

1. 选择音色（推荐晓晓）
2. 设置聊天语音概率（如 30%，即 30% 的回复以语音发出）
3. 开启主动消息，选择触发模式，设置延迟范围和提示词

## 项目结构

```
qqbot/
├── server.js                    # 主入口
├── .env.example                 # 环境变量模板
├── .gitignore
├── database/
│   ├── init.sql                 # 主库表结构
│   └── group_management.sql     # 群管扩展表
├── src/
│   ├── config/database.js       # 数据库配置
│   ├── controllers/             # 业务控制器
│   ├── middleware/auth.js       # JWT 鉴权中间件
│   ├── models/                  # Sequelize 数据模型
│   ├── routes/                  # API 路由
│   └── services/
│       ├── oneBotService.js     # OneBot 核心（消息/指令处理）
│       ├── aiService.js         # AI 对话服务
│       ├── ttsService.js        # TTS 语音合成服务
│       ├── proactiveService.js  # 主动消息调度服务
│       ├── groupManagementService.js  # 群管服务
│       ├── zodiacService.js     # 星座运势
│       ├── picService.js        # 随机图片
│       └── videoService.js      # 随机视频
└── web/                         # Vue 3 前端
    ├── src/
    │   ├── views/               # 页面组件
    │   ├── stores/              # Pinia 状态管理
    │   └── router.js
    └── dist/                    # 构建产物（由 server.js 托管）
```

## API 接口

| 路径 | 说明 |
|------|------|
| `POST /api/auth/login` | 登录 |
| `GET/PUT /api/bot/config` | 机器人配置 |
| `GET/PUT /api/bot/plugins` | 插件开关管理 |
| `GET/POST/PUT/DELETE /api/keywords` | 关键词规则管理 |
| `GET /api/logs` | 消息日志查询 |
| `GET/POST/PUT/DELETE /api/providers` | AI 服务商管理 |
| `GET/POST/PUT/DELETE /api/personas` | AI 人设管理 |
| `GET/POST/PUT /api/groups` | 群组配置 |
| `GET/POST/PUT /api/group-management` | 群管策略配置 |

## 常见问题

**Q: 机器人不响应消息？**  
A: 检查后台机器人配置页的连接状态是否为「已连接」，确认 OneBot 协议端正常运行。

**Q: AI 不回复？**  
A: 确认已在「功能管理」中开启 AI 对话，并配置了正确的 AI 服务商和人设；群聊需要 @机器人 才会触发。

**Q: 语音消息发送失败？**  
A: 确认 OneBot 协议端（LLOneBot/NapCat）版本较新，两者均内置 ffmpeg 支持音频格式转换。检查 `temp/` 目录是否有写入权限。

**Q: 主动消息不触发？**  
A: 全天随机模式在 bot 连接成功后自动初始化，确认人设已启用语音、主动消息已开启，且该人设绑定了私聊用户。

**Q: 群管功能不生效？**  
A: 在「群组管理 → 群管策略」中确认对应群的群管开关已启用，且具体功能（违禁词/刷屏等）已单独开启。

**Q: Windows 部署推荐使用哪个 OneBot 协议端？**  
A: 推荐 [LLOneBot](https://llonebot.github.io)（基于 NTQQ 插件）。Linux 服务器推荐使用 [NapCat](https://napneko.github.io)，支持无头运行。

## 免责声明

1. **账号安全风险**：本项目通过 LLOneBot / NapCat 等第三方协议端接管 QQ 个人账号，此行为违反腾讯用户协议。账号随时可能被腾讯检测并实施限制、冻结或封禁，**开发者对此不承担任何责任**。

2. **内容责任**：使用者须对机器人发送的所有内容负责，包括 AI 生成内容、关键词回复等。请勿用于传播违法信息、骚扰他人或其他违规行为。

3. **仅供学习**：本项目是个人开源学习项目，不提供任何形式的运营保障或 SLA，不建议用于生产环境。

4. **数据安全**：`.env` 文件中含数据库密码、JWT 密钥等敏感信息，请妥善保管，切勿泄露或上传至公开仓库。

**使用本项目即代表您已了解并接受以上风险。**

---

## License

本项目采用 **MIT 非商业许可证**。

- 允许个人使用、学习、二次开发
- 分发修改版须保留原始版权声明
- **严禁用于任何商业目的**

详见 [LICENSE](./LICENSE) 文件。

/**
 * QQ Bot Manager - 主入口
 * Copyright (c) 2025 云码小栈 <https://yunmaxz.com>
 * 本项目采用 MIT 非商业许可证，仅供娱乐与学习使用，禁止商业用途。
 */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./src/config/database');
const oneBotService = require('./src/services/oneBotService');

const authRoutes = require('./src/routes/auth');
const botRoutes = require('./src/routes/bot');
const keywordRoutes = require('./src/routes/keyword');
const logRoutes = require('./src/routes/log');
const providerRoutes = require('./src/routes/provider');
const personaRoutes = require('./src/routes/persona');
const groupRoutes = require('./src/routes/group');
const groupManagementRoutes = require('./src/routes/groupManagement');

const app = express();
const PORT = process.env.SERVER_PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/bot', botRoutes);
app.use('/api/keywords', keywordRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/personas', personaRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/group-management', groupManagementRoutes);

app.use(express.static(path.join(__dirname, 'web/dist')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'web/dist/index.html'));
});

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('[数据库] 连接成功');

        await sequelize.sync({ alter: false });
        console.log('[数据库] 模型同步完成');

        app.listen(PORT, process.env.SERVER_HOST || '0.0.0.0', () => {
            console.log(`[服务器] 运行在 http://localhost:${PORT}`);
        });

        oneBotService.connect();
    } catch (error) {
        console.error('[启动失败]', error);
        process.exit(1);
    }
}

process.on('SIGINT', () => {
    console.log('[系统] 正在关闭...');
    oneBotService.disconnect();
    process.exit(0);
});

startServer();

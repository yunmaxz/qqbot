/**
 * OneBot 协议服务 - 消息收发与事件处理
 * Copyright (c) 2025 云码小栈 <https://yunmaxz.com>
 */
const WebSocket = require('ws');
const fs = require('fs');
const { MessageLog, ChatContext, BotConfig, AiConfig, PluginConfig, KeywordReply, AiPersona, PersonaBinding, GroupConfig, GroupMute, GroupPluginMenu, AiProvider } = require('../models');
const aiService = require('../services/aiService');
const zodiacService = require('../services/zodiacService');
const picService = require('../services/picService');
const videoService = require('../services/videoService');
const GroupManagementService = require('../services/groupManagementService');
const proactiveService = require('../services/proactiveService');

class OneBotClient {
    constructor() {
        this.ws = null;
        this.connected = false;
        this.botQQ = null;
        this.reconnectTimer = null;
        this.heartbeatTimer = null;
        this.groupManagementService = new GroupManagementService(this);
    }

    async connect() {
        const config = await BotConfig.findOne({ where: { configKey: 'onebot_url' } });
        const tokenConfig = await BotConfig.findOne({ where: { configKey: 'onebot_token' } });
        
        if (!config) {
            console.error('[OneBot] 未配置连接地址');
            return;
        }

        const url = config.configValue;
        const token = tokenConfig?.configValue || '';

        console.log(`[OneBot] 正在连接: ${url}`);

        this.ws = new WebSocket(url, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });

        this.ws.on('open', () => {
            console.log('[OneBot] 连接成功');
            this.connected = true;
            this.getLoginInfo();
            this.startHeartbeat();
            // 初始化全天随机主动消息
            proactiveService.initAllDayPersonas(this);
        });

        this.ws.on('message', (data) => {
            try {
                const event = JSON.parse(data.toString());
                this.handleEvent(event);
            } catch (err) {
                console.error('[OneBot] 解析消息失败:', err);
            }
        });

        this.ws.on('close', () => {
            console.log('[OneBot] 连接断开，5秒后重连...');
            this.connected = false;
            this.stopHeartbeat();
            this.reconnect();
        });

        this.ws.on('error', (err) => {
            console.error('[OneBot] 连接错误:', err.message);
        });
    }

    reconnect() {
        if (this.reconnectTimer) return;
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
        }, 5000);
    }

    startHeartbeat() {
        // 每30秒发送一次心跳
        this.heartbeatTimer = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                // 发送 get_version_info 作为心跳
                this.send({
                    action: 'get_version_info',
                    params: {}
                });
                console.log('[OneBot] 发送心跳');
            }
        }, 30000);
    }

    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    async reconnectWithNewConfig() {
        console.log('[OneBot] 检测到配置变更，正在重新连接...');
        
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.ws) {
            this.ws.removeAllListeners();
            this.ws.close();
            this.ws = null;
        }

        this.connected = false;
        this.botQQ = null;

        await this.connect();
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    async sendGroupMessage(groupId, message) {
        this.send({
            action: 'send_group_msg',
            params: {
                group_id: groupId,
                message: message
            }
        });
    }

    async sendPrivateMessage(userId, message) {
        this.send({
            action: 'send_private_msg',
            params: {
                user_id: userId,
                message: message
            }
        });
    }

    async getLoginInfo() {
        this.send({
            action: 'get_login_info',
            echo: 'login_info'
        });
    }

    async handleEvent(event) {
        if (event.echo === 'login_info') {
            if (event.data) {
                this.botQQ = event.data.user_id;
                console.log(`[OneBot] 机器人QQ: ${event.data.nickname}(${event.data.user_id})`);
            }
            return;
        }

        if (event.post_type === 'message') {
            await this.handleMessage(event);
        } else if (event.post_type === 'notice') {
            await this.handleNotice(event);
        }
    }

    async handleNotice(event) {
        if (event.notice_type === 'group_increase') {
            await this.handleGroupIncrease(event);
        } else if (event.notice_type === 'group_decrease') {
            await this.handleGroupDecrease(event);
        }
    }

    async handleGroupIncrease(event) {
        const { group_id, user_id, sub_type } = event;
        if (sub_type === 'approve' || sub_type === 'invite') {
            const groupConfig = await GroupConfig.findOne({ where: { groupId: group_id, enabled: 1 } });
            if (groupConfig && groupConfig.welcomeEnabled && groupConfig.welcomeMessage) {
                const msg = groupConfig.welcomeMessage.replace(/\{at\}/g, `[CQ:at,qq=${user_id}]`).replace(/\{nickname\}/g, event.user_id ? '' : '新成员');
                await this.sendGroupMessage(group_id, msg);
            }
        }
    }

    async handleGroupDecrease(event) {
        const { group_id, user_id, sub_type } = event;
        const groupConfig = await GroupConfig.findOne({ where: { groupId: group_id, enabled: 1 } });
        if (groupConfig && groupConfig.leaveEnabled && groupConfig.leaveMessage) {
            const msg = groupConfig.leaveMessage.replace(/\{nickname\}/g, '成员');
            await this.sendGroupMessage(group_id, msg);
        }
    }

    async handleMessage(event) {
        const { message_type, user_id, group_id, message, raw_message, sender } = event;

        if (message_type === 'private' && !this.isValidPrivateUser(user_id, sender)) {
            return;
        }

        console.log(`[消息] ${message_type === 'group' ? `群${group_id}` : '私聊'} - ${sender?.nickname || user_id}: ${raw_message}`);

        await MessageLog.create({
            messageType: message_type,
            userId: user_id,
            groupId: group_id,
            message: raw_message
        });

        // 群管功能检测（仅群聊消息）
        if (message_type === 'group') {
            const isViolation = await this.groupManagementService.processMessage(event);
            if (isViolation) {
                return; // 违规消息已处理，不再继续
            }
        }

        const isAt = this.checkIsAt(message);
        const cleanMessage = this.cleanMessage(message);

        if (cleanMessage.startsWith('/')) {
            await this.handleCommand(cleanMessage, event);
            return;
        }

        const keywordReplyEnabled = await this.isPluginEnabled('keyword_reply');
        if (keywordReplyEnabled) {
            const keywordReply = await this.checkKeywordReply(cleanMessage);
            if (keywordReply) {
                await this.reply(message_type, group_id, user_id, keywordReply);
                await this.logReply(message_type, user_id, group_id, cleanMessage, keywordReply, 'keyword');
                return;
            }
        }

        const aiEnabled = await this.isPluginEnabled('ai_chat');
        if (aiEnabled) {
            const persona = await this.getPersonaForChat(message_type, group_id, user_id);
            if (persona && persona.enabled) {
                let shouldTrigger = false;

                if (message_type === 'private') {
                    shouldTrigger = true;
                } else {
                    const isAtTrigger = this.checkIsAt(message);
                    shouldTrigger = isAtTrigger;
                }

                if (shouldTrigger) {
                    const reply = await aiService.chat(cleanMessage, user_id, group_id, persona);
                    if (reply) {
                        // 判断是否以语音回复
                        const voiceCfg = this._getVoiceConfig(persona);
                        const replyAsVoice = persona.voiceEnabled
                            && voiceCfg.voiceName
                            && Math.random() < (voiceCfg.replyVoiceProbability ?? 0);

                        if (replyAsVoice) {
                            await proactiveService.sendVoiceReply(
                                reply, voiceCfg.voiceName, message_type, group_id, user_id, this
                            );
                        } else {
                            await this.reply(message_type, group_id, user_id, reply);
                        }
                        await this.logReply(message_type, user_id, group_id, cleanMessage, reply, 'ai');
                    }

                    // 私聊：「收到消息后」模式触发
                    if (message_type === 'private') {
                        proactiveService.scheduleAfterMessage(user_id, persona, this);
                    }
                }
            }
        }
    }

    async getPersonaForChat(messageType, groupId, userId) {
        const bindType = messageType === 'group' ? 'group' : 'private';
        const bindTarget = messageType === 'group' ? groupId : userId;

        const binding = await PersonaBinding.findOne({
            where: {
                bindType,
                bindTarget,
                enabled: 1
            },
            include: [{
                model: AiPersona,
                as: 'AiPersona',
                where: { enabled: 1 },
                required: true
            }]
        });

        if (binding) {
            return binding.AiPersona;
        }

        if (messageType === 'private') {
            const persona = await AiPersona.findOne({
                where: {
                    enabled: 1,
                    scope: { [require('sequelize').Op.in]: ['private', 'all'] }
                },
                include: [{
                    model: AiProvider,
                    as: 'AiProvider',
                    where: { enabled: 1 },
                    required: false
                }],
                order: [['id', 'ASC']]
            });
            return persona;
        }

        if (messageType === 'group') {
            const persona = await AiPersona.findOne({
                where: {
                    enabled: 1,
                    scope: { [require('sequelize').Op.in]: ['group', 'all'] }
                },
                include: [{
                    model: AiProvider,
                    as: 'AiProvider',
                    where: { enabled: 1 },
                    required: false
                }],
                order: [['id', 'ASC']]
            });
            return persona;
        }

        return null;
    }

    // 从消息数组中提取@的QQ号
    extractAtQQ(message) {
        if (Array.isArray(message)) {
            const atItem = message.find(item => item.type === 'at');
            if (atItem && atItem.data?.qq) {
                return String(atItem.data.qq);
            }
        }
        return null;
    }

    // 从文本中提取QQ号（支持直接输入数字或@格式）
    extractQQFromText(text) {
        if (!text) return null;
        // 匹配[@123456]格式
        const match = text.match(/\[@?(\d+)\]?/);
        if (match) {
            return match[1];
        }
        // 匹配纯数字
        if (/^\d+$/.test(text.trim())) {
            return text.trim();
        }
        return null;
    }

    async handleCommand(message, event) {
        const { message_type, user_id, group_id, sender, message: messageArray } = event;
        const parts = message.slice(1).split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);

        if (message_type === 'group') {
            const groupConfig = await GroupConfig.findOne({ where: { groupId: group_id } });
            // 从 sender 中获取角色信息，owner 表示群主，admin 表示管理员
            const isOwner = sender && (sender.role === 'owner' || sender.role === 'admin');

            const muteCmd = (groupConfig?.muteCommand || '禁言').toLowerCase();
            const unmuteCmd = (groupConfig?.unmuteCommand || '解除禁言').toLowerCase();
            const kickCmd = (groupConfig?.kickCommand || '踢人').toLowerCase();

            if (command === muteCmd || command === '禁言') {
                if (!isOwner) {
                    await this.reply(message_type, group_id, user_id, '仅群主可使用此指令');
                    return;
                }
                if (args.length < 2) {
                    const usage = groupConfig?.commandUsage || `用法: /${groupConfig?.muteCommand || '禁言'} @用户 时长(分钟)`;
                    await this.reply(message_type, group_id, user_id, usage);
                    return;
                }
                
                // 尝试从消息数组中提取@的QQ号
                let targetUserId = this.extractAtQQ(messageArray);
                
                // 如果没有@，尝试从第一个参数解析
                if (!targetUserId) {
                    targetUserId = this.extractQQFromText(args[0]);
                }
                
                if (!targetUserId) {
                    await this.reply(message_type, group_id, user_id, '请@要禁言的用户或输入正确的QQ号');
                    return;
                }
                
                // 解析时长（分钟），转换为秒
                const durationMinutes = parseInt(args[1]);
                if (isNaN(durationMinutes) || durationMinutes <= 0) {
                    await this.reply(message_type, group_id, user_id, '请输入正确的禁言时长（分钟）');
                    return;
                }
                const muteDuration = durationMinutes * 60; // 转换为秒
                
                this.send({
                    action: 'set_group_ban',
                    params: {
                        group_id: group_id,
                        user_id: parseInt(targetUserId),
                        duration: muteDuration
                    }
                });
                await GroupMute.create({ groupId: group_id, userId: parseInt(targetUserId), duration: muteDuration });
                await this.reply(message_type, group_id, user_id, `已禁言 ${targetUserId} ${durationMinutes}分钟`);
                return;
            }

            if (command === unmuteCmd || command === '解除禁言') {
                if (!isOwner) {
                    await this.reply(message_type, group_id, user_id, '仅群主可使用此指令');
                    return;
                }
                if (args.length < 1) {
                    const usage = groupConfig?.commandUsage || `用法: /${groupConfig?.unmuteCommand || '解除禁言'} @用户`;
                    await this.reply(message_type, group_id, user_id, usage);
                    return;
                }
                
                // 尝试从消息数组中提取@的QQ号
                let targetUserId = this.extractAtQQ(messageArray);
                
                // 如果没有@，尝试从第一个参数解析
                if (!targetUserId) {
                    targetUserId = this.extractQQFromText(args[0]);
                }
                
                if (!targetUserId) {
                    await this.reply(message_type, group_id, user_id, '请@要解除禁言的用户或输入正确的QQ号');
                    return;
                }
                
                this.send({
                    action: 'set_group_ban',
                    params: {
                        group_id: group_id,
                        user_id: parseInt(targetUserId),
                        duration: 0
                    }
                });
                await GroupMute.destroy({ where: { groupId: group_id, userId: parseInt(targetUserId) } });
                await this.reply(message_type, group_id, user_id, `已解除 ${targetUserId} 的禁言`);
                return;
            }

            if (command === kickCmd || command === '踢人') {
                if (!isOwner) {
                    await this.reply(message_type, group_id, user_id, '仅群主可使用此指令');
                    return;
                }
                if (args.length < 1) {
                    const usage = groupConfig?.commandUsage || `用法: /${groupConfig?.kickCommand || '踢人'} @用户`;
                    await this.reply(message_type, group_id, user_id, usage);
                    return;
                }
                
                // 尝试从消息数组中提取@的QQ号
                let targetUserId = this.extractAtQQ(messageArray);
                
                // 如果没有@，尝试从第一个参数解析
                if (!targetUserId) {
                    targetUserId = this.extractQQFromText(args[0]);
                }
                
                if (!targetUserId) {
                    await this.reply(message_type, group_id, user_id, '请@要踢出的用户或输入正确的QQ号');
                    return;
                }
                
                this.send({
                    action: 'set_group_kick',
                    params: {
                        group_id: group_id,
                        user_id: parseInt(targetUserId),
                        reject_add_request: false
                    }
                });
                await this.reply(message_type, group_id, user_id, `已将 ${targetUserId} 移出群聊`);
                return;
            }
        }

        switch (command) {
            case 'help':
            case '帮助':
                let helpMsg = `【机器人帮助菜单】\n/help - 显示帮助\n/菜单 - 查看功能菜单\n@我 直接对话 - AI智能对话`;
                if (message_type === 'group') {
                    const groupConfig = await GroupConfig.findOne({ where: { groupId: group_id } });
                    const muteCmd = groupConfig?.muteCommand || '禁言';
                    const unmuteCmd = groupConfig?.unmuteCommand || '解除禁言';
                    const kickCmd = groupConfig?.kickCommand || '踢人';
                    const usage = groupConfig?.commandUsage;
                    helpMsg += `\n\n【群管理指令】(仅群主可用)\n/${muteCmd} @QQ号 时长(秒) - 禁言成员\n/${unmuteCmd} @QQ号 - 解除禁言\n/${kickCmd} @QQ号 - 移出群聊`;
                    if (usage) {
                        helpMsg += `\n\n【指令说明】\n${usage}`;
                    }
                }
                await this.reply(message_type, group_id, user_id, helpMsg);
                break;

            case '菜单':
                if (message_type === 'group') {
                    const numericGroupId = parseInt(group_id, 10);
                    console.log(`[菜单] 查询群 ${numericGroupId} 的菜单`);
                    const menuItems = await GroupPluginMenu.findAll({
                        where: { groupId: numericGroupId, enabled: 1 },
                        include: [{
                            model: PluginConfig,
                            as: 'PluginConfig',
                            attributes: ['pluginName', 'pluginDesc', 'configJson']
                        }]
                    });
                    console.log(`[菜单] 查询结果: ${menuItems.length} 条`);

                    if (menuItems.length > 0) {
                        const col1 = [];
                        const col2 = [];
                        menuItems.forEach((item, index) => {
                            const plugin = item.PluginConfig;
                            let displayName = plugin?.pluginDesc || item.pluginName;
                            if (plugin?.configJson) {
                                try {
                                    const config = JSON.parse(plugin.configJson);
                                    if (config.menuName) {
                                        displayName = config.menuName;
                                    }
                                } catch (e) {}
                            }
                            if (index % 2 === 0) {
                                col1.push(displayName);
                            } else {
                                col2.push(displayName);
                            }
                        });
                        const maxLen = Math.max(col1.length, col2.length);
                        let menuMsg = '【功能菜单】';
                        for (let i = 0; i < maxLen; i++) {
                            const left = col1[i] || '';
                            const right = col2[i] || '';
                            const padding = ' '.repeat(Math.max(0, 8 - left.length));
                            menuMsg += `\n${left}${padding}│ ${right}`;
                        }
                        await this.reply(message_type, group_id, user_id, menuMsg);
                    } else {
                        await this.reply(message_type, group_id, user_id, '暂无功能菜单');
                    }
                }
                break;

            default: {
                const zodiacEnabled = await this.isPluginEnabled('zodiac');
                if (zodiacEnabled) {
                    const zodiacPlugin = await PluginConfig.findOne({ where: { pluginName: 'zodiac' } });
                    if (zodiacPlugin && zodiacPlugin.configJson) {
                        try {
                            const zodiacConfig = JSON.parse(zodiacPlugin.configJson);
                            const triggerCmd = zodiacConfig.triggerCommand || '星座';
                            if (command === triggerCmd.toLowerCase() || command === triggerCmd) {
                                const signInput = args.join(' ');
                                if (!signInput) {
                                    const signList = zodiacService.getSignList().join('、');
                                    await this.reply(message_type, group_id, user_id, `请输入星座名称，如：/${triggerCmd} 双鱼座\n\n可选：${signList}`);
                                    return;
                                }
                                const sign = zodiacService.matchSign(signInput);
                                if (!sign) {
                                    const signList = zodiacService.getSignList().join('、');
                                    await this.reply(message_type, group_id, user_id, `未找到星座"${signInput}"，可选：${signList}`);
                                    return;
                                }
                                const horoscope = await zodiacService.getHoroscope(sign);
                                await this.reply(message_type, group_id, user_id, horoscope);
                                return;
                            }
                        } catch (e) {
                            console.error('[星座] 配置解析失败:', e.message);
                        }
                    }
                }

                const picEnabled = await this.isPluginEnabled('pic');
                console.log('[看看腿] 插件启用状态:', picEnabled);
                if (picEnabled) {
                    const picPlugin = await PluginConfig.findOne({ where: { pluginName: 'pic' } });
                    console.log('[看看腿] 插件记录:', picPlugin ? '存在' : '不存在');
                    if (picPlugin) {
                        try {
                            const picConfig = picPlugin.configJson ? JSON.parse(picPlugin.configJson) : {};
                            const triggerCmd = picConfig.triggerCommand || '看看腿';
                            console.log('[看看腿] 触发指令:', triggerCmd, '当前指令:', command);
                            if (command === triggerCmd.toLowerCase() || command === triggerCmd) {
                                console.log('[看看腿] 开始获取图片...');
                                try {
                                    const picUrl = await picService.getRandomPic();
                                    console.log('[看看腿] 获取结果:', picUrl.substring(0, 50));
                                    if (picUrl.startsWith('http')) {
                                        await this.replyImage(message_type, group_id, user_id, picUrl);
                                    } else if (picUrl.startsWith('base64://')) {
                                        await this.replyImage(message_type, group_id, user_id, picUrl);
                                    } else if (fs.existsSync(picUrl)) {
                                        await this.replyImageFile(message_type, group_id, user_id, picUrl);
                                    } else {
                                        await this.reply(message_type, group_id, user_id, picUrl);
                                    }
                                } catch (err) {
                                    console.error('[看看腿] 获取失败:', err.message);
                                    await this.reply(message_type, group_id, user_id, '获取图片失败，请稍后再试。');
                                }
                                return;
                            }
                        } catch (e) {
                            console.error('[看看腿] 配置解析失败:', e.message);
                        }
                    }
                }

                const videoEnabled = await this.isPluginEnabled('video');
                if (videoEnabled) {
                    const videoPlugin = await PluginConfig.findOne({ where: { pluginName: 'video' } });
                    if (videoPlugin) {
                        try {
                            const videoConfig = videoPlugin.configJson ? JSON.parse(videoPlugin.configJson) : {};
                            const triggerCmd = videoConfig.triggerCommand || '小姐姐';
                            if (command === triggerCmd.toLowerCase() || command === triggerCmd) {
                                await this.reply(message_type, group_id, user_id, '正在下载视频中，请稍后...');

                                try {
                                    const videoUrl = await videoService.getVideoUrl();
                                    if (!videoUrl) {
                                        await this.reply(message_type, group_id, user_id, '获取视频链接失败，请稍后再试。');
                                        return;
                                    }

                                    const videoPath = await videoService.downloadVideo(videoUrl);
                                    if (!videoPath) {
                                        await this.reply(message_type, group_id, user_id, '下载视频失败，请稍后再试。');
                                        return;
                                    }

                                    await this.replyVideoFile(message_type, group_id, user_id, videoPath);
                                } catch (err) {
                                    console.error('[小姐姐] 获取失败:', err.message);
                                    await this.reply(message_type, group_id, user_id, '获取视频失败，请稍后再试。');
                                }
                                return;
                            }
                        } catch (e) {
                            console.error('[小姐姐] 配置解析失败:', e.message);
                        }
                    }
                }

                await this.reply(message_type, group_id, user_id, '未知指令，输入 /help 查看帮助');
            }
        }
    }

    isValidPrivateUser(userId, sender) {
        if (userId < 10000) return false;
        if (sender?.card) return false;
        if (sender?.nickname && (sender.nickname.includes('QQ游戏') || sender.nickname.includes('公众号') || sender.nickname.includes('腾讯'))) {
            return false;
        }
        return true;
    }

    checkIsAt(message) {
        if (Array.isArray(message)) {
            return message.some(item => 
                item.type === 'at' && String(item.data?.qq) === String(this.botQQ)
            );
        }
        return false;
    }

    cleanMessage(message) {
        if (Array.isArray(message)) {
            return message
                .map(item => {
                    if (item.type === 'text') {
                        return item.data?.text || '';
                    } else if (item.type === 'face') {
                        const faceId = parseInt(item.data?.id || '0');
                        const faceName = this.getFaceName(faceId);
                        return faceName ? `[${faceName}]` : `[表情]`;
                    } else if (item.type === 'image') {
                        return '[图片]';
                    } else if (item.type === 'at') {
                        return `[@${item.data?.qq || ''}]`;
                    }
                    return '';
                })
                .join('')
                .trim();
        }
        return message;
    }

    getFaceName(faceId) {
        const faceMap = {
            0: '微笑', 1: '撇嘴', 2: '色', 3: '发呆', 4: '得意', 5: '流泪', 6: '害羞', 7: '闭嘴', 8: '睡', 9: '大哭',
            10: '尴尬', 11: '发怒', 12: '调皮', 13: '呲牙', 14: '惊讶', 15: '难过', 16: '酷', 17: '冷汗', 18: '抓狂', 19: '吐',
            20: '偷笑', 21: '可爱', 22: '白眼', 23: '傲慢', 24: '饥饿', 25: '困', 26: '惊恐', 27: '流汗', 28: '憨笑', 29: '大兵',
            30: '奋斗', 31: '咒骂', 32: '疑问', 33: '嘘', 34: '晕', 35: '折磨', 36: '衰', 37: '骷髅', 38: '敲打', 39: '再见',
            40: '擦汗', 41: '抠鼻', 42: '鼓掌', 43: '糗大了', 44: '坏笑', 45: '左哼哼', 46: '右哼哼', 47: '哈欠', 48: '鄙视', 49: '委屈',
            50: '快哭了', 51: '阴险', 52: '亲亲', 53: '吓', 54: '可怜', 55: '菜刀', 56: '西瓜', 57: '啤酒', 58: '篮球', 59: '乒乓',
            60: '咖啡', 61: '饭', 62: '猪头', 63: '玫瑰', 64: '凋谢', 65: '示爱', 66: '爱心', 67: '心碎', 68: '蛋糕', 69: '闪电',
            70: '炸弹', 71: '刀', 72: '足球', 73: '瓢虫', 74: '便便', 75: '月亮', 76: '太阳', 77: '礼物', 78: '拥抱', 79: '强',
            80: '弱', 81: '握手', 82: '胜利', 83: '抱拳', 84: '勾引', 85: '拳头', 86: '差劲', 87: '爱你', 88: 'NO', 89: 'OK',
            90: '爱情', 91: '飞吻', 92: '跳跳', 93: '发抖', 94: '怄火', 95: '转圈', 96: '磕头', 97: '回头', 98: '跳绳', 99: '挥手',
            100: '激动', 101: '街舞', 102: '献吻', 103: '左太极', 104: '右太极', 105: '双喜', 106: '鞭炮', 107: '灯笼', 108: '发财', 109: 'K歌',
            110: '购物', 111: '邮件', 112: '帅', 113: '喝彩', 114: '祈祷', 115: '爆筋', 116: '棒棒糖', 117: '喝奶', 118: '下面条', 119: '香蕉',
            120: '飞机', 121: '开车', 122: '左车头', 123: '车厢', 124: '右车头', 125: '多云', 126: '下雨', 127: '钞票', 128: '熊猫', 129: '灯泡',
            130: '风车', 131: '闹钟', 132: '打伞', 133: '彩球', 134: '钻戒', 135: '沙发', 136: '纸巾', 137: '药', 138: '手枪', 139: '青蛙',
            144: '吓', 145: '囧', 146: '笑脸', 147: '阴险', 148: '抓狂', 149: '吐舌', 150: '喷血', 151: '无奈', 152: '卖萌', 153: '小纠结',
            154: '拍桌', 155: '拍手', 156: '嘻嘻', 157: '笑哭', 158: 'doge', 159: '泪奔', 160: '无奈', 161: '托腮', 162: '啵啵', 163: '糊脸',
            164: '拍头', 165: '扯一扯', 166: '舔一舔', 167: '蹭一蹭', 168: '捏一捏', 169: '摸头', 170: '捶一捶', 171: '掰一掰', 172: '戳一戳', 173: '拎一拎',
            174: '转一转', 175: '敲一敲', 176: '啾一啾', 177: '喷一喷', 178: '摇一摇', 179: '飞一飞', 180: '亲一亲', 181: '抱抱', 182: '比心', 183: '点赞',
            184: '心碎', 185: '香蕉', 186: '便便', 187: 'Qiang', 188: '弱', 189: '握手', 190: '胜利', 191: '抱拳', 192: '勾引', 193: '拳头',
            194: '差劲', 195: '爱你', 196: 'NO', 197: 'OK', 198: '爱情', 199: '飞吻', 200: '跳跳', 201: '发抖', 202: '怄火', 203: '转圈',
            204: '磕头', 205: '回头', 206: '跳绳', 207: '挥手', 208: '激动', 209: '街舞', 210: '献吻', 211: '左太极', 212: '右太极', 213: '双喜',
            214: '鞭炮', 215: '灯笼', 216: '发财', 217: 'K歌', 218: '购物', 219: '邮件', 220: '帅', 221: '喝彩', 222: '祈祷', 223: '爆筋',
            224: '棒棒糖', 225: '喝奶', 226: '下面条', 227: '香蕉', 228: '飞机', 229: '开车', 230: '左车头', 231: '车厢', 232: '右车头', 233: '多云',
            234: '下雨', 235: '钞票', 236: '熊猫', 237: '灯泡', 238: '风车', 239: '闹钟', 240: '打伞', 241: '彩球', 242: '钻戒', 243: '沙发',
            244: '纸巾', 245: '药', 246: '手枪', 247: '青蛙', 248: '吓', 249: '囧', 250: '笑脸', 251: '阴险', 252: '抓狂', 253: '吐舌',
            254: '喷血', 255: '无奈', 256: '卖萌', 257: '小纠结', 258: '拍桌', 259: '拍手', 260: '嘻嘻', 261: '笑哭', 262: 'doge', 263: '泪奔',
            264: '无奈', 265: '托腮', 266: '啵啵', 267: '糊脸', 268: '拍头', 269: '扯一扯', 270: '舔一舔', 271: '蹭一蹭', 272: '捏一捏', 273: '摸头',
            274: '捶一捶', 275: '掰一掰', 276: '戳一戳', 277: '拎一拎', 278: '转一转', 279: '敲一敲', 280: '啾一啾', 281: '喷一喷', 282: '摇一摇', 283: '飞一飞',
            284: '亲一亲', 285: '抱抱', 286: '比心', 287: '点赞', 288: '心碎', 289: '香蕉', 290: '便便', 291: 'Qiang', 292: '弱', 293: '握手',
            294: '胜利', 295: '抱拳', 296: '勾引', 297: '拳头', 298: '差劲', 299: '爱你', 300: 'NO', 301: 'OK', 302: '爱情', 303: '飞吻',
            304: '跳跳', 305: '发抖', 306: '怄火', 307: '转圈', 308: '磕头', 309: '回头', 310: '跳绳', 311: '挥手', 312: '激动', 313: '街舞',
            314: '献吻', 315: '左太极', 316: '右太极', 317: '双喜', 318: '鞭炮', 319: '灯笼', 320: '发财', 321: 'K歌', 322: '购物', 323: '邮件',
            324: '帅', 325: '喝彩', 326: '祈祷', 327: '爆筋', 328: '棒棒糖', 329: '喝奶', 330: '下面条', 331: '香蕉', 332: '飞机', 333: '开车',
            334: '左车头', 335: '车厢', 336: '右车头', 337: '多云', 338: '下雨', 339: '钞票', 340: '熊猫', 341: '灯泡', 342: '风车', 343: '闹钟',
            344: '打伞', 345: '彩球', 346: '钻戒', 347: '沙发', 348: '纸巾', 349: '药', 350: '手枪', 351: '青蛙', 352: '吓', 353: '囧',
            354: '笑脸', 355: '阴险', 356: '抓狂', 357: '吐舌', 358: '喷血', 359: '无奈', 360: '卖萌', 361: '小纠结', 362: '拍桌', 363: '拍手',
            364: '嘻嘻', 365: '笑哭', 366: 'doge', 367: '泪奔', 368: '无奈', 369: '托腮', 370: '啵啵', 371: '糊脸', 372: '拍头', 373: '扯一扯',
            374: '舔一舔', 375: '蹭一蹭', 376: '捏一捏', 377: '摸头', 378: '捶一捶', 379: '掰一掰', 380: '戳一戳', 381: '拎一拎', 382: '转一转', 383: '敲一敲',
            384: '啾一啾', 385: '喷一喷', 386: '摇一摇', 387: '飞一飞', 388: '亲一亲', 389: '抱抱', 390: '比心', 391: '点赞', 392: '心碎', 393: '香蕉',
            394: '便便', 395: 'Qiang', 396: '弱', 397: '握手', 398: '胜利', 399: '抱拳', 400: '勾引', 401: '拳头', 402: '差劲', 403: '爱你',
            404: 'NO', 405: 'OK', 406: '爱情', 407: '飞吻', 408: '跳跳', 409: '发抖', 410: '怄火', 411: '转圈', 412: '磕头', 413: '回头',
            414: '跳绳', 415: '挥手', 416: '激动', 417: '街舞', 418: '献吻', 419: '左太极', 420: '右太极'
        };
        return faceMap[faceId] || null;
    }

    buildAtPrefix(messageType, userId) {
        return messageType === 'group' ? `[CQ:at,qq=${userId}] ` : '';
    }

    async reply(messageType, groupId, userId, content) {
        const atPrefix = this.buildAtPrefix(messageType, userId);
        if (messageType === 'group') {
            await this.sendGroupMessage(groupId, atPrefix + content);
        } else {
            await this.sendPrivateMessage(userId, content);
        }
    }

    async replyImage(messageType, groupId, userId, imageUrl) {
        const atPrefix = this.buildAtPrefix(messageType, userId);
        const imageMsg = `${atPrefix}[CQ:image,file=${imageUrl}]`;
        if (messageType === 'group') {
            await this.sendGroupMessage(groupId, imageMsg);
        } else {
            await this.sendPrivateMessage(userId, imageMsg);
        }
    }

    async replyImageFile(messageType, groupId, userId, filePath) {
        const atPrefix = this.buildAtPrefix(messageType, userId);
        const base64 = fs.readFileSync(filePath).toString('base64');
        const imageMsg = `${atPrefix}[CQ:image,file=base64://${base64}]`;
        if (messageType === 'group') {
            await this.sendGroupMessage(groupId, imageMsg);
        } else {
            await this.sendPrivateMessage(userId, imageMsg);
        }
    }

    async replyVideoFile(messageType, groupId, userId, filePath) {
        const atPrefix = this.buildAtPrefix(messageType, userId);
        const base64 = fs.readFileSync(filePath).toString('base64');
        const videoMsg = `${atPrefix}[CQ:video,file=base64://${base64}]`;
        if (messageType === 'group') {
            await this.sendGroupMessage(groupId, videoMsg);
        } else {
            await this.sendPrivateMessage(userId, videoMsg);
        }
    }

    async logReply(messageType, userId, groupId, message, reply, triggerType) {
        await MessageLog.create({
            messageType,
            userId,
            groupId,
            message,
            reply,
            triggerType
        });
    }

    async replyVoiceFile(messageType, groupId, userId, filePath) {
        const atPrefix = this.buildAtPrefix(messageType, userId);
        const base64 = fs.readFileSync(filePath).toString('base64');
        const voiceMsg = `${atPrefix}[CQ:record,file=base64://${base64}]`;
        if (messageType === 'group') {
            await this.sendGroupMessage(groupId, voiceMsg);
        } else {
            await this.sendPrivateMessage(userId, voiceMsg);
        }
    }

    _getVoiceConfig(persona) {
        try {
            return JSON.parse(persona.voiceConfig || '{}');
        } catch (e) {
            return {};
        }
    }

    async checkKeywordReply(message) {
        const keywords = await KeywordReply.findAll({
            where: { enabled: 1 },
            order: [['priority', 'DESC']]
        });

        for (const kw of keywords) {
            if (kw.matchMode === 'exact' && message === kw.keyword) {
                return kw.replyContent;
            } else if (kw.matchMode === 'contains' && message.includes(kw.keyword)) {
                return kw.replyContent;
            } else if (kw.matchMode === 'regex') {
                try {
                    const regex = new RegExp(kw.keyword);
                    if (regex.test(message)) {
                        return kw.replyContent;
                    }
                } catch (e) {
                    // 忽略无效正则
                }
            }
        }
        return null;
    }

    async isPluginEnabled(pluginName) {
        const plugin = await PluginConfig.findOne({ where: { pluginName } });
        return plugin?.enabled === 1;
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
    }
}

module.exports = new OneBotClient();

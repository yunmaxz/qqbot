const { GroupSettings, BannedWord, ViolationLog, UserViolationStats, FloodCheckCache } = require('../models');
const { Op } = require('sequelize');

class GroupManagementService {
    constructor(oneBotService) {
        this.oneBotService = oneBotService;
        // 缓存群组设置，避免频繁查询数据库
        this.settingsCache = new Map();
        this.bannedWordsCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
    }

    // 获取群组设置（带缓存）
    async getGroupSettings(groupId) {
        const cacheKey = `settings_${groupId}`;
        const cached = this.settingsCache.get(cacheKey);
        
        if (cached && Date.now() - cached.time < this.cacheTimeout) {
            return cached.data;
        }

        let settings = await GroupSettings.findOne({ where: { groupId } });
        if (!settings) {
            settings = await GroupSettings.create({ groupId });
        }

        this.settingsCache.set(cacheKey, { data: settings, time: Date.now() });
        return settings;
    }

    // 获取违禁词列表（带缓存）
    async getBannedWords(groupId) {
        const cacheKey = `words_${groupId}`;
        const cached = this.bannedWordsCache.get(cacheKey);
        
        if (cached && Date.now() - cached.time < this.cacheTimeout) {
            return cached.data;
        }

        const words = await BannedWord.findAll({
            where: {
                [Op.or]: [
                    { groupId },
                    { groupId: 'all' }
                ],
                enabled: 1
            }
        });

        this.bannedWordsCache.set(cacheKey, { data: words, time: Date.now() });
        return words;
    }

    // 清除缓存
    clearCache(groupId) {
        this.settingsCache.delete(`settings_${groupId}`);
        this.bannedWordsCache.delete(`words_${groupId}`);
    }

    // 检查用户是否在白名单
    isUserWhitelisted(settings, userId) {
        const whitelist = settings.whitelist || [];
        return whitelist.includes(String(userId));
    }

    // 检查违禁词
    async checkBannedWords(groupId, message, userId, sender) {
        const settings = await this.getGroupSettings(groupId);
        
        console.log(`[群管] 群设置: enabled=${settings.enabled}, banWordEnabled=${settings.banWordEnabled}`);
        
        if (!settings.enabled || !settings.banWordEnabled) {
            console.log(`[群管] 群管功能未启用`);
            return null;
        }

        if (this.isUserWhitelisted(settings, userId)) {
            return null;
        }

        const bannedWords = await this.getBannedWords(groupId);
        const messageText = this.extractMessageText(message);

        for (const word of bannedWords) {
            const matched = this.matchWord(messageText, word.word, word.matchType);
            if (matched) {
                return {
                    type: 'banned_word',
                    word: word.word,
                    muteDuration: word.muteDuration || settings.banWordMuteDuration
                };
            }
        }

        return null;
    }

    // 匹配违禁词
    matchWord(text, word, matchType) {
        try {
            switch (matchType) {
                case 'exact':
                    return text === word;
                case 'regex':
                    const regex = new RegExp(word, 'i');
                    return regex.test(text);
                case 'contains':
                default:
                    return text.includes(word);
            }
        } catch (e) {
            console.error('违禁词匹配错误:', e);
            return text.includes(word);
        }
    }

    // 检查刷屏
    async checkFlood(groupId, userId, sender) {
        const settings = await this.getGroupSettings(groupId);
        
        if (!settings.enabled || !settings.floodEnabled) {
            return null;
        }

        if (this.isUserWhitelisted(settings, userId)) {
            return null;
        }

        const timeWindow = settings.floodTimeWindow; // 秒
        const messageCount = settings.floodMessageCount; // 消息数量阈值

        // 清理过期记录
        const cutoffTime = new Date(Date.now() - timeWindow * 1000);
        await FloodCheckCache.destroy({
            where: {
                groupId,
                userId,
                messageTime: { [Op.lt]: cutoffTime }
            }
        });

        // 记录当前消息
        await FloodCheckCache.create({
            groupId,
            userId,
            messageTime: new Date()
        });

        // 统计时间窗口内的消息数
        const count = await FloodCheckCache.count({
            where: {
                groupId,
                userId,
                messageTime: { [Op.gte]: cutoffTime }
            }
        });

        if (count >= messageCount) {
            return {
                type: 'flood',
                muteDuration: settings.floodMuteDuration
            };
        }

        return null;
    }

    // 检查长消息
    async checkLongMessage(groupId, message, userId, sender) {
        const settings = await this.getGroupSettings(groupId);
        
        if (!settings.enabled || !settings.longMsgEnabled) {
            return null;
        }

        if (this.isUserWhitelisted(settings, userId)) {
            return null;
        }

        const messageText = this.extractMessageText(message);
        
        // 计算消息长度
        const charLength = messageText.length;
        const byteLength = Buffer.byteLength(messageText, 'utf8');
        const lineCount = messageText.split('\n').length;

        // 检查是否超过限制
        const isLong = charLength > settings.longMsgMaxLength ||
                      byteLength > settings.longMsgMaxBytes ||
                      lineCount > settings.longMsgMaxLines;

        if (isLong) {
            return {
                type: 'long_msg',
                muteDuration: settings.longMsgMuteDuration,
                details: {
                    charLength,
                    byteLength,
                    lineCount
                }
            };
        }

        return null;
    }

    // 提取消息文本
    extractMessageText(message) {
        if (typeof message === 'string') {
            return message;
        }
        if (Array.isArray(message)) {
            return message
                .filter(item => item.type === 'text')
                .map(item => item.data?.text || '')
                .join('');
        }
        return '';
    }

    // 处理违规
    async handleViolation(groupId, userId, sender, violation, message, event) {
        const settings = await this.getGroupSettings(groupId);
        const muteDuration = violation.muteDuration;
        const muteSeconds = muteDuration * 60;

        // 记录违规日志
        await ViolationLog.create({
            groupId,
            userId,
            userNickname: sender?.nickname || sender?.card || '',
            violationType: violation.type,
            violationContent: this.extractMessageText(message).substring(0, 500),
            wordMatched: violation.word || null,
            muteDuration,
            messageRecalled: 1
        });

        // 更新用户违规统计
        await this.updateUserViolationStats(groupId, userId, violation.type);

        // 撤回消息 (跳过群主和管理员，因为机器人没有权限)
        const senderRole = sender?.role || 'member';
        if (event.message_id && senderRole === 'member') {
            console.log(`[群管] 撤回消息, message_id: ${event.message_id}`);
            const msgId = parseInt(event.message_id);
            if (!isNaN(msgId)) {
                this.oneBotService.send({
                    action: 'delete_msg',
                    params: { message_id: msgId }
                });
            }
        } else if (senderRole !== 'member') {
            console.log(`[群管] 跳过撤回 - 用户身份: ${senderRole}`);
        }

        // 禁言用户
        this.oneBotService.send({
            action: 'set_group_ban',
            params: {
                group_id: groupId,
                user_id: parseInt(userId),
                duration: muteSeconds
            }
        });

        // 检查是否需要踢出
        if (violation.type === 'banned_word' && settings.banWordAutoKick) {
            const stats = await UserViolationStats.findOne({
                where: { groupId, userId }
            });
            
            if (stats && stats.bannedWordCount >= settings.banWordKickThreshold) {
                // 踢出用户
                this.oneBotService.send({
                    action: 'set_group_kick',
                    params: {
                        group_id: groupId,
                        user_id: parseInt(userId),
                        reject_add_request: false
                    }
                });

                // 更新日志
                await ViolationLog.update(
                    { kicked: 1 },
                    { where: { id: (await ViolationLog.findOne({ order: [['id', 'DESC']] })).id } }
                );

                // 发送通知
                this.oneBotService.send({
                    action: 'send_group_msg',
                    params: {
                        group_id: groupId,
                        message: `用户 ${userId} 因多次违规已被移出群聊`
                    }
                });
            }
        }

        // 发送警告
        const violationNames = {
            'banned_word': '发送违禁词',
            'flood': '刷屏',
            'long_msg': '发送长消息'
        };

        this.oneBotService.send({
            action: 'send_group_msg',
            params: {
                group_id: groupId,
                message: `用户 ${sender?.nickname || userId} 因${violationNames[violation.type]}被禁言${muteDuration}分钟`
            }
        });
    }

    // 更新用户违规统计
    async updateUserViolationStats(groupId, userId, violationType) {
        const [stats, created] = await UserViolationStats.findOrCreate({
            where: { groupId, userId },
            defaults: {
                bannedWordCount: violationType === 'banned_word' ? 1 : 0,
                floodCount: violationType === 'flood' ? 1 : 0,
                longMsgCount: violationType === 'long_msg' ? 1 : 0,
                totalCount: 1,
                lastViolationAt: new Date()
            }
        });

        if (!created) {
            const updateData = {
                totalCount: stats.totalCount + 1,
                lastViolationAt: new Date()
            };
            
            if (violationType === 'banned_word') {
                updateData.bannedWordCount = stats.bannedWordCount + 1;
            } else if (violationType === 'flood') {
                updateData.floodCount = stats.floodCount + 1;
            } else if (violationType === 'long_msg') {
                updateData.longMsgCount = stats.longMsgCount + 1;
            }

            await stats.update(updateData);
        }
    }

    // 处理消息（主入口）
    async processMessage(event) {
        const { group_id, user_id, message, sender, message_id } = event;

        console.log(`[群管] 处理消息 - 群:${group_id} 用户:${user_id}`);
        console.log(`[群管] 完整 event:`, JSON.stringify(event, null, 2));

        // 检查违禁词
        const bannedWordViolation = await this.checkBannedWords(group_id, message, user_id, sender);
        if (bannedWordViolation) {
            console.log(`[群管] 检测到违禁词: ${bannedWordViolation.word}`);
            await this.handleViolation(group_id, user_id, sender, bannedWordViolation, message, event);
            return true; // 已处理违规
        }

        // 检查刷屏
        const floodViolation = await this.checkFlood(group_id, user_id, sender);
        if (floodViolation) {
            console.log(`[群管] 检测到刷屏`);
            await this.handleViolation(group_id, user_id, sender, floodViolation, message, event);
            return true;
        }

        // 检查长消息
        const longMsgViolation = await this.checkLongMessage(group_id, message, user_id, sender);
        if (longMsgViolation) {
            console.log(`[群管] 检测到长消息`);
            await this.handleViolation(group_id, user_id, sender, longMsgViolation, message, event);
            return true;
        }

        return false; // 无违规
    }
}

module.exports = GroupManagementService;

/**
 * 主动消息服务 - AI 人设主动私聊调度
 * Copyright (c) 2025 云码小栈 <https://yunmaxz.com>
 */
const aiService = require('./aiService');
const ttsService = require('./ttsService');
const { AiPersona, PersonaBinding } = require('../models');

class ProactiveService {
    constructor() {
        // 「收到消息后」模式：userId -> timer
        this.userTimers = new Map();
        // 「全天随机」模式：personaId -> timer
        this.personaTimers = new Map();
        // 保存 oneBotService 引用，供 persona 更新后重初始化
        this._oneBotService = null;
    }

    // ─────────────────────────────────────────────
    // 模式一：收到私聊消息后触发（针对当前用户）
    // ─────────────────────────────────────────────
    scheduleAfterMessage(userId, persona, oneBotService) {
        const config = this._parseConfig(persona);
        if (!config.proactiveEnabled || config.proactiveMode !== 'after_message') return;

        this.cancelUser(userId);

        const delay = this._randomDelay(config);
        const minStr = Math.round(delay / 60000);
        console.log(`[主动消息] 用户${userId} 定时器已设置，将在 ${minStr} 分钟后触发（概率 ${Math.round((config.proactiveProbability ?? 0.3) * 100)}%）`);

        const timer = setTimeout(async () => {
            this.userTimers.delete(userId);
            if (!this._hit(config.proactiveProbability)) {
                console.log(`[主动消息] 用户${userId} 概率未命中，跳过本次`);
                return;
            }
            await this._sendProactive(userId, persona, config, oneBotService);
        }, delay);

        this.userTimers.set(userId, timer);
    }

    // ─────────────────────────────────────────────
    // 模式二：全天随机，随机挑绑定的私聊用户发送
    // bot 连接成功 / persona 保存后调用
    // ─────────────────────────────────────────────
    async initAllDayPersonas(oneBotService) {
        this._oneBotService = oneBotService;

        // 清掉旧定时器
        for (const t of this.personaTimers.values()) clearTimeout(t);
        this.personaTimers.clear();

        const personas = await AiPersona.findAll({ where: { enabled: 1 } });
        for (const persona of personas) {
            const config = this._parseConfig(persona);
            if (config.proactiveEnabled && config.proactiveMode === 'all_day') {
                this._scheduleAllDay(persona, config, oneBotService);
            }
        }
        console.log(`[主动消息] 全天随机模式已初始化，共 ${this.personaTimers.size} 个人设`);
    }

    // persona 保存/更新后调用，重新加载该人设的定时器
    async reloadPersona(personaId) {
        if (!this._oneBotService) return;

        // 取消该人设旧定时器
        this.cancelPersona(personaId);

        const persona = await AiPersona.findOne({ where: { id: personaId, enabled: 1 } });
        if (!persona) return;

        const config = this._parseConfig(persona);
        if (config.proactiveEnabled && config.proactiveMode === 'all_day') {
            this._scheduleAllDay(persona, config, this._oneBotService);
            console.log(`[主动消息] 人设 [${persona.name}] 已重新加载全天随机定时器`);
        }
    }

    _scheduleAllDay(persona, config, oneBotService) {
        const delay = this._randomDelay(config);
        const minStr = Math.round(delay / 60000);
        console.log(`[主动消息] 人设 [${persona.name}] 全天随机定时器已设置，将在 ${minStr} 分钟后触发（概率 ${Math.round((config.proactiveProbability ?? 0.3) * 100)}%）`);

        const timer = setTimeout(async () => {
            this.personaTimers.delete(persona.id);

            if (this._hit(config.proactiveProbability)) {
                const userId = await this._pickRandomBoundUser(persona.id);
                if (userId) {
                    console.log(`[主动消息] 人设 [${persona.name}] 命中，向用户 ${userId} 发送主动消息`);
                    await this._sendProactive(userId, persona, config, oneBotService);
                } else {
                    console.log(`[主动消息] 人设 [${persona.name}] 命中，但没有绑定的私聊用户，跳过`);
                }
            } else {
                console.log(`[主动消息] 人设 [${persona.name}] 概率未命中，跳过本次`);
            }

            // 无论是否触发，安排下一次
            const freshPersona = await AiPersona.findByPk(persona.id);
            if (freshPersona && freshPersona.enabled) {
                const freshConfig = this._parseConfig(freshPersona);
                if (freshConfig.proactiveEnabled && freshConfig.proactiveMode === 'all_day') {
                    this._scheduleAllDay(freshPersona, freshConfig, oneBotService);
                }
            }
        }, delay);

        this.personaTimers.set(persona.id, timer);
    }

    // ─────────────────────────────────────────────
    // 发语音回复（给 oneBotService AI 回复用）
    // ─────────────────────────────────────────────
    async sendVoiceReply(text, voiceName, messageType, groupId, userId, oneBotService) {
        await this._sendVoice(text, voiceName, messageType, groupId, userId, oneBotService);
    }

    // ─────────────────────────────────────────────
    // 取消
    // ─────────────────────────────────────────────
    cancelUser(userId) {
        if (this.userTimers.has(userId)) {
            clearTimeout(this.userTimers.get(userId));
            this.userTimers.delete(userId);
        }
    }

    cancelPersona(personaId) {
        if (this.personaTimers.has(personaId)) {
            clearTimeout(this.personaTimers.get(personaId));
            this.personaTimers.delete(personaId);
        }
    }

    // ─────────────────────────────────────────────
    // 内部工具
    // ─────────────────────────────────────────────
    async _sendProactive(userId, persona, config, oneBotService) {
        try {
            const prompt = config.proactivePrompt
                || '用一句话表达你想念用户，不超过15个字，温柔甜蜜，像发微信语音前想说的话';

            const text = await aiService.chat(prompt, userId, null, persona);
            if (!text || text.includes('不可用') || text.includes('失败')) return;

            console.log(`[主动消息] → 用户${userId}：${text}`);

            const useVoice = persona.voiceEnabled && config.voiceName;
            if (useVoice) {
                await this._sendVoice(text, config.voiceName, 'private', null, userId, oneBotService);
            } else {
                await oneBotService.sendPrivateMessage(userId, text);
            }
        } catch (e) {
            console.error('[主动消息] 发送失败:', e.message);
        }
    }

    async _sendVoice(text, voiceName, messageType, groupId, userId, oneBotService) {
        let filePath = null;
        try {
            filePath = await ttsService.textToVoice(text, voiceName);
            await oneBotService.replyVoiceFile(messageType, groupId, userId, filePath);
        } catch (e) {
            console.error('[语音发送] 失败，回退文字:', e.message);
            if (messageType === 'private') {
                await oneBotService.sendPrivateMessage(userId, text);
            } else {
                await oneBotService.sendGroupMessage(groupId, text);
            }
        } finally {
            ttsService.cleanup(filePath);
        }
    }

    async _pickRandomBoundUser(personaId) {
        const bindings = await PersonaBinding.findAll({
            where: { personaId, bindType: 'private', enabled: 1 }
        });
        if (!bindings.length) return null;
        const picked = bindings[Math.floor(Math.random() * bindings.length)];
        return Number(picked.bindTarget);
    }

    _randomDelay(config) {
        const minMs = (config.proactiveMinDelay ?? 30) * 60 * 1000;
        const maxMs = (config.proactiveMaxDelay ?? 180) * 60 * 1000;
        return minMs + Math.random() * (maxMs - minMs);
    }

    _hit(probability) {
        return Math.random() < (probability ?? 0.3);
    }

    _parseConfig(persona) {
        try {
            return JSON.parse(persona.voiceConfig || '{}');
        } catch (e) {
            return {};
        }
    }
}

module.exports = new ProactiveService();

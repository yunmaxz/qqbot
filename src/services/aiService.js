const axios = require('axios');
const { ChatContext, AiProvider } = require('../models');

class AiService {
    async chat(message, userId, groupId, persona) {
        try {
            let provider = persona.AiProvider;
            if (!provider) {
                provider = await AiProvider.findByPk(persona.chatProviderId || persona.providerId);
            }
            if (!provider || !provider.enabled) {
                return 'AI接口未配置或已禁用';
            }

            const context = await this.getContext(userId, groupId, persona.id, provider.maxTokens ? Math.floor(provider.maxTokens / 50) : 10);

            const messages = [];

            if (persona.systemPrompt) {
                messages.push({
                    role: 'system',
                    content: persona.systemPrompt
                });
            }

            messages.push(...context);
            messages.push({
                role: 'user',
                content: message
            });

            const response = await axios.post(provider.apiUrl, {
                model: provider.model,
                messages: messages,
                temperature: parseFloat(provider.temperature),
                max_tokens: provider.maxTokens
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${provider.apiKey}`
                },
                timeout: 30000
            });

            const reply = response.data.choices[0].message.content;

            await this.saveContext(userId, groupId, persona.id, 'user', message);
            await this.saveContext(userId, groupId, persona.id, 'assistant', reply);

            return reply;
        } catch (error) {
            console.error('[AI] 对话失败:', error.response?.data || error.message);
            return 'AI服务暂时不可用，请稍后再试。';
        }
    }

    async getContext(userId, groupId, personaId, maxContext) {
        const contexts = await ChatContext.findAll({
            where: {
                userId: userId,
                groupId: groupId || null,
                personaId: personaId
            },
            order: [['created_at', 'DESC']],
            limit: maxContext
        });

        return contexts.reverse().map(ctx => ({
            role: ctx.role,
            content: ctx.content
        }));
    }

    async saveContext(userId, groupId, personaId, role, content) {
        await ChatContext.create({
            userId,
            groupId,
            personaId,
            role,
            content
        });
    }

    async clearContext(userId, groupId, personaId) {
        await ChatContext.destroy({
            where: {
                userId,
                groupId: groupId || null,
                personaId: personaId || null
            }
        });
    }
}

module.exports = new AiService();

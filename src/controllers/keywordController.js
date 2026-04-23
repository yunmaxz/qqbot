const { KeywordReply } = require('../models');

class KeywordController {
    async list(req, res) {
        try {
            const { page = 1, pageSize = 20, keyword } = req.query;
            
            const where = {};
            if (keyword) {
                where.keyword = { [require('sequelize').Op.like]: `%${keyword}%` };
            }

            const { count, rows } = await KeywordReply.findAndCountAll({
                where,
                order: [['priority', 'DESC'], ['createdAt', 'DESC']],
                limit: parseInt(pageSize),
                offset: (parseInt(page) - 1) * parseInt(pageSize)
            });

            res.json({
                code: 200,
                data: {
                    list: rows,
                    total: count,
                    page: parseInt(page),
                    pageSize: parseInt(pageSize)
                }
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: '获取关键词列表失败',
                error: error.message
            });
        }
    }

    async create(req, res) {
        try {
            const { keyword, replyContent, replyType, matchMode, enabled, priority } = req.body;
            
            if (!keyword || !replyContent) {
                return res.status(400).json({
                    code: 400,
                    message: '关键词和回复内容不能为空'
                });
            }

            const reply = await KeywordReply.create({
                keyword,
                replyContent,
                replyType: replyType || 'text',
                matchMode: matchMode || 'contains',
                enabled: enabled !== undefined ? enabled : 1,
                priority: priority || 0
            });

            res.json({
                code: 200,
                message: '创建成功',
                data: reply
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: '创建关键词失败',
                error: error.message
            });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const data = req.body;
            
            const reply = await KeywordReply.findByPk(id);
            if (!reply) {
                return res.status(404).json({
                    code: 404,
                    message: '关键词不存在'
                });
            }

            await reply.update(data);
            
            res.json({
                code: 200,
                message: '更新成功',
                data: reply
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: '更新关键词失败',
                error: error.message
            });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            
            const reply = await KeywordReply.findByPk(id);
            if (!reply) {
                return res.status(404).json({
                    code: 404,
                    message: '关键词不存在'
                });
            }

            await reply.destroy();
            
            res.json({
                code: 200,
                message: '删除成功'
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: '删除关键词失败',
                error: error.message
            });
        }
    }

    async toggle(req, res) {
        try {
            const { id } = req.params;
            
            const reply = await KeywordReply.findByPk(id);
            if (!reply) {
                return res.status(404).json({
                    code: 404,
                    message: '关键词不存在'
                });
            }

            await reply.update({ enabled: reply.enabled ? 0 : 1 });
            
            res.json({
                code: 200,
                message: '切换成功',
                data: reply
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: '切换状态失败',
                error: error.message
            });
        }
    }
}

module.exports = new KeywordController();

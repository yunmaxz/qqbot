const { MessageLog } = require('../models');
const { Op } = require('sequelize');

class LogController {
    async list(req, res) {
        try {
            const { page = 1, pageSize = 20, messageType, userId, groupId, triggerType } = req.query;
            
            const where = {};
            if (messageType) where.messageType = messageType;
            if (userId) where.userId = userId;
            if (groupId) where.groupId = groupId;
            if (triggerType) where.triggerType = triggerType;

            const { count, rows } = await MessageLog.findAndCountAll({
                where,
                order: [['createdAt', 'DESC']],
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
                message: '获取日志失败',
                error: error.message
            });
        }
    }

    async stats(req, res) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const totalMessages = await MessageLog.count();
            const todayMessages = await MessageLog.count({
                where: {
                    createdAt: {
                        [Op.gte]: today
                    }
                }
            });

            const aiMessages = await MessageLog.count({
                where: { triggerType: 'ai' }
            });

            const keywordMessages = await MessageLog.count({
                where: { triggerType: 'keyword' }
            });

            const groupMessages = await MessageLog.count({
                where: { messageType: 'group' }
            });

            const privateMessages = await MessageLog.count({
                where: { messageType: 'private' }
            });

            res.json({
                code: 200,
                data: {
                    totalMessages,
                    todayMessages,
                    aiMessages,
                    keywordMessages,
                    groupMessages,
                    privateMessages
                }
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: '获取统计失败',
                error: error.message
            });
        }
    }

    async clear(req, res) {
        try {
            const { days } = req.body;
            
            if (!days || days < 1) {
                return res.status(400).json({
                    code: 400,
                    message: '请指定保留天数'
                });
            }

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            const deleted = await MessageLog.destroy({
                where: {
                    createdAt: {
                        [Op.lt]: cutoffDate
                    }
                }
            });

            res.json({
                code: 200,
                message: `已清理 ${deleted} 条日志`,
                data: { deleted }
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: '清理日志失败',
                error: error.message
            });
        }
    }
}

module.exports = new LogController();

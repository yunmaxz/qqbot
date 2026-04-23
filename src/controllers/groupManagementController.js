const { GroupSettings, BannedWord, ViolationLog, UserViolationStats, FloodCheckCache, GroupConfig } = require('../models');
const { Op } = require('sequelize');

class GroupManagementController {
    // 获取群组列表
    async getGroupList(req, res) {
        try {
            const { page = 1, pageSize = 20, keyword = '' } = req.query;
            const offset = (page - 1) * pageSize;

            // 从GroupConfig获取群组列表
            const where = {};
            if (keyword) {
                where.groupId = { [Op.like]: `%${keyword}%` };
            }

            const { count, rows: groups } = await GroupConfig.findAndCountAll({
                where,
                limit: parseInt(pageSize),
                offset: parseInt(offset),
                order: [['updatedAt', 'DESC']]
            });

            // 获取每个群组的设置
            const groupIds = groups.map(g => g.groupId);
            const settings = await GroupSettings.findAll({
                where: { groupId: groupIds }
            });
            const settingsMap = new Map(settings.map(s => [s.groupId, s]));

            const result = groups.map(g => ({
                groupId: g.groupId,
                groupName: g.groupName || g.groupId,
                enabled: settingsMap.get(g.groupId)?.enabled ?? 1,
                settings: settingsMap.get(g.groupId) || null
            }));

            res.json({
                code: 0,
                data: {
                    list: result,
                    total: count,
                    page: parseInt(page),
                    pageSize: parseInt(pageSize)
                }
            });
        } catch (error) {
            console.error('获取群组列表失败:', error);
            res.status(500).json({ code: -1, message: '获取群组列表失败' });
        }
    }

    // 获取群组设置
    async getGroupSettings(req, res) {
        try {
            const { groupId } = req.params;

            let settings = await GroupSettings.findOne({
                where: { groupId }
            });

            if (!settings) {
                // 创建默认设置
                settings = await GroupSettings.create({ groupId });
            }

            // 获取违禁词列表
            const bannedWords = await BannedWord.findAll({
                where: {
                    [Op.or]: [
                        { groupId },
                        { groupId: 'all' }
                    ],
                    enabled: 1
                },
                order: [['created_at', 'DESC']]
            });

            res.json({
                code: 0,
                data: {
                    settings,
                    bannedWords
                }
            });
        } catch (error) {
            console.error('获取群组设置失败:', error);
            res.status(500).json({ code: -1, message: '获取群组设置失败' });
        }
    }

    // 更新群组设置
    async updateGroupSettings(req, res) {
        try {
            const { groupId } = req.params;
            const updateData = req.body;

            let settings = await GroupSettings.findOne({ where: { groupId } });

            if (settings) {
                await settings.update(updateData);
            } else {
                settings = await GroupSettings.create({
                    groupId,
                    ...updateData
                });
            }

            res.json({
                code: 0,
                message: '设置已更新',
                data: settings
            });
        } catch (error) {
            console.error('更新群组设置失败:', error);
            res.status(500).json({ code: -1, message: '更新群组设置失败' });
        }
    }

    // 添加违禁词
    async addBannedWord(req, res) {
        try {
            const { groupId } = req.params;
            const { word, matchType = 'contains', muteDuration = null } = req.body;

            if (!word || !word.trim()) {
                return res.status(400).json({ code: -1, message: '违禁词不能为空' });
            }

            const [bannedWord, created] = await BannedWord.findOrCreate({
                where: { groupId, word: word.trim() },
                defaults: {
                    matchType,
                    muteDuration,
                    enabled: 1
                }
            });

            if (!created) {
                await bannedWord.update({ matchType, muteDuration, enabled: 1 });
            }

            res.json({
                code: 0,
                message: '违禁词已添加',
                data: bannedWord
            });
        } catch (error) {
            console.error('添加违禁词失败:', error);
            res.status(500).json({ code: -1, message: '添加违禁词失败' });
        }
    }

    // 删除违禁词
    async deleteBannedWord(req, res) {
        try {
            const { id } = req.params;

            await BannedWord.destroy({ where: { id } });

            res.json({
                code: 0,
                message: '违禁词已删除'
            });
        } catch (error) {
            console.error('删除违禁词失败:', error);
            res.status(500).json({ code: -1, message: '删除违禁词失败' });
        }
    }

    // 更新违禁词
    async updateBannedWord(req, res) {
        try {
            const { id } = req.params;
            const { word, matchType, muteDuration, enabled } = req.body;

            const bannedWord = await BannedWord.findByPk(id);
            if (!bannedWord) {
                return res.status(404).json({ code: -1, message: '违禁词不存在' });
            }

            await bannedWord.update({
                word: word || bannedWord.word,
                matchType: matchType || bannedWord.matchType,
                muteDuration: muteDuration !== undefined ? muteDuration : bannedWord.muteDuration,
                enabled: enabled !== undefined ? enabled : bannedWord.enabled
            });

            res.json({
                code: 0,
                message: '违禁词已更新',
                data: bannedWord
            });
        } catch (error) {
            console.error('更新违禁词失败:', error);
            res.status(500).json({ code: -1, message: '更新违禁词失败' });
        }
    }

    // 获取违规记录
    async getViolationLogs(req, res) {
        try {
            const { groupId, userId, violationType, page = 1, pageSize = 20 } = req.query;
            const offset = (page - 1) * pageSize;

            const where = {};
            if (groupId) where.groupId = groupId;
            if (userId) where.userId = userId;
            if (violationType) where.violationType = violationType;

            const { count, rows: logs } = await ViolationLog.findAndCountAll({
                where,
                limit: parseInt(pageSize),
                offset: parseInt(offset),
                order: [['created_at', 'DESC']]
            });

            res.json({
                code: 0,
                data: {
                    list: logs,
                    total: count,
                    page: parseInt(page),
                    pageSize: parseInt(pageSize)
                }
            });
        } catch (error) {
            console.error('获取违规记录失败:', error);
            res.status(500).json({ code: -1, message: '获取违规记录失败' });
        }
    }

    // 获取用户违规统计
    async getUserViolationStats(req, res) {
        try {
            const { groupId } = req.params;
            const { page = 1, pageSize = 20 } = req.query;
            const offset = (page - 1) * pageSize;

            const { count, rows: stats } = await UserViolationStats.findAndCountAll({
                where: { groupId },
                limit: parseInt(pageSize),
                offset: parseInt(offset),
                order: [['totalCount', 'DESC']]
            });

            res.json({
                code: 0,
                data: {
                    list: stats,
                    total: count,
                    page: parseInt(page),
                    pageSize: parseInt(pageSize)
                }
            });
        } catch (error) {
            console.error('获取用户违规统计失败:', error);
            res.status(500).json({ code: -1, message: '获取用户违规统计失败' });
        }
    }

    // 清空用户违规记录
    async clearUserViolations(req, res) {
        try {
            const { groupId, userId } = req.params;

            await UserViolationStats.destroy({
                where: { groupId, userId }
            });

            await ViolationLog.destroy({
                where: { groupId, userId }
            });

            res.json({
                code: 0,
                message: '违规记录已清空'
            });
        } catch (error) {
            console.error('清空违规记录失败:', error);
            res.status(500).json({ code: -1, message: '清空违规记录失败' });
        }
    }

    // 添加白名单用户
    async addWhitelistUser(req, res) {
        try {
            const { groupId } = req.params;
            const { userId } = req.body;

            let settings = await GroupSettings.findOne({ where: { groupId } });
            if (!settings) {
                settings = await GroupSettings.create({ groupId });
            }

            const whitelist = settings.whitelist || [];
            if (!whitelist.includes(userId)) {
                whitelist.push(userId);
                await settings.update({ whitelist });
            }

            res.json({
                code: 0,
                message: '已添加到白名单',
                data: whitelist
            });
        } catch (error) {
            console.error('添加白名单失败:', error);
            res.status(500).json({ code: -1, message: '添加白名单失败' });
        }
    }

    // 移除白名单用户
    async removeWhitelistUser(req, res) {
        try {
            const { groupId, userId } = req.params;

            let settings = await GroupSettings.findOne({ where: { groupId } });
            if (!settings) {
                return res.status(404).json({ code: -1, message: '群组设置不存在' });
            }

            const whitelist = (settings.whitelist || []).filter(id => id !== userId);
            await settings.update({ whitelist });

            res.json({
                code: 0,
                message: '已从白名单移除',
                data: whitelist
            });
        } catch (error) {
            console.error('移除白名单失败:', error);
            res.status(500).json({ code: -1, message: '移除白名单失败' });
        }
    }
}

module.exports = new GroupManagementController();

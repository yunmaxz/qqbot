const { GroupConfig, GroupMute, GroupPluginMenu, PluginConfig } = require('../models');

class GroupController {
    async list(req, res) {
        try {
            const groups = await GroupConfig.findAll({
                order: [['createdAt', 'DESC']]
            });
            res.json({
                code: 200,
                data: groups
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: '获取群组列表失败',
                error: error.message
            });
        }
    }

    async create(req, res) {
        try {
            const group = await GroupConfig.create(req.body);
            res.json({
                code: 200,
                data: group,
                message: '添加成功'
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: '添加群组失败',
                error: error.message
            });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const group = await GroupConfig.findByPk(id);
            if (!group) {
                return res.status(404).json({
                    code: 404,
                    message: '群组不存在'
                });
            }
            await group.update(req.body);
            res.json({
                code: 200,
                data: group,
                message: '更新成功'
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: '更新群组失败',
                error: error.message
            });
        }
    }

    async remove(req, res) {
        try {
            const { id } = req.params;
            const group = await GroupConfig.findByPk(id);
            if (!group) {
                return res.status(404).json({
                    code: 404,
                    message: '群组不存在'
                });
            }
            await group.destroy();
            res.json({
                code: 200,
                message: '删除成功'
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: '删除群组失败',
                error: error.message
            });
        }
    }

    async toggle(req, res) {
        try {
            const { id } = req.params;
            const { enabled } = req.body;
            const group = await GroupConfig.findByPk(id);
            if (!group) {
                return res.status(404).json({
                    code: 404,
                    message: '群组不存在'
                });
            }
            group.enabled = enabled ? 1 : 0;
            await group.save();
            res.json({
                code: 200,
                message: '更新成功'
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: '更新失败',
                error: error.message
            });
        }
    }

    async getMutes(req, res) {
        try {
            const { groupId } = req.params;
            console.log(`[API] 获取禁言列表, groupId: ${groupId}`);
            const mutes = await GroupMute.findAll({
                where: { groupId },
                order: [['created_at', 'DESC']]
            });
            console.log(`[API] 获取到 ${mutes.length} 条禁言记录`);
            res.json({
                code: 200,
                data: mutes
            });
        } catch (error) {
            console.error(`[API] 获取禁言列表失败:`, error);
            res.status(500).json({
                code: 500,
                message: '获取禁言列表失败',
                error: error.message
            });
        }
    }

    async addMute(req, res) {
        try {
            const { groupId } = req.params;
            const { userId, duration } = req.body;
            const mute = await GroupMute.create({ groupId, userId, duration });
            res.json({
                code: 200,
                data: mute,
                message: '禁言成功'
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: '禁言失败',
                error: error.message
            });
        }
    }

    async removeMute(req, res) {
        try {
            const { muteId } = req.params;
            const mute = await GroupMute.findByPk(muteId);
            if (!mute) {
                return res.status(404).json({
                    code: 404,
                    message: '记录不存在'
                });
            }
            await mute.destroy();
            res.json({
                code: 200,
                message: '解除成功'
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: '解除失败',
                error: error.message
            });
        }
    }

    async getMenu(req, res) {
        try {
            const { groupId } = req.params;
            const gid = parseInt(groupId, 10);
            const plugins = await PluginConfig.findAll({
                order: [['id', 'ASC']]
            });
            const menuItems = await GroupPluginMenu.findAll({
                where: { groupId: gid }
            });
            const menuMap = {};
            menuItems.forEach(item => {
                menuMap[item.pluginName] = item.enabled === 1 || item.enabled === '1' ? 1 : 0;
            });
            const result = plugins.map(plugin => ({
                pluginName: plugin.pluginName,
                pluginDesc: plugin.pluginDesc,
                enabled: menuMap[plugin.pluginName] === 1 ? 1 : 0
            }));
            res.json({
                code: 200,
                data: result
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: '获取菜单列表失败',
                error: error.message
            });
        }
    }

    async saveMenu(req, res) {
        try {
            const { groupId } = req.params;
            const gid = parseInt(groupId, 10);
            if (isNaN(gid)) {
                return res.status(400).json({ code: 400, message: '无效的群号' });
            }
            const { menus } = req.body;
            if (!Array.isArray(menus) || menus.length === 0) {
                return res.json({ code: 200, message: '保存成功（无菜单项）' });
            }
            for (const item of menus) {
                await GroupPluginMenu.upsert({
                    groupId: gid,
                    pluginName: item.pluginName,
                    enabled: item.enabled ? 1 : 0
                });
            }
            res.json({
                code: 200,
                message: '保存成功'
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: '保存菜单失败',
                error: error.message
            });
        }
    }
}

module.exports = new GroupController();

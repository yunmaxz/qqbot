const { BotConfig, AiConfig, PluginConfig } = require('../models');

class BotController {
    async getConfigs(req, res) {
        try {
            const configs = await BotConfig.findAll();
            const aiConfig = await AiConfig.findOne();
            const plugins = await PluginConfig.findAll();
            
            res.json({
                code: 200,
                data: {
                    botConfigs: configs,
                    aiConfig,
                    plugins
                }
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: '获取配置失败',
                error: error.message
            });
        }
    }

    async updateBotConfig(req, res) {
        try {
            const { configKey, configValue } = req.body;
            
            const [updated] = await BotConfig.update(
                { configValue },
                { where: { configKey } }
            );
            
            if (updated) {
                const oneBotService = require('../services/oneBotService');
                
                if (['onebot_url', 'onebot_token'].includes(configKey)) {
                    await oneBotService.reconnectWithNewConfig();
                }
                
                res.json({
                    code: 200,
                    message: '更新成功'
                });
            } else {
                res.status(404).json({
                    code: 404,
                    message: '配置项不存在'
                });
            }
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: '更新配置失败',
                error: error.message
            });
        }
    }

    async updateAiConfig(req, res) {
        try {
            const { id, ...data } = req.body;
            
            const config = await AiConfig.findByPk(id);
            if (!config) {
                return res.status(404).json({
                    code: 404,
                    message: 'AI配置不存在'
                });
            }

            await config.update(data);
            
            res.json({
                code: 200,
                message: '更新成功',
                data: config
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: '更新AI配置失败',
                error: error.message
            });
        }
    }

    async updatePlugin(req, res) {
        try {
            const { pluginName, enabled, configJson } = req.body;
            
            const plugin = await PluginConfig.findOne({ where: { pluginName } });
            if (!plugin) {
                return res.status(404).json({
                    code: 404,
                    message: '插件不存在'
                });
            }

            await plugin.update({
                enabled: enabled !== undefined ? enabled : plugin.enabled,
                configJson: configJson || plugin.configJson
            });
            
            res.json({
                code: 200,
                message: '更新成功',
                data: plugin
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: '更新插件失败',
                error: error.message
            });
        }
    }

    async deletePlugin(req, res) {
        try {
            const { pluginName } = req.params;
            
            const plugin = await PluginConfig.findOne({ where: { pluginName } });
            if (!plugin) {
                return res.status(404).json({
                    code: 404,
                    message: '插件不存在'
                });
            }

            await plugin.destroy();
            
            res.json({
                code: 200,
                message: '删除成功'
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: '删除插件失败',
                error: error.message
            });
        }
    }

    async getStatus(req, res) {
        try {
            const oneBotService = require('../services/oneBotService');
            
            res.json({
                code: 200,
                data: {
                    connected: oneBotService.connected,
                    botQQ: oneBotService.botQQ
                }
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: '获取状态失败',
                error: error.message
            });
        }
    }
}

module.exports = new BotController();

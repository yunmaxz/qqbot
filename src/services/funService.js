const axios = require('axios');
const { PluginConfig } = require('../models');

class FunService {
    async getSaoHua() {
        try {
            const plugin = await PluginConfig.findOne({ where: { pluginName: 'saohua' } });
            const config = JSON.parse(plugin?.configJson || '{}');
            const apiUrl = config.api_url || 'https://api.vvhan.com/api/sao';

            const response = await axios.get(apiUrl);
            
            if (response.data.success) {
                return response.data.data;
            }
            return response.data.data || response.data.msg || '获取失败';
        } catch (error) {
            console.error('[骚话] 获取失败:', error.message);
            return '获取骚话失败，请稍后再试';
        }
    }

    async getDuJiTang() {
        try {
            const response = await axios.get('https://api.vvhan.com/api/dujitang');
            
            if (response.data.success) {
                return response.data.data;
            }
            return response.data.data || response.data.msg || '获取失败';
        } catch (error) {
            console.error('[毒鸡汤] 获取失败:', error.message);
            return '获取毒鸡汤失败，请稍后再试';
        }
    }

    async getTuWeiQingHua() {
        try {
            const plugin = await PluginConfig.findOne({ where: { pluginName: 'tuhua' } });
            const config = JSON.parse(plugin?.configJson || '{}');
            const apiUrl = config.api_url || 'https://api.vvhan.com/api/love';

            const response = await axios.get(apiUrl);
            
            if (response.data.success) {
                return response.data.data;
            }
            return response.data.data || response.data.msg || '获取失败';
        } catch (error) {
            console.error('[土味情话] 获取失败:', error.message);
            return '获取土味情话失败，请稍后再试';
        }
    }

    async getDaily() {
        try {
            const plugin = await PluginConfig.findOne({ where: { pluginName: 'daily' } });
            const config = JSON.parse(plugin?.configJson || '{}');
            const apiUrl = config.api_url || 'https://api.vvhan.com/api/everyday';

            const response = await axios.get(apiUrl);
            
            if (response.data.success) {
                const data = response.data.data;
                return `【每日一句】
${data.content}
—— ${data.note || ''}`;
            }
            return response.data.data || response.data.msg || '获取失败';
        } catch (error) {
            console.error('[每日一句] 获取失败:', error.message);
            return '获取每日一句失败，请稍后再试';
        }
    }
}

module.exports = new FunService();

const axios = require('axios');
const { PluginConfig } = require('../models');

class WeatherService {
    async getWeather(city) {
        try {
            const plugin = await PluginConfig.findOne({ where: { pluginName: 'weather' } });
            if (!plugin || !plugin.enabled) {
                return '天气功能未启用';
            }

            const config = JSON.parse(plugin.configJson || '{}');
            const apiKey = config.api_key;
            const apiUrl = config.api_url || 'https://devapi.qweather.com/v7/weather/now';

            if (!apiKey || apiKey === 'your-qweather-key') {
                return '天气接口未配置，请联系管理员';
            }

            const geoResponse = await axios.get('https://geoapi.qweather.com/v2/city/lookup', {
                params: {
                    location: city,
                    key: apiKey
                }
            });

            if (!geoResponse.data.location || geoResponse.data.location.length === 0) {
                return `未找到城市: ${city}`;
            }

            const locationId = geoResponse.data.location[0].id;
            const locationName = geoResponse.data.location[0].name;

            const weatherResponse = await axios.get(apiUrl, {
                params: {
                    location: locationId,
                    key: apiKey
                }
            });

            const now = weatherResponse.data.now;
            return `【${locationName}天气】
温度: ${now.temp}°C
体感温度: ${now.feelsLike}°C
天气: ${now.text}
风向: ${now.windDir}
风力: ${now.windScale}级
湿度: ${now.humidity}%
更新时间: ${now.obsTime}`;
        } catch (error) {
            console.error('[天气] 查询失败:', error.message);
            return '天气查询失败，请稍后再试';
        }
    }
}

module.exports = new WeatherService();

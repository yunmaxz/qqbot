const axios = require('axios');

class ZodiacService {
    async getHoroscope(sign) {
        let retries = 3;
        while (retries > 0) {
            try {
                const response = await axios.get('https://api-v2.cenguigui.cn/api/xingzuo/api.php', {
                    params: { msg: sign },
                    timeout: 15000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'application/json, text/plain, */*',
                        'Accept-Language': 'zh-CN,zh;q=0.9'
                    }
                });

                const data = response.data;
                console.log('[星座] API返回:', JSON.stringify(data));

                if (typeof data === 'string') {
                    return `【${sign}运势】\n${data}`;
                }

                if (data.code === 200 || data.status === 200 || data.success || data.msg) {
                    return this.formatHoroscope(data, sign);
                }

                return `查询${sign}运势失败，请稍后再试。`;
            } catch (error) {
                console.error(`[星座] 查询失败 (剩余重试${retries - 1}次):`, error.message);
                retries--;
                if (retries === 0) {
                    return `查询${sign}运势失败，请稍后再试。`;
                }
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }

    formatHoroscope(data, sign) {
        const result = data.data || data.result || data;

        let msg = `【${sign}运势】\n`;

        if (result.date) msg += `日期：${result.date}\n`;
        if (result.overall) msg += `综合：${result.overall}\n`;
        if (result.love) msg += `爱情：${result.love}\n`;
        if (result.career) msg += `事业：${result.career}\n`;
        if (result.fortune) msg += `财运：${result.fortune}\n`;
        if (result.health) msg += `健康：${result.health}\n`;
        if (result.lucky_number) msg += `幸运数字：${result.lucky_number}\n`;
        if (result.lucky_color) msg += `幸运颜色：${result.lucky_color}\n`;
        if (result.lucky_item) msg += `幸运物品：${result.lucky_item}\n`;
        if (result.short_comment) msg += `简评：${result.short_comment}\n`;
        if (result.content) msg += `${result.content}\n`;
        if (result.msg) msg += `${result.msg}\n`;

        return msg.trim();
    }

    getSignList() {
        return [
            '白羊座', '金牛座', '双子座', '巨蟹座',
            '狮子座', '处女座', '天秤座', '天蝎座',
            '射手座', '摩羯座', '水瓶座', '双鱼座'
        ];
    }

    matchSign(input) {
        const signList = this.getSignList();
        for (const sign of signList) {
            if (input.includes(sign)) {
                return sign;
            }
        }
        return null;
    }
}

module.exports = new ZodiacService();

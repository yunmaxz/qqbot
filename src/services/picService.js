const axios = require('axios');
const fs = require('fs');
const path = require('path');

class PicService {
    async getRandomPic() {
        let retries = 3;
        while (retries > 0) {
            try {
                const response = await axios.get('https://api-v2.cenguigui.cn/api/meizi/', {
                    timeout: 15000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'image/*'
                    },
                    responseType: 'arraybuffer'
                });

                const contentType = response.headers['content-type'] || '';
                if (contentType.includes('image')) {
                    const ext = contentType.includes('png') ? 'png' : 'jpg';
                    const fileName = `pic_${Date.now()}.${ext}`;
                    const filePath = path.join(__dirname, '../../temp', fileName);

                    const tempDir = path.join(__dirname, '../../temp');
                    if (!fs.existsSync(tempDir)) {
                        fs.mkdirSync(tempDir, { recursive: true });
                    }

                    fs.writeFileSync(filePath, response.data);
                    return filePath;
                }

                return '获取图片失败，请稍后再试。';
            } catch (error) {
                console.error(`[看看腿] 查询失败 (剩余重试${retries - 1}次):`, error.message);
                retries--;
                if (retries === 0) {
                    return '获取图片失败，请稍后再试。';
                }
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }
}

module.exports = new PicService();

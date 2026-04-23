const axios = require('axios');
const fs = require('fs');
const path = require('path');

class VideoService {
    async getVideoUrl() {
        let retries = 3;
        while (retries > 0) {
            try {
                const response = await axios.get('https://api-v2.cenguigui.cn/api/mp4/MP4_xiaojiejie.php?type=json', {
                    timeout: 15000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'application/json'
                    }
                });

                const data = response.data;

                if (typeof data === 'string') {
                    return data;
                }

                if (data && (data.code === 200 || data.status === 200 || data.success || data.url || data.video)) {
                    return this.formatVideo(data);
                }

                return null;
            } catch (error) {
                console.error(`[小姐姐] 获取URL失败 (剩余重试${retries - 1}次):`, error.message);
                retries--;
                if (retries === 0) {
                    return null;
                }
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }

    formatVideo(data) {
        const result = data.data || data.result || data;
        return result.url || result.video || result.mp4 || null;
    }

    async downloadVideo(videoUrl) {
        try {
            const response = await axios.get(videoUrl, {
                timeout: 60000,
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            const fileName = `video_${Date.now()}.mp4`;
            const filePath = path.join(__dirname, '../../temp', fileName);

            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            fs.writeFileSync(filePath, response.data);
            return filePath;
        } catch (error) {
            console.error('[小姐姐] 下载视频失败:', error.message);
            return null;
        }
    }
}

module.exports = new VideoService();

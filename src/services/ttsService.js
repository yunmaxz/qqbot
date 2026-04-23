/**
 * TTS 语音合成服务 - 基于 Microsoft Edge TTS
 * Copyright (c) 2025 云码小栈 <https://yunmaxz.com>
 */
const path = require('path');
const fs = require('fs');

class TtsService {
    /**
     * 清理文本，去除不适合朗读的动作/情绪描述
     * 常见格式：*动作* 、（描述）、【描述】、[描述]、<描述>
     */
    cleanForVoice(text) {
        return text
            .replace(/\*[^*]*\*/g, '')          // *动作描述*
            .replace(/（[^）]*）/g, '')           // （动作描述）
            .replace(/\([^)]*\)/g, '')            // (动作描述)
            .replace(/【[^】]*】/g, '')            // 【动作描述】
            .replace(/\[[^\]]*\]/g, '')            // [动作描述]
            .replace(/<[^>]*>/g, '')               // <动作描述>
            .replace(/\s{2,}/g, ' ')               // 多余空格
            .trim();
    }

    /**
     * 文字转语音，返回生成的音频文件路径
     * @param {string} text 要转换的文字
     * @param {string} voiceName 微软语音名称，如 zh-CN-XiaoxiaoNeural
     */
    async textToVoice(text, voiceName = 'zh-CN-XiaoxiaoNeural') {
        text = this.cleanForVoice(text);
        const { MsEdgeTTS, OUTPUT_FORMAT } = await import('msedge-tts');

        const tempDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const tts = new MsEdgeTTS();
        await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
        const { audioFilePath } = await tts.toFile(tempDir, text);
        return audioFilePath;
    }

    cleanup(filePath) {
        try {
            if (filePath && fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (e) {
            // 清理失败不影响主流程
        }
    }
}

module.exports = new TtsService();

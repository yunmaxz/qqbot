const { AiProvider } = require('../models');

class ProviderController {
    async list(req, res) {
        try {
            const providers = await AiProvider.findAll({
                order: [['sortOrder', 'ASC'], ['id', 'ASC']]
            });
            res.json({
                code: 200,
                data: providers
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: '获取AI接口列表失败',
                error: error.message
            });
        }
    }

    async create(req, res) {
        try {
            const provider = await AiProvider.create(req.body);
            res.json({
                code: 200,
                data: provider,
                message: '创建成功'
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: '创建AI接口失败',
                error: error.message
            });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const provider = await AiProvider.findByPk(id);
            if (!provider) {
                return res.status(404).json({
                    code: 404,
                    message: 'AI接口不存在'
                });
            }
            await provider.update(req.body);
            res.json({
                code: 200,
                data: provider,
                message: '更新成功'
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: '更新AI接口失败',
                error: error.message
            });
        }
    }

    async remove(req, res) {
        try {
            const { id } = req.params;
            const provider = await AiProvider.findByPk(id);
            if (!provider) {
                return res.status(404).json({
                    code: 404,
                    message: 'AI接口不存在'
                });
            }
            await provider.destroy();
            res.json({
                code: 200,
                message: '删除成功'
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: '删除AI接口失败',
                error: error.message
            });
        }
    }

    async toggle(req, res) {
        try {
            const { id } = req.params;
            const { enabled } = req.body;
            const provider = await AiProvider.findByPk(id);
            if (!provider) {
                return res.status(404).json({
                    code: 404,
                    message: 'AI接口不存在'
                });
            }
            provider.enabled = enabled ? 1 : 0;
            await provider.save();
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
}

module.exports = new ProviderController();

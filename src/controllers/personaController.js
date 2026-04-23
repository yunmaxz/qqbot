const { AiPersona, AiProvider, PersonaBinding } = require('../models');
const proactiveService = require('../services/proactiveService');

class PersonaController {
    async list(req, res) {
        try {
            const personas = await AiPersona.findAll({
                include: [{
                    model: AiProvider,
                    as: 'AiProvider',
                    attributes: ['id', 'name', 'model'],
                    required: false
                }],
                order: [['sortOrder', 'ASC'], ['id', 'ASC']]
            });

            const result = await Promise.all(personas.map(async (persona) => {
                const data = persona.toJSON();
                if (!data.AiProvider && data.chatProviderId) {
                    const chatProvider = await AiProvider.findByPk(data.chatProviderId, {
                        attributes: ['id', 'name', 'model']
                    });
                    data.AiProvider = chatProvider;
                }
                return data;
            }));

            res.json({
                code: 200,
                data: result
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: '获取人设列表失败',
                error: error.message
            });
        }
    }

    async create(req, res) {
        try {
            const persona = await AiPersona.create(req.body);
            // 若新人设开启了全天随机主动消息，立即生效无需重启
            proactiveService.reloadPersona(persona.id).catch(() => {});
            res.json({
                code: 200,
                data: persona,
                message: '创建成功'
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: '创建人设失败',
                error: error.message
            });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const persona = await AiPersona.findByPk(id);
            if (!persona) {
                return res.status(404).json({
                    code: 404,
                    message: '人设不存在'
                });
            }
            await persona.update(req.body);
            // 重新加载该人设的全天随机定时器（配置变更立即生效）
            proactiveService.reloadPersona(persona.id).catch(() => {});
            res.json({
                code: 200,
                data: persona,
                message: '更新成功'
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: '更新人设失败',
                error: error.message
            });
        }
    }

    async remove(req, res) {
        try {
            const { id } = req.params;
            const persona = await AiPersona.findByPk(id);
            if (!persona) {
                return res.status(404).json({
                    code: 404,
                    message: '人设不存在'
                });
            }
            await persona.destroy();
            res.json({
                code: 200,
                message: '删除成功'
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: '删除人设失败',
                error: error.message
            });
        }
    }

    async toggle(req, res) {
        try {
            const { id } = req.params;
            const { enabled } = req.body;
            const persona = await AiPersona.findByPk(id);
            if (!persona) {
                return res.status(404).json({
                    code: 404,
                    message: '人设不存在'
                });
            }
            persona.enabled = enabled ? 1 : 0;
            await persona.save();
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

    async getBindings(req, res) {
        try {
            const { id } = req.params;
            const bindings = await PersonaBinding.findAll({
                where: { personaId: id }
            });
            res.json({
                code: 200,
                data: bindings
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: '获取绑定列表失败',
                error: error.message
            });
        }
    }

    async addBinding(req, res) {
        try {
            const { id } = req.params;
            const { bindType, bindTarget } = req.body;
            const binding = await PersonaBinding.create({
                personaId: id,
                bindType,
                bindTarget
            });
            res.json({
                code: 200,
                data: binding,
                message: '绑定成功'
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: '绑定失败',
                error: error.message
            });
        }
    }

    async removeBinding(req, res) {
        try {
            const { bindingId } = req.params;
            const binding = await PersonaBinding.findByPk(bindingId);
            if (!binding) {
                return res.status(404).json({
                    code: 404,
                    message: '绑定不存在'
                });
            }
            await binding.destroy();
            res.json({
                code: 200,
                message: '解绑成功'
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: '解绑失败',
                error: error.message
            });
        }
    }
}

module.exports = new PersonaController();

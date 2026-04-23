const authService = require('../services/authService');

class AuthController {
    async login(req, res) {
        try {
            const { username, password } = req.body;
            
            if (!username || !password) {
                return res.status(400).json({
                    code: 400,
                    message: '用户名和密码不能为空'
                });
            }

            const result = await authService.login(username, password);
            
            res.json({
                code: 200,
                message: '登录成功',
                data: result
            });
        } catch (error) {
            res.status(401).json({
                code: 401,
                message: error.message
            });
        }
    }

    async register(req, res) {
        try {
            const { username, password, nickname } = req.body;
            
            if (!username || !password) {
                return res.status(400).json({
                    code: 400,
                    message: '用户名和密码不能为空'
                });
            }

            const result = await authService.register(username, password, nickname);
            
            res.json({
                code: 200,
                message: '注册成功',
                data: result
            });
        } catch (error) {
            res.status(400).json({
                code: 400,
                message: error.message
            });
        }
    }

    async getProfile(req, res) {
        res.json({
            code: 200,
            data: req.user
        });
    }

    async changePassword(req, res) {
        try {
            const { oldPassword, newPassword } = req.body;
            
            if (!oldPassword || !newPassword) {
                return res.status(400).json({
                    code: 400,
                    message: '原密码和新密码不能为空'
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    code: 400,
                    message: '新密码长度不能少于6位'
                });
            }

            const result = await authService.changePassword(req.user.id, oldPassword, newPassword);
            
            res.json({
                code: 200,
                message: result.message
            });
        } catch (error) {
            res.status(400).json({
                code: 400,
                message: error.message
            });
        }
    }
}

module.exports = new AuthController();

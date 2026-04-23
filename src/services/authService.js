const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Admin } = require('../models');

class AuthService {
    async login(username, password) {
        const admin = await Admin.findOne({ where: { username } });
        
        if (!admin) {
            throw new Error('用户名或密码错误');
        }

        const isValid = await bcrypt.compare(password, admin.password);
        
        if (!isValid) {
            throw new Error('用户名或密码错误');
        }

        const token = jwt.sign(
            { id: admin.id, username: admin.username },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        return {
            token,
            user: {
                id: admin.id,
                username: admin.username,
                nickname: admin.nickname
            }
        };
    }

    async register(username, password, nickname) {
        const existing = await Admin.findOne({ where: { username } });
        
        if (existing) {
            throw new Error('用户名已存在');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const admin = await Admin.create({
            username,
            password: hashedPassword,
            nickname: nickname || username
        });

        return {
            id: admin.id,
            username: admin.username,
            nickname: admin.nickname
        };
    }

    verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return null;
        }
    }

    async changePassword(userId, oldPassword, newPassword) {
        const admin = await Admin.findByPk(userId);
        
        if (!admin) {
            throw new Error('用户不存在');
        }

        // 验证旧密码
        const isValid = await bcrypt.compare(oldPassword, admin.password);
        
        if (!isValid) {
            throw new Error('原密码错误');
        }

        // 加密新密码
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // 更新密码
        await admin.update({ password: hashedPassword });

        return { message: '密码修改成功' };
    }
}

module.exports = new AuthService();

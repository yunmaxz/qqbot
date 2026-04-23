const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BannedWord = sequelize.define('BannedWord', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    groupId: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'group_id',
        comment: '群号，all表示全局'
    },
    word: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: '违禁词'
    },
    matchType: {
        type: DataTypes.STRING(20),
        defaultValue: 'contains',
        field: 'match_type',
        comment: '匹配类型：exact精确匹配，contains包含匹配，regex正则匹配'
    },
    muteDuration: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'mute_duration',
        comment: '单独禁言时长(分钟)，null使用全局设置'
    },
    enabled: {
        type: DataTypes.TINYINT,
        defaultValue: 1,
        comment: '是否启用'
    }
}, {
    tableName: 'banned_words',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            fields: ['group_id', 'word']
        }
    ]
});

module.exports = BannedWord;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserViolationStats = sequelize.define('UserViolationStats', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    groupId: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'group_id',
        comment: '群号'
    },
    userId: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'user_id',
        comment: '用户QQ号'
    },
    bannedWordCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'banned_word_count',
        comment: '违禁词违规次数'
    },
    floodCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'flood_count',
        comment: '刷屏违规次数'
    },
    longMsgCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'long_msg_count',
        comment: '长消息违规次数'
    },
    totalCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'total_count',
        comment: '总违规次数'
    },
    lastViolationAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_violation_at',
        comment: '最后违规时间'
    }
}, {
    tableName: 'user_violation_stats',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            fields: ['group_id', 'user_id']
        }
    ]
});

module.exports = UserViolationStats;

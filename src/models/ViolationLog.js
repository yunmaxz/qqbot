const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ViolationLog = sequelize.define('ViolationLog', {
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
        comment: '违规用户QQ号'
    },
    userNickname: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'user_nickname',
        comment: '用户昵称'
    },
    violationType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'violation_type',
        comment: '违规类型：banned_word违禁词，flood刷屏，long_msg长消息'
    },
    violationContent: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'violation_content',
        comment: '违规内容'
    },
    wordMatched: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'word_matched',
        comment: '匹配到的违禁词'
    },
    muteDuration: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'mute_duration',
        comment: '禁言时长(分钟)'
    },
    messageRecalled: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
        field: 'message_recalled',
        comment: '是否撤回消息'
    },
    kicked: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
        comment: '是否被踢出'
    }
}, {
    tableName: 'violation_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
        {
            fields: ['group_id', 'user_id']
        },
        {
            fields: ['created_at']
        }
    ]
});

module.exports = ViolationLog;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GroupSettings = sequelize.define('GroupSettings', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    groupId: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        field: 'group_id'
    },
    enabled: {
        type: DataTypes.TINYINT,
        defaultValue: 1,
        comment: '是否启用群管功能'
    },
    // 违禁词设置
    banWordEnabled: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
        field: 'ban_word_enabled',
        comment: '是否启用违禁词过滤'
    },
    banWordMuteDuration: {
        type: DataTypes.INTEGER,
        defaultValue: 10,
        field: 'ban_word_mute_duration',
        comment: '违禁词禁言时长(分钟)'
    },
    banWordAutoKick: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
        field: 'ban_word_auto_kick',
        comment: '违禁词达到次数是否踢出'
    },
    banWordKickThreshold: {
        type: DataTypes.INTEGER,
        defaultValue: 3,
        field: 'ban_word_kick_threshold',
        comment: '违禁词踢出阈值次数'
    },
    // 刷屏设置
    floodEnabled: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
        field: 'flood_enabled',
        comment: '是否启用刷屏检测'
    },
    floodTimeWindow: {
        type: DataTypes.INTEGER,
        defaultValue: 10,
        field: 'flood_time_window',
        comment: '刷屏检测时间窗口(秒)'
    },
    floodMessageCount: {
        type: DataTypes.INTEGER,
        defaultValue: 5,
        field: 'flood_message_count',
        comment: '刷屏检测消息数量阈值'
    },
    floodMuteDuration: {
        type: DataTypes.INTEGER,
        defaultValue: 10,
        field: 'flood_mute_duration',
        comment: '刷屏禁言时长(分钟)'
    },
    // 长消息设置
    longMsgEnabled: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
        field: 'long_msg_enabled',
        comment: '是否启用长消息检测'
    },
    longMsgMaxLength: {
        type: DataTypes.INTEGER,
        defaultValue: 300,
        field: 'long_msg_max_length',
        comment: '长消息最大字符长度'
    },
    longMsgMaxBytes: {
        type: DataTypes.INTEGER,
        defaultValue: 1000,
        field: 'long_msg_max_bytes',
        comment: '长消息最大字节长度'
    },
    longMsgMaxLines: {
        type: DataTypes.INTEGER,
        defaultValue: 20,
        field: 'long_msg_max_lines',
        comment: '长消息最大行数'
    },
    longMsgMuteDuration: {
        type: DataTypes.INTEGER,
        defaultValue: 10,
        field: 'long_msg_mute_duration',
        comment: '长消息禁言时长(分钟)'
    },
    // 白名单
    whitelist: {
        type: DataTypes.TEXT,
        comment: '白名单用户QQ号列表(JSON)',
        get() {
            const rawValue = this.getDataValue('whitelist');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('whitelist', JSON.stringify(value || []));
        }
    }
}, {
    tableName: 'group_settings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = GroupSettings;

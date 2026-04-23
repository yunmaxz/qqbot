const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GroupConfig = sequelize.define('GroupConfig', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    groupId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        unique: true,
        field: 'group_id'
    },
    groupName: {
        type: DataTypes.STRING(255),
        defaultValue: '',
        field: 'group_name'
    },
    ownerId: {
        type: DataTypes.BIGINT,
        allowNull: true,
        field: 'owner_id'
    },
    enabled: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    welcomeEnabled: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'welcome_enabled'
    },
    welcomeMessage: {
        type: DataTypes.TEXT,
        field: 'welcome_message'
    },
    leaveEnabled: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'leave_enabled'
    },
    leaveMessage: {
        type: DataTypes.TEXT,
        field: 'leave_message'
    },
    muteCommand: {
        type: DataTypes.STRING(50),
        defaultValue: '禁言',
        field: 'mute_command'
    },
    unmuteCommand: {
        type: DataTypes.STRING(50),
        defaultValue: '解除禁言',
        field: 'unmute_command'
    },
    kickCommand: {
        type: DataTypes.STRING(50),
        defaultValue: '踢人',
        field: 'kick_command'
    },
    commandUsage: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'command_usage'
    }
}, {
    tableName: 'group_configs',
    timestamps: true
});

module.exports = GroupConfig;

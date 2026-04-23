const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MessageLog = sequelize.define('MessageLog', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    messageType: {
        type: DataTypes.STRING(50),
        field: 'message_type'
    },
    userId: {
        type: DataTypes.BIGINT,
        field: 'user_id'
    },
    groupId: {
        type: DataTypes.BIGINT,
        field: 'group_id'
    },
    message: {
        type: DataTypes.TEXT
    },
    reply: {
        type: DataTypes.TEXT
    },
    triggerType: {
        type: DataTypes.STRING(50),
        field: 'trigger_type'
    }
}, {
    tableName: 'message_logs',
    timestamps: true
});

module.exports = MessageLog;

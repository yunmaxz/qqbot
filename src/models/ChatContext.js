const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChatContext = sequelize.define('ChatContext', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'user_id'
    },
    groupId: {
        type: DataTypes.BIGINT,
        field: 'group_id'
    },
    personaId: {
        type: DataTypes.INTEGER,
        field: 'persona_id'
    },
    role: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    tableName: 'chat_contexts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = ChatContext;

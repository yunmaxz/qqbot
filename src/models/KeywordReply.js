const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const KeywordReply = sequelize.define('KeywordReply', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    keyword: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    replyContent: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'reply_content'
    },
    replyType: {
        type: DataTypes.ENUM('text', 'image', 'mixed'),
        defaultValue: 'text',
        field: 'reply_type'
    },
    matchMode: {
        type: DataTypes.ENUM('exact', 'contains', 'regex'),
        defaultValue: 'contains',
        field: 'match_mode'
    },
    enabled: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    priority: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'keyword_replies',
    timestamps: true
});

module.exports = KeywordReply;

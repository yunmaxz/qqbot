const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FloodCheckCache = sequelize.define('FloodCheckCache', {
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
    messageTime: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'message_time',
        comment: '消息时间'
    }
}, {
    tableName: 'flood_check_cache',
    timestamps: false,
    indexes: [
        {
            fields: ['group_id', 'user_id', 'message_time']
        }
    ]
});

module.exports = FloodCheckCache;

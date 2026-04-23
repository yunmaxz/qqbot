const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GroupMute = sequelize.define('GroupMute', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    groupId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'group_id'
    },
    userId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'user_id'
    },
    duration: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'group_mutes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = GroupMute;

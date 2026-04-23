const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GroupPluginMenu = sequelize.define('GroupPluginMenu', {
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
    pluginName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'plugin_name'
    },
    enabled: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'group_plugin_menus',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['group_id', 'plugin_name']
        }
    ]
});

module.exports = GroupPluginMenu;

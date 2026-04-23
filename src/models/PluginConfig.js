const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PluginConfig = sequelize.define('PluginConfig', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    pluginName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'plugin_name'
    },
    pluginDesc: {
        type: DataTypes.STRING(255),
        field: 'plugin_desc'
    },
    enabled: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    configJson: {
        type: DataTypes.TEXT,
        field: 'config_json'
    }
}, {
    tableName: 'plugin_configs',
    timestamps: true
});

module.exports = PluginConfig;

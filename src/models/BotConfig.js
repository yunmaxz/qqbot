const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BotConfig = sequelize.define('BotConfig', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    configKey: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'config_key'
    },
    configValue: {
        type: DataTypes.TEXT,
        field: 'config_value'
    },
    description: {
        type: DataTypes.STRING(255)
    }
}, {
    tableName: 'bot_configs',
    timestamps: true
});

module.exports = BotConfig;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AiProvider = sequelize.define('AiProvider', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    apiUrl: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'api_url'
    },
    apiKey: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'api_key'
    },
    model: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    temperature: {
        type: DataTypes.DECIMAL(3, 2),
        defaultValue: 0.7
    },
    maxTokens: {
        type: DataTypes.INTEGER,
        defaultValue: 2000,
        field: 'max_tokens'
    },
    enabled: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    sortOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'sort_order'
    }
}, {
    tableName: 'ai_providers',
    timestamps: true
});

module.exports = AiProvider;

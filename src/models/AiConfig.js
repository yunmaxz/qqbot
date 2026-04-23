const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AiConfig = sequelize.define('AiConfig', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    apiUrl: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'api_url',
        defaultValue: 'https://api.openai.com/v1/chat/completions'
    },
    apiKey: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'api_key'
    },
    model: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'gpt-3.5-turbo'
    },
    temperature: {
        type: DataTypes.DECIMAL(3, 2),
        defaultValue: 0.7
    },
    maxContext: {
        type: DataTypes.INTEGER,
        defaultValue: 10,
        field: 'max_context'
    },
    systemPrompt: {
        type: DataTypes.TEXT,
        field: 'system_prompt'
    },
    triggerType: {
        type: DataTypes.ENUM('at', 'probability', 'both'),
        defaultValue: 'at',
        field: 'trigger_type'
    },
    triggerProbability: {
        type: DataTypes.DECIMAL(3, 2),
        defaultValue: 0.3,
        field: 'trigger_probability'
    },
    enabled: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    }
}, {
    tableName: 'ai_configs',
    timestamps: true
});

module.exports = AiConfig;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AiPersona = sequelize.define('AiPersona', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    avatar: {
        type: DataTypes.STRING(255),
        defaultValue: ''
    },
    description: {
        type: DataTypes.STRING(500),
        defaultValue: ''
    },
    scope: {
        type: DataTypes.STRING(20),
        defaultValue: 'all'
    },
    chatProviderId: {
        type: DataTypes.INTEGER,
        field: 'chat_provider_id'
    },
    imageProviderId: {
        type: DataTypes.INTEGER,
        field: 'image_provider_id'
    },
    systemPrompt: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'system_prompt'
    },
    providerId: {
        type: DataTypes.INTEGER,
        field: 'provider_id'
    },
    voiceEnabled: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'voice_enabled'
    },
    voiceProvider: {
        type: DataTypes.STRING(50),
        defaultValue: '',
        field: 'voice_provider'
    },
    voiceConfig: {
        type: DataTypes.TEXT,
        field: 'voice_config'
    },
    imageEnabled: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'image_enabled'
    },
    imageProvider: {
        type: DataTypes.STRING(50),
        defaultValue: '',
        field: 'image_provider'
    },
    imageConfig: {
        type: DataTypes.TEXT,
        field: 'image_config'
    },
    personalityTags: {
        type: DataTypes.STRING(255),
        defaultValue: '',
        field: 'personality_tags'
    },
    sortOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'sort_order'
    },
    enabled: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    }
}, {
    tableName: 'ai_personas',
    timestamps: true
});

module.exports = AiPersona;

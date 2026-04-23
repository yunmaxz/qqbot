const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PersonaBinding = sequelize.define('PersonaBinding', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    personaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'persona_id'
    },
    bindType: {
        type: DataTypes.ENUM('private', 'group'),
        allowNull: false,
        field: 'bind_type'
    },
    bindTarget: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'bind_target'
    },
    enabled: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    }
}, {
    tableName: 'persona_bindings',
    timestamps: true
});

module.exports = PersonaBinding;

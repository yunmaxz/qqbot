const Admin = require('./Admin');
const BotConfig = require('./BotConfig');
const AiConfig = require('./AiConfig');
const AiProvider = require('./AiProvider');
const AiPersona = require('./AiPersona');
const PersonaBinding = require('./PersonaBinding');
const GroupConfig = require('./GroupConfig');
const GroupMute = require('./GroupMute');
const GroupPluginMenu = require('./GroupPluginMenu');
const PluginConfig = require('./PluginConfig');
const KeywordReply = require('./KeywordReply');
const MessageLog = require('./MessageLog');
const ChatContext = require('./ChatContext');
const GroupSettings = require('./GroupSettings');
const BannedWord = require('./BannedWord');
const ViolationLog = require('./ViolationLog');
const UserViolationStats = require('./UserViolationStats');
const FloodCheckCache = require('./FloodCheckCache');

AiPersona.belongsTo(AiProvider, { foreignKey: 'providerId', as: 'AiProvider' });
AiProvider.hasMany(AiPersona, { foreignKey: 'providerId' });

PersonaBinding.belongsTo(AiPersona, { foreignKey: 'personaId', as: 'AiPersona' });
AiPersona.hasMany(PersonaBinding, { foreignKey: 'personaId' });

GroupPluginMenu.belongsTo(PluginConfig, { foreignKey: 'pluginName', targetKey: 'pluginName', as: 'PluginConfig', constraints: false });
PluginConfig.hasMany(GroupPluginMenu, { foreignKey: 'pluginName', sourceKey: 'pluginName', constraints: false });

module.exports = {
    Admin,
    BotConfig,
    AiConfig,
    AiProvider,
    AiPersona,
    PersonaBinding,
    GroupConfig,
    GroupMute,
    GroupPluginMenu,
    PluginConfig,
    KeywordReply,
    MessageLog,
    ChatContext,
    GroupSettings,
    BannedWord,
    ViolationLog,
    UserViolationStats,
    FloodCheckCache
};

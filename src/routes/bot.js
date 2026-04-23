const express = require('express');
const router = express.Router();
const botController = require('../controllers/botController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/configs', botController.getConfigs);
router.put('/config', botController.updateBotConfig);
router.put('/ai-config', botController.updateAiConfig);
router.put('/plugin', botController.updatePlugin);
router.delete('/plugin/:pluginName', botController.deletePlugin);
router.get('/status', botController.getStatus);

module.exports = router;

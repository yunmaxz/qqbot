const express = require('express');
const router = express.Router();
const groupManagementController = require('../controllers/groupManagementController');
const authMiddleware = require('../middleware/auth');

// 所有路由都需要认证
router.use(authMiddleware);

// 群组列表
router.get('/groups', groupManagementController.getGroupList);

// 群组设置
router.get('/groups/:groupId/settings', groupManagementController.getGroupSettings);
router.put('/groups/:groupId/settings', groupManagementController.updateGroupSettings);

// 违禁词管理
router.post('/groups/:groupId/banned-words', groupManagementController.addBannedWord);
router.put('/banned-words/:id', groupManagementController.updateBannedWord);
router.delete('/banned-words/:id', groupManagementController.deleteBannedWord);

// 违规记录
router.get('/violation-logs', groupManagementController.getViolationLogs);

// 用户违规统计
router.get('/groups/:groupId/violation-stats', groupManagementController.getUserViolationStats);
router.delete('/groups/:groupId/users/:userId/violations', groupManagementController.clearUserViolations);

// 白名单管理
router.post('/groups/:groupId/whitelist', groupManagementController.addWhitelistUser);
router.delete('/groups/:groupId/whitelist/:userId', groupManagementController.removeWhitelistUser);

module.exports = router;

const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', groupController.list);
router.post('/', groupController.create);
router.put('/:id', groupController.update);
router.delete('/:id', groupController.remove);
router.put('/:id/toggle', groupController.toggle);
router.get('/:groupId/mutes', groupController.getMutes);
router.post('/:groupId/mutes', groupController.addMute);
router.delete('/mutes/:muteId', groupController.removeMute);
router.get('/:groupId/menu', groupController.getMenu);
router.put('/:groupId/menu', groupController.saveMenu);

module.exports = router;

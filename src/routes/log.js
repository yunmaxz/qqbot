const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', logController.list);
router.get('/stats', logController.stats);
router.post('/clear', logController.clear);

module.exports = router;

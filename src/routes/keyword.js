const express = require('express');
const router = express.Router();
const keywordController = require('../controllers/keywordController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', keywordController.list);
router.post('/', keywordController.create);
router.put('/:id', keywordController.update);
router.delete('/:id', keywordController.delete);
router.patch('/:id/toggle', keywordController.toggle);

module.exports = router;

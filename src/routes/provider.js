const express = require('express');
const router = express.Router();
const providerController = require('../controllers/providerController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', providerController.list);
router.post('/', providerController.create);
router.put('/:id', providerController.update);
router.delete('/:id', providerController.remove);
router.put('/:id/toggle', providerController.toggle);

module.exports = router;

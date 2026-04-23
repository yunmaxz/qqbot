const express = require('express');
const router = express.Router();
const personaController = require('../controllers/personaController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', personaController.list);
router.post('/', personaController.create);
router.put('/:id', personaController.update);
router.delete('/:id', personaController.remove);
router.put('/:id/toggle', personaController.toggle);
router.get('/:id/bindings', personaController.getBindings);
router.post('/:id/bindings', personaController.addBinding);
router.delete('/bindings/:bindingId', personaController.removeBinding);

module.exports = router;

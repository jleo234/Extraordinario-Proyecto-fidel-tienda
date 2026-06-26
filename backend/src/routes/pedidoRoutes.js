const express = require('express');
const verificarToken = require('../middleware/auth');
const { crearPedido, listarPedidos, obtenerPedido } = require('../controllers/pedidoController');

const router = express.Router();

router.use(verificarToken);

router.post('/', crearPedido);
router.get('/', listarPedidos);
router.get('/:id', obtenerPedido);

module.exports = router;

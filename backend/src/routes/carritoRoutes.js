const express = require('express');
const verificarToken = require('../middleware/auth');
const {
  verCarrito,
  agregarProducto,
  actualizarCantidad,
  eliminarProducto
} = require('../controllers/carritoController');

const router = express.Router();

router.use(verificarToken); // todas las rutas de carrito requieren sesión iniciada

router.get('/', verCarrito);
router.post('/', agregarProducto);
router.put('/:id_item', actualizarCantidad);
router.delete('/:id_item', eliminarProducto);

module.exports = router;

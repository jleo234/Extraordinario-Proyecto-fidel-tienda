const express = require('express');
const { listarProductos, obtenerProducto, listarCategorias } = require('../controllers/productoController');

const router = express.Router();

router.get('/', listarProductos);
router.get('/categorias', listarCategorias);
router.get('/:id', obtenerProducto);

module.exports = router;

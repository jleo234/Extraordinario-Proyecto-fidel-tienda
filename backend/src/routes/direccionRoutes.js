const express = require('express');
const verificarToken = require('../middleware/auth');
const { listarDirecciones, crearDireccion } = require('../controllers/direccionController');

const router = express.Router();

router.use(verificarToken);

router.get('/', listarDirecciones);
router.post('/', crearDireccion);

module.exports = router;

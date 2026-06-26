const express = require('express');
const { body } = require('express-validator');
const { registrar, iniciarSesion } = require('../controllers/authController');

const router = express.Router();

router.post(
  '/registro',
  [
    body('nombre').notEmpty().withMessage('El nombre es requerido.'),
    body('apellido').notEmpty().withMessage('El apellido es requerido.'),
    body('correo').isEmail().withMessage('Correo electrónico inválido.'),
    body('contrasena').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.')
  ],
  registrar
);

router.post(
  '/login',
  [
    body('correo').isEmail().withMessage('Correo electrónico inválido.'),
    body('contrasena').notEmpty().withMessage('La contraseña es requerida.')
  ],
  iniciarSesion
);

module.exports = router;

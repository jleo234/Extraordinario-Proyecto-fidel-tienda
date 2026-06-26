const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const pool = require('../config/db');
require('dotenv').config();

/**
 * Registro de un nuevo usuario.
 * Recibe: nombre, apellido, correo, contrasena, telefono (opcional)
 * Guarda la contraseña con hash (bcrypt) nunca en texto plano.
 */
async function registrar(req, res) {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }

  const { nombre, apellido, correo, contrasena, telefono } = req.body;

  try {
    const [existentes] = await pool.query(
      'SELECT id_usuario FROM usuarios WHERE correo = ?',
      [correo]
    );

    if (existentes.length > 0) {
      return res.status(409).json({ mensaje: 'El correo ya está registrado.' });
    }

    const contrasenaHash = await bcrypt.hash(contrasena, 10);

    const [resultado] = await pool.query(
      `INSERT INTO usuarios (nombre, apellido, correo, contrasena_hash, telefono)
       VALUES (?, ?, ?, ?, ?)`,
      [nombre, apellido, correo, contrasenaHash, telefono || null]
    );

    // Se crea automáticamente un carrito activo para el nuevo usuario
    await pool.query(
      'INSERT INTO carritos (id_usuario, estado) VALUES (?, "activo")',
      [resultado.insertId]
    );

    return res.status(201).json({
      mensaje: 'Usuario registrado correctamente.',
      id_usuario: resultado.insertId
    });
  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({ mensaje: 'Error interno al registrar usuario.' });
  }
}

/**
 * Inicio de sesión.
 * Verifica correo + contraseña y devuelve un token JWT si son correctos.
 */
async function iniciarSesion(req, res) {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }

  const { correo, contrasena } = req.body;

  try {
    const [usuarios] = await pool.query(
      'SELECT * FROM usuarios WHERE correo = ? AND activo = TRUE',
      [correo]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos.' });
    }

    const usuario = usuarios[0];
    const coincide = await bcrypt.compare(contrasena, usuario.contrasena_hash);

    if (!coincide) {
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos.' });
    }

    const token = jwt.sign(
      { id_usuario: usuario.id_usuario, correo: usuario.correo },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
    );

    return res.json({
      mensaje: 'Inicio de sesión exitoso.',
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo
      }
    });
  } catch (error) {
    console.error('Error en inicio de sesión:', error);
    return res.status(500).json({ mensaje: 'Error interno al iniciar sesión.' });
  }
}

module.exports = { registrar, iniciarSesion };

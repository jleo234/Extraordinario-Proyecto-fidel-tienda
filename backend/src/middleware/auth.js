const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware que verifica el token JWT enviado en el header Authorization.
 * Si es válido, agrega los datos del usuario a req.usuario y continúa.
 * Si no, responde con 401 (no autenticado).
 */
function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ mensaje: 'Acceso denegado. Token no proporcionado.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodificado = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decodificado; // { id_usuario, correo }
    next();
  } catch (error) {
    return res.status(401).json({ mensaje: 'Token inválido o expirado.' });
  }
}

module.exports = verificarToken;

const pool = require('../config/db');

/** Lista las direcciones de envío registradas por el usuario autenticado. */
async function listarDirecciones(req, res) {
  try {
    const [direcciones] = await pool.query(
      'SELECT * FROM direcciones WHERE id_usuario = ?',
      [req.usuario.id_usuario]
    );
    return res.json(direcciones);
  } catch (error) {
    console.error('Error al listar direcciones:', error);
    return res.status(500).json({ mensaje: 'Error al obtener las direcciones.' });
  }
}

/** Registra una nueva dirección de envío para el usuario autenticado. */
async function crearDireccion(req, res) {
  const { calle, numero, colonia, ciudad, estado, codigo_postal, pais, es_predeterminada } = req.body;

  if (!calle || !ciudad || !estado || !codigo_postal) {
    return res.status(400).json({ mensaje: 'calle, ciudad, estado y codigo_postal son requeridos.' });
  }

  try {
    const [resultado] = await pool.query(
      `INSERT INTO direcciones
         (id_usuario, calle, numero, colonia, ciudad, estado, codigo_postal, pais, es_predeterminada)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.usuario.id_usuario, calle, numero || null, colonia || null, ciudad,
       estado, codigo_postal, pais || 'México', !!es_predeterminada]
    );
    return res.status(201).json({ mensaje: 'Dirección registrada.', id_direccion: resultado.insertId });
  } catch (error) {
    console.error('Error al crear dirección:', error);
    return res.status(500).json({ mensaje: 'Error al registrar la dirección.' });
  }
}

module.exports = { listarDirecciones, crearDireccion };

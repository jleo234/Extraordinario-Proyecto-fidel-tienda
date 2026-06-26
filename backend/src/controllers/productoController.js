const pool = require('../config/db');

/**
 * Lista todos los productos activos. Permite filtrar por categoría
 * y ordenar por precio o nombre (visualización "de diferentes formas").
 * Query params opcionales: ?categoria=ID&orden=precio_asc|precio_desc|nombre
 */
async function listarProductos(req, res) {
  const { categoria, orden } = req.query;

  let sql = `
    SELECT p.id_producto, p.nombre, p.descripcion, p.precio, p.stock,
           p.imagen_url, c.nombre AS categoria
    FROM productos p
    JOIN categorias c ON p.id_categoria = c.id_categoria
    WHERE p.activo = TRUE
  `;
  const params = [];

  if (categoria) {
    sql += ' AND p.id_categoria = ?';
    params.push(categoria);
  }

  const ordenes = {
    precio_asc: ' ORDER BY p.precio ASC',
    precio_desc: ' ORDER BY p.precio DESC',
    nombre: ' ORDER BY p.nombre ASC'
  };
  sql += ordenes[orden] || ' ORDER BY p.fecha_creacion DESC';

  try {
    const [productos] = await pool.query(sql, params);
    return res.json(productos);
  } catch (error) {
    console.error('Error al listar productos:', error);
    return res.status(500).json({ mensaje: 'Error al obtener productos.' });
  }
}

/** Obtiene el detalle de un producto por su id. */
async function obtenerProducto(req, res) {
  const { id } = req.params;
  try {
    const [productos] = await pool.query(
      `SELECT p.*, c.nombre AS categoria
       FROM productos p JOIN categorias c ON p.id_categoria = c.id_categoria
       WHERE p.id_producto = ? AND p.activo = TRUE`,
      [id]
    );
    if (productos.length === 0) {
      return res.status(404).json({ mensaje: 'Producto no encontrado.' });
    }
    return res.json(productos[0]);
  } catch (error) {
    console.error('Error al obtener producto:', error);
    return res.status(500).json({ mensaje: 'Error al obtener el producto.' });
  }
}

/** Lista todas las categorías disponibles. */
async function listarCategorias(req, res) {
  try {
    const [categorias] = await pool.query('SELECT * FROM categorias');
    return res.json(categorias);
  } catch (error) {
    console.error('Error al listar categorías:', error);
    return res.status(500).json({ mensaje: 'Error al obtener categorías.' });
  }
}

module.exports = { listarProductos, obtenerProducto, listarCategorias };

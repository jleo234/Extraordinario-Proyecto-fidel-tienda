const pool = require('../config/db');

/** Obtiene (o crea, si no existe) el carrito activo del usuario autenticado. */
async function obtenerCarritoActivo(id_usuario) {
  const [carritos] = await pool.query(
    'SELECT id_carrito FROM carritos WHERE id_usuario = ? AND estado = "activo" LIMIT 1',
    [id_usuario]
  );
  if (carritos.length > 0) return carritos[0].id_carrito;

  const [resultado] = await pool.query(
    'INSERT INTO carritos (id_usuario, estado) VALUES (?, "activo")',
    [id_usuario]
  );
  return resultado.insertId;
}

/** Devuelve el contenido completo del carrito del usuario, con subtotales. */
async function verCarrito(req, res) {
  try {
    const id_carrito = await obtenerCarritoActivo(req.usuario.id_usuario);
    const [items] = await pool.query(
      `SELECT ci.id_item, ci.id_producto, p.nombre, p.imagen_url,
              ci.cantidad, ci.precio_unitario,
              (ci.cantidad * ci.precio_unitario) AS subtotal,
              p.stock
       FROM carrito_items ci
       JOIN productos p ON ci.id_producto = p.id_producto
       WHERE ci.id_carrito = ?`,
      [id_carrito]
    );
    const total = items.reduce((acc, it) => acc + Number(it.subtotal), 0);
    return res.json({ id_carrito, items, total });
  } catch (error) {
    console.error('Error al ver carrito:', error);
    return res.status(500).json({ mensaje: 'Error al obtener el carrito.' });
  }
}

/** Agrega un producto al carrito (o aumenta su cantidad si ya estaba). */
async function agregarProducto(req, res) {
  const { id_producto, cantidad } = req.body;

  if (!id_producto || !cantidad || cantidad <= 0) {
    return res.status(400).json({ mensaje: 'id_producto y cantidad (positiva) son requeridos.' });
  }

  try {
    const [productos] = await pool.query(
      'SELECT precio, stock FROM productos WHERE id_producto = ? AND activo = TRUE',
      [id_producto]
    );
    if (productos.length === 0) {
      return res.status(404).json({ mensaje: 'Producto no encontrado.' });
    }
    if (productos[0].stock < cantidad) {
      return res.status(409).json({ mensaje: 'No hay suficiente stock disponible.' });
    }

    const id_carrito = await obtenerCarritoActivo(req.usuario.id_usuario);

    // Si el producto ya está en el carrito, se actualiza la cantidad;
    // de lo contrario se inserta un nuevo renglón.
    await pool.query(
      `INSERT INTO carrito_items (id_carrito, id_producto, cantidad, precio_unitario)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE cantidad = cantidad + ?`,
      [id_carrito, id_producto, cantidad, productos[0].precio, cantidad]
    );

    return res.status(201).json({ mensaje: 'Producto agregado al carrito.' });
  } catch (error) {
    console.error('Error al agregar producto:', error);
    return res.status(500).json({ mensaje: 'Error al agregar el producto al carrito.' });
  }
}

/** Modifica la cantidad de un producto ya existente en el carrito. */
async function actualizarCantidad(req, res) {
  const { id_item } = req.params;
  const { cantidad } = req.body;

  if (!cantidad || cantidad <= 0) {
    return res.status(400).json({ mensaje: 'La cantidad debe ser mayor a 0.' });
  }

  try {
    const [resultado] = await pool.query(
      `UPDATE carrito_items ci
       JOIN carritos c ON ci.id_carrito = c.id_carrito
       SET ci.cantidad = ?
       WHERE ci.id_item = ? AND c.id_usuario = ?`,
      [cantidad, id_item, req.usuario.id_usuario]
    );
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Artículo del carrito no encontrado.' });
    }
    return res.json({ mensaje: 'Cantidad actualizada.' });
  } catch (error) {
    console.error('Error al actualizar cantidad:', error);
    return res.status(500).json({ mensaje: 'Error al actualizar la cantidad.' });
  }
}

/** Elimina un producto del carrito (permite "modificar la lista" del enunciado). */
async function eliminarProducto(req, res) {
  const { id_item } = req.params;
  try {
    const [resultado] = await pool.query(
      `DELETE ci FROM carrito_items ci
       JOIN carritos c ON ci.id_carrito = c.id_carrito
       WHERE ci.id_item = ? AND c.id_usuario = ?`,
      [id_item, req.usuario.id_usuario]
    );
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Artículo del carrito no encontrado.' });
    }
    return res.json({ mensaje: 'Producto eliminado del carrito.' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    return res.status(500).json({ mensaje: 'Error al eliminar el producto del carrito.' });
  }
}

module.exports = { verCarrito, agregarProducto, actualizarCantidad, eliminarProducto, obtenerCarritoActivo };

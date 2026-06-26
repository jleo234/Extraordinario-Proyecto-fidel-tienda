const pool = require('../config/db');
const { obtenerCarritoActivo } = require('./carritoController');

/**
 * Confirma la compra: convierte el carrito activo en un pedido,
 * descuenta el stock de cada producto y marca el carrito como finalizado.
 * Todo dentro de una transacción para garantizar consistencia
 * (si algo falla, no se descuenta stock a medias).
 */
async function crearPedido(req, res) {
  const { id_direccion } = req.body;
  if (!id_direccion) {
    return res.status(400).json({ mensaje: 'id_direccion es requerido.' });
  }

  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    const id_carrito = await obtenerCarritoActivo(req.usuario.id_usuario);

    const [items] = await conexion.query(
      `SELECT ci.id_producto, ci.cantidad, ci.precio_unitario, p.stock, p.nombre
       FROM carrito_items ci
       JOIN productos p ON ci.id_producto = p.id_producto
       WHERE ci.id_carrito = ?`,
      [id_carrito]
    );

    if (items.length === 0) {
      await conexion.rollback();
      return res.status(400).json({ mensaje: 'El carrito está vacío.' });
    }

    // Verificar que la dirección pertenezca al usuario autenticado
    const [direcciones] = await conexion.query(
      'SELECT id_direccion FROM direcciones WHERE id_direccion = ? AND id_usuario = ?',
      [id_direccion, req.usuario.id_usuario]
    );
    if (direcciones.length === 0) {
      await conexion.rollback();
      return res.status(404).json({ mensaje: 'Dirección no encontrada para este usuario.' });
    }

    // Verificar stock suficiente para todos los productos antes de continuar
    for (const item of items) {
      if (item.stock < item.cantidad) {
        await conexion.rollback();
        return res.status(409).json({
          mensaje: `Stock insuficiente para "${item.nombre}". Disponible: ${item.stock}.`
        });
      }
    }

    const total = items.reduce((acc, it) => acc + it.cantidad * Number(it.precio_unitario), 0);

    const [pedidoResultado] = await conexion.query(
      `INSERT INTO pedidos (id_usuario, id_direccion, estado, total)
       VALUES (?, ?, 'pagado', ?)`,
      [req.usuario.id_usuario, id_direccion, total]
    );
    const id_pedido = pedidoResultado.insertId;

    for (const item of items) {
      const subtotal = item.cantidad * Number(item.precio_unitario);
      await conexion.query(
        `INSERT INTO pedido_items (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [id_pedido, item.id_producto, item.cantidad, item.precio_unitario, subtotal]
      );

      // Actualiza la existencia del producto (requisito del enunciado:
      // "la información de existencia... actualizada cada vez que el
      // cliente realice una compra").
      await conexion.query(
        'UPDATE productos SET stock = stock - ? WHERE id_producto = ?',
        [item.cantidad, item.id_producto]
      );
    }

    await conexion.query(
      'UPDATE carritos SET estado = "finalizado" WHERE id_carrito = ?',
      [id_carrito]
    );

    await conexion.commit();

    return res.status(201).json({
      mensaje: 'Pedido creado correctamente.',
      id_pedido,
      total
    });
  } catch (error) {
    await conexion.rollback();
    console.error('Error al crear pedido:', error);
    return res.status(500).json({ mensaje: 'Error interno al procesar el pedido.' });
  } finally {
    conexion.release();
  }
}

/** Lista el historial de pedidos del usuario autenticado. */
async function listarPedidos(req, res) {
  try {
    const [pedidos] = await pool.query(
      `SELECT id_pedido, fecha_pedido, estado, total
       FROM pedidos WHERE id_usuario = ? ORDER BY fecha_pedido DESC`,
      [req.usuario.id_usuario]
    );
    return res.json(pedidos);
  } catch (error) {
    console.error('Error al listar pedidos:', error);
    return res.status(500).json({ mensaje: 'Error al obtener los pedidos.' });
  }
}

/** Detalle de un pedido específico (solo si pertenece al usuario). */
async function obtenerPedido(req, res) {
  const { id } = req.params;
  try {
    const [pedidos] = await pool.query(
      `SELECT p.*, d.calle, d.numero, d.colonia, d.ciudad, d.estado AS estado_direccion, d.codigo_postal
       FROM pedidos p JOIN direcciones d ON p.id_direccion = d.id_direccion
       WHERE p.id_pedido = ? AND p.id_usuario = ?`,
      [id, req.usuario.id_usuario]
    );
    if (pedidos.length === 0) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado.' });
    }
    const [detalle] = await pool.query(
      `SELECT pi.id_producto, pr.nombre, pi.cantidad, pi.precio_unitario, pi.subtotal
       FROM pedido_items pi JOIN productos pr ON pi.id_producto = pr.id_producto
       WHERE pi.id_pedido = ?`,
      [id]
    );
    return res.json({ ...pedidos[0], items: detalle });
  } catch (error) {
    console.error('Error al obtener pedido:', error);
    return res.status(500).json({ mensaje: 'Error al obtener el pedido.' });
  }
}

module.exports = { crearPedido, listarPedidos, obtenerPedido };

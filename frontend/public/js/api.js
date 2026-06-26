/**
 * api.js — Capa de comunicación con el backend (API REST).
 * Centraliza las llamadas fetch y el manejo del token JWT.
 */

const API_BASE = '/api';

function obtenerToken() {
  return window.__sesion?.token || null;
}

async function solicitar(ruta, { metodo = 'GET', cuerpo = null, autenticado = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (autenticado) {
    const token = obtenerToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const respuesta = await fetch(`${API_BASE}${ruta}`, {
    method: metodo,
    headers,
    body: cuerpo ? JSON.stringify(cuerpo) : undefined
  });

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    const error = new Error(datos.mensaje || 'Ocurrió un error en la solicitud.');
    error.detalles = datos;
    error.status = respuesta.status;
    throw error;
  }

  return datos;
}

const api = {
  registrar: (datos) => solicitar('/auth/registro', { metodo: 'POST', cuerpo: datos }),
  iniciarSesion: (datos) => solicitar('/auth/login', { metodo: 'POST', cuerpo: datos }),

  listarProductos: (params = '') => solicitar(`/productos${params}`),
  listarCategorias: () => solicitar('/productos/categorias'),

  verCarrito: () => solicitar('/carrito', { autenticado: true }),
  agregarAlCarrito: (id_producto, cantidad = 1) =>
    solicitar('/carrito', { metodo: 'POST', cuerpo: { id_producto, cantidad }, autenticado: true }),
  actualizarCantidadCarrito: (id_item, cantidad) =>
    solicitar(`/carrito/${id_item}`, { metodo: 'PUT', cuerpo: { cantidad }, autenticado: true }),
  eliminarDelCarrito: (id_item) =>
    solicitar(`/carrito/${id_item}`, { metodo: 'DELETE', autenticado: true }),

  crearDireccion: (datos) => solicitar('/direcciones', { metodo: 'POST', cuerpo: datos, autenticado: true }),
  crearPedido: (id_direccion) => solicitar('/pedidos', { metodo: 'POST', cuerpo: { id_direccion }, autenticado: true })
};

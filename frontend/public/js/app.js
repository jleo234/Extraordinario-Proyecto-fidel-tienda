/**
 * app.js — Lógica de la interfaz: estado de sesión, catálogo,
 * carrito y checkout. Prototipo funcional (login/registro reales
 * contra la API; el resto de funcionalidades del enunciado se
 * representan en este prototipo de interfaz).
 */

window.__sesion = JSON.parse(localStorage.getItem('sesion') || 'null');

const ICONOS_CATEGORIA = {
  'Electrónica': '🎧',
  'Ropa': '👕',
  'Hogar': '🏠',
  'Deportes': '⚽'
};

let estado = {
  productos: [],
  categorias: [],
  categoriaActiva: '',
  orden: '',
  carrito: { items: [], total: 0 }
};

/* ---------------------------------------------------------------- */
/* Utilidades de sesión                                             */
/* ---------------------------------------------------------------- */
function guardarSesion(sesion) {
  window.__sesion = sesion;
  localStorage.setItem('sesion', JSON.stringify(sesion));
  actualizarUISesion();
}

function cerrarSesion() {
  window.__sesion = null;
  localStorage.removeItem('sesion');
  estado.carrito = { items: [], total: 0 };
  renderCarrito();
  actualizarUISesion();
}

function actualizarUISesion() {
  const saludo = document.getElementById('saludoUsuario');
  const btnLogin = document.getElementById('btnLogin');
  const btnLogout = document.getElementById('btnLogout');

  if (window.__sesion) {
    saludo.textContent = `Hola, ${window.__sesion.usuario.nombre}`;
    saludo.style.display = 'inline';
    btnLogin.style.display = 'none';
    btnLogout.style.display = 'inline-block';
    cargarCarrito();
  } else {
    saludo.style.display = 'none';
    btnLogin.style.display = 'inline-block';
    btnLogout.style.display = 'none';
  }
}

/* ---------------------------------------------------------------- */
/* Catálogo de productos                                            */
/* ---------------------------------------------------------------- */
async function cargarCategorias() {
  try {
    estado.categorias = await api.listarCategorias();
    const contenedor = document.getElementById('filtrosCategoria');
    estado.categorias.forEach((cat) => {
      const chip = document.createElement('button');
      chip.className = 'chip';
      chip.dataset.categoria = cat.id_categoria;
      chip.textContent = cat.nombre;
      chip.addEventListener('click', () => seleccionarCategoria(cat.id_categoria, chip));
      contenedor.insertBefore(chip, document.getElementById('selectOrden'));
    });
  } catch (error) {
    console.error('No se pudieron cargar las categorías:', error);
  }
}

function seleccionarCategoria(idCategoria, elementoChip) {
  estado.categoriaActiva = idCategoria;
  document.querySelectorAll('.chip').forEach((c) => c.classList.remove('activo'));
  elementoChip.classList.add('activo');
  cargarProductos();
}

async function cargarProductos() {
  const params = new URLSearchParams();
  if (estado.categoriaActiva) params.set('categoria', estado.categoriaActiva);
  if (estado.orden) params.set('orden', estado.orden);

  try {
    estado.productos = await api.listarProductos(`?${params.toString()}`);
    renderProductos();
  } catch (error) {
    console.error('No se pudieron cargar los productos:', error);
    document.getElementById('gridProductos').innerHTML =
      '<p style="color: var(--color-texto-suave);">No fue posible cargar el catálogo. Verifica que el servidor y la base de datos estén activos.</p>';
  }
}

function renderProductos() {
  const grid = document.getElementById('gridProductos');
  const texto = document.getElementById('campoBusqueda').value.trim().toLowerCase();

  const visibles = estado.productos.filter((p) => p.nombre.toLowerCase().includes(texto));

  if (visibles.length === 0) {
    grid.innerHTML = `<div class="estado-vacio" style="grid-column:1/-1;">
      <div class="icono-vacio">🔍</div><p>No encontramos productos con ese criterio.</p></div>`;
    return;
  }

  grid.innerHTML = visibles.map((p) => `
    <article class="tarjeta-producto">
      <div class="imagen">${ICONOS_CATEGORIA[p.categoria] || '📦'}</div>
      <div class="info">
        <span class="categoria-tag">${p.categoria}</span>
        <h3>${p.nombre}</h3>
        <span class="stock">${p.stock > 0 ? p.stock + ' disponibles' : 'Sin stock'}</span>
        <span class="precio">$${Number(p.precio).toFixed(2)}</span>
        <button class="boton boton-primario" data-id="${p.id_producto}" ${p.stock === 0 ? 'disabled' : ''}>
          Agregar al carrito
        </button>
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('button[data-id]').forEach((btn) => {
    btn.addEventListener('click', () => agregarAlCarrito(Number(btn.dataset.id)));
  });
}

/* ---------------------------------------------------------------- */
/* Carrito                                                           */
/* ---------------------------------------------------------------- */
async function agregarAlCarrito(idProducto) {
  if (!window.__sesion) {
    abrirModalAuth('login');
    return;
  }
  try {
    await api.agregarAlCarrito(idProducto, 1);
    await cargarCarrito();
    abrirPanelCarrito();
  } catch (error) {
    alert(error.message);
  }
}

async function cargarCarrito() {
  if (!window.__sesion) return;
  try {
    estado.carrito = await api.verCarrito();
    renderCarrito();
  } catch (error) {
    console.error('No se pudo cargar el carrito:', error);
  }
}

function renderCarrito() {
  const lista = document.getElementById('listaItemsCarrito');
  const contador = document.getElementById('contadorCarrito');
  const totalCantidad = estado.carrito.items.reduce((acc, it) => acc + it.cantidad, 0);

  contador.textContent = totalCantidad;
  contador.style.display = totalCantidad > 0 ? 'inline-block' : 'none';

  if (estado.carrito.items.length === 0) {
    lista.innerHTML = `<div class="estado-vacio">
      <div class="icono-vacio">🛒</div>
      <p>Tu carrito está vacío.<br>Agrega productos del catálogo.</p></div>`;
  } else {
    lista.innerHTML = estado.carrito.items.map((it) => `
      <div class="item-carrito" data-item="${it.id_item}">
        <div class="icono">📦</div>
        <div class="detalle">
          <h4>${it.nombre}</h4>
          <span>$${Number(it.precio_unitario).toFixed(2)} c/u</span>
          <div class="controles-cantidad">
            <button class="restar">−</button>
            <span>${it.cantidad}</span>
            <button class="sumar">+</button>
            <button class="quitar">Quitar</button>
          </div>
        </div>
      </div>
    `).join('');

    lista.querySelectorAll('.item-carrito').forEach((el) => {
      const idItem = Number(el.dataset.item);
      const item = estado.carrito.items.find((it) => it.id_item === idItem);

      el.querySelector('.sumar').addEventListener('click', () => cambiarCantidad(idItem, item.cantidad + 1));
      el.querySelector('.restar').addEventListener('click', () => {
        if (item.cantidad > 1) cambiarCantidad(idItem, item.cantidad - 1);
      });
      el.querySelector('.quitar').addEventListener('click', () => quitarDelCarrito(idItem));
    });
  }

  document.getElementById('totalCarrito').textContent = `$${Number(estado.carrito.total).toFixed(2)}`;
}

async function cambiarCantidad(idItem, nuevaCantidad) {
  try {
    await api.actualizarCantidadCarrito(idItem, nuevaCantidad);
    await cargarCarrito();
  } catch (error) {
    alert(error.message);
  }
}

async function quitarDelCarrito(idItem) {
  try {
    await api.eliminarDelCarrito(idItem);
    await cargarCarrito();
  } catch (error) {
    alert(error.message);
  }
}

function abrirPanelCarrito() {
  document.getElementById('panelCarrito').classList.add('abierto');
  document.getElementById('fondoCarrito').classList.add('visible');
}
function cerrarPanelCarrito() {
  document.getElementById('panelCarrito').classList.remove('abierto');
  document.getElementById('fondoCarrito').classList.remove('visible');
}

/* ---------------------------------------------------------------- */
/* Autenticación (modal login / registro)                           */
/* ---------------------------------------------------------------- */
let modoAuth = 'login';

function abrirModalAuth(modo = 'login') {
  modoAuth = modo;
  actualizarFormularioAuth();
  document.getElementById('modalAuth').style.display = 'flex';
  document.getElementById('fondoModalAuth').classList.add('visible');
}
function cerrarModalAuth() {
  document.getElementById('modalAuth').style.display = 'none';
  document.getElementById('fondoModalAuth').classList.remove('visible');
  document.getElementById('errorAuth').classList.remove('visible');
  document.getElementById('exitoAuth').classList.remove('visible');
}

function actualizarFormularioAuth() {
  const esLogin = modoAuth === 'login';
  document.getElementById('tituloAuth').textContent = esLogin ? 'Iniciar sesión' : 'Crear cuenta';
  document.getElementById('subtituloAuth').textContent = esLogin
    ? 'Accede a tu cuenta para continuar tu compra.'
    : 'Regístrate para guardar tus direcciones y pedidos.';
  document.getElementById('formLogin').style.display = esLogin ? 'block' : 'none';
  document.getElementById('formRegistro').style.display = esLogin ? 'none' : 'block';
  document.getElementById('textoCambio').textContent = esLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?';
  document.getElementById('enlaceCambiarModo').textContent = esLogin ? 'Regístrate' : 'Inicia sesión';
}

function mostrarErrorAuth(mensaje) {
  const el = document.getElementById('errorAuth');
  el.textContent = mensaje;
  el.classList.add('visible');
}

/* ---------------------------------------------------------------- */
/* Inicialización y listeners                                       */
/* ---------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  actualizarUISesion();
  cargarCategorias();
  cargarProductos();

  document.getElementById('btnLogin').addEventListener('click', () => abrirModalAuth('login'));
  document.getElementById('btnLogout').addEventListener('click', cerrarSesion);
  document.getElementById('fondoModalAuth').addEventListener('click', cerrarModalAuth);

  document.getElementById('enlaceCambiarModo').addEventListener('click', (e) => {
    e.preventDefault();
    modoAuth = modoAuth === 'login' ? 'registro' : 'login';
    actualizarFormularioAuth();
  });

  document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('errorAuth').classList.remove('visible');
    try {
      const datos = await api.iniciarSesion({
        correo: document.getElementById('loginCorreo').value,
        contrasena: document.getElementById('loginContrasena').value
      });
      guardarSesion(datos);
      cerrarModalAuth();
    } catch (error) {
      mostrarErrorAuth(error.message);
    }
  });

  document.getElementById('formRegistro').addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('errorAuth').classList.remove('visible');
    try {
      await api.registrar({
        nombre: document.getElementById('regNombre').value,
        apellido: document.getElementById('regApellido').value,
        correo: document.getElementById('regCorreo').value,
        contrasena: document.getElementById('regContrasena').value
      });
      const exito = document.getElementById('exitoAuth');
      exito.textContent = 'Cuenta creada. Ahora inicia sesión.';
      exito.classList.add('visible');
      modoAuth = 'login';
      actualizarFormularioAuth();
    } catch (error) {
      mostrarErrorAuth(error.message);
    }
  });

  document.getElementById('campoBusqueda').addEventListener('input', renderProductos);
  document.getElementById('selectOrden').addEventListener('change', (e) => {
    estado.orden = e.target.value;
    cargarProductos();
  });

  document.getElementById('btnAbrirCarrito').addEventListener('click', () => {
    if (!window.__sesion) { abrirModalAuth('login'); return; }
    abrirPanelCarrito();
  });
  document.getElementById('btnCerrarCarrito').addEventListener('click', cerrarPanelCarrito);
  document.getElementById('fondoCarrito').addEventListener('click', cerrarPanelCarrito);

  document.getElementById('btnIrCheckout').addEventListener('click', () => {
    if (estado.carrito.items.length === 0) { alert('Tu carrito está vacío.'); return; }
    cerrarPanelCarrito();
    document.getElementById('modalCheckout').style.display = 'flex';
    document.getElementById('fondoCheckout').classList.add('visible');
  });
  document.getElementById('fondoCheckout').addEventListener('click', () => {
    document.getElementById('modalCheckout').style.display = 'none';
    document.getElementById('fondoCheckout').classList.remove('visible');
  });

  document.getElementById('formCheckout').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('errorCheckout');
    errorEl.classList.remove('visible');
    try {
      const direccion = await api.crearDireccion({
        calle: document.getElementById('checkoutCalle').value,
        numero: document.getElementById('checkoutNumero').value,
        colonia: document.getElementById('checkoutColonia').value,
        ciudad: document.getElementById('checkoutCiudad').value,
        estado: document.getElementById('checkoutEstado').value,
        codigo_postal: document.getElementById('checkoutCP').value
      });
      await api.crearPedido(direccion.id_direccion);

      document.getElementById('modalCheckout').style.display = 'none';
      document.getElementById('fondoCheckout').classList.remove('visible');
      alert('¡Pedido confirmado! Gracias por tu compra.');

      await cargarCarrito();
      await cargarProductos();
    } catch (error) {
      errorEl.textContent = error.message;
      errorEl.classList.add('visible');
    }
  });
});

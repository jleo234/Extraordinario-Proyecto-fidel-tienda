const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const productoRoutes = require('./routes/productoRoutes');
const carritoRoutes = require('./routes/carritoRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');
const direccionRoutes = require('./routes/direccionRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Sirve el frontend (prototipo de interfaz) como archivos estáticos
app.use(express.static(path.join(__dirname, '../../frontend/public')));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/carrito', carritoRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/direcciones', direccionRoutes);

app.get('/api/salud', (req, res) => {
  res.json({ estado: 'ok', mensaje: 'API de Tienda Online funcionando correctamente.' });
});

// Manejo de rutas no encontradas dentro de la API
app.use('/api', (req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = app;

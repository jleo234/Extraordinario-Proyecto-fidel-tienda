-- =====================================================================
-- Base de Datos: tienda_online
-- Proyecto: Desarrollo e Implementación de Sistemas
-- Descripción: Script de creación de la base de datos para una tienda
--              en línea con gestión de usuarios, productos, carrito,
--              pedidos y envíos.
-- =====================================================================

SET NAMES utf8mb4;

DROP DATABASE IF EXISTS tienda_online;
CREATE DATABASE tienda_online CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tienda_online;

-- ---------------------------------------------------------------------
-- Tabla: usuarios
-- Almacena las cuentas de los clientes que pueden iniciar sesión.
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
    id_usuario      INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    apellido        VARCHAR(100) NOT NULL,
    correo          VARCHAR(150) NOT NULL UNIQUE,
    contrasena_hash VARCHAR(255) NOT NULL,
    telefono        VARCHAR(20),
    fecha_registro  DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo          BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Tabla: direcciones
-- Direcciones de envío asociadas a un usuario (1 usuario : N direcciones)
-- ---------------------------------------------------------------------
CREATE TABLE direcciones (
    id_direccion    INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario      INT NOT NULL,
    calle           VARCHAR(150) NOT NULL,
    numero          VARCHAR(20),
    colonia         VARCHAR(100),
    ciudad          VARCHAR(100) NOT NULL,
    estado          VARCHAR(100) NOT NULL,
    codigo_postal   VARCHAR(10) NOT NULL,
    pais            VARCHAR(100) DEFAULT 'México',
    es_predeterminada BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_direccion_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Tabla: categorias
-- Categorías de productos (1 categoría : N productos)
-- ---------------------------------------------------------------------
CREATE TABLE categorias (
    id_categoria    INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL UNIQUE,
    descripcion     VARCHAR(255)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Tabla: productos
-- Catálogo de productos disponibles en la tienda.
-- ---------------------------------------------------------------------
CREATE TABLE productos (
    id_producto     INT AUTO_INCREMENT PRIMARY KEY,
    id_categoria    INT NOT NULL,
    nombre          VARCHAR(150) NOT NULL,
    descripcion     TEXT,
    precio          DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
    stock           INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    imagen_url      VARCHAR(255),
    fecha_creacion  DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo          BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_producto_categoria FOREIGN KEY (id_categoria)
        REFERENCES categorias(id_categoria) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Tabla: carritos
-- Un carrito activo por usuario (1 usuario : 1 carrito activo)
-- ---------------------------------------------------------------------
CREATE TABLE carritos (
    id_carrito      INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario      INT NOT NULL,
    fecha_creacion  DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado          ENUM('activo', 'finalizado', 'abandonado') DEFAULT 'activo',
    CONSTRAINT fk_carrito_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Tabla: carrito_items
-- Relación N:M entre carritos y productos, con cantidad seleccionada.
-- ---------------------------------------------------------------------
CREATE TABLE carrito_items (
    id_item         INT AUTO_INCREMENT PRIMARY KEY,
    id_carrito      INT NOT NULL,
    id_producto     INT NOT NULL,
    cantidad        INT NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_item_carrito FOREIGN KEY (id_carrito)
        REFERENCES carritos(id_carrito) ON DELETE CASCADE,
    CONSTRAINT fk_item_producto FOREIGN KEY (id_producto)
        REFERENCES productos(id_producto) ON DELETE RESTRICT,
    CONSTRAINT uq_carrito_producto UNIQUE (id_carrito, id_producto)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Tabla: pedidos
-- Pedido generado al confirmar la compra (1 usuario : N pedidos)
-- ---------------------------------------------------------------------
CREATE TABLE pedidos (
    id_pedido       INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario      INT NOT NULL,
    id_direccion    INT NOT NULL,
    fecha_pedido    DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado          ENUM('pendiente','pagado','enviado','entregado','cancelado') DEFAULT 'pendiente',
    total           DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_pedido_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
    CONSTRAINT fk_pedido_direccion FOREIGN KEY (id_direccion)
        REFERENCES direcciones(id_direccion) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Tabla: pedido_items
-- Detalle de productos comprados en cada pedido (N:M pedidos-productos)
-- ---------------------------------------------------------------------
CREATE TABLE pedido_items (
    id_pedido_item  INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido       INT NOT NULL,
    id_producto     INT NOT NULL,
    cantidad        INT NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal        DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_pedidoitem_pedido FOREIGN KEY (id_pedido)
        REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    CONSTRAINT fk_pedidoitem_producto FOREIGN KEY (id_producto)
        REFERENCES productos(id_producto) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- =====================================================================
-- Índices adicionales para mejorar el rendimiento de las consultas
-- =====================================================================
CREATE INDEX idx_productos_categoria ON productos(id_categoria);
CREATE INDEX idx_pedidos_usuario ON pedidos(id_usuario);
CREATE INDEX idx_carrito_usuario ON carritos(id_usuario);

-- =====================================================================
-- Datos de prueba (seed)
-- =====================================================================
INSERT INTO categorias (nombre, descripcion) VALUES
('Electrónica', 'Dispositivos y accesorios electrónicos'),
('Ropa', 'Prendas de vestir para todas las edades'),
('Hogar', 'Artículos para el hogar y decoración'),
('Deportes', 'Equipo y ropa deportiva');

INSERT INTO productos (id_categoria, nombre, descripcion, precio, stock, imagen_url) VALUES
(1, 'Audífonos Bluetooth', 'Audífonos inalámbricos con cancelación de ruido', 599.00, 25, '/img/audifonos.png'),
(1, 'Teclado Mecánico', 'Teclado mecánico retroiluminado RGB', 899.00, 15, '/img/teclado.png'),
(1, 'Mouse Inalámbrico', 'Mouse óptico inalámbrico ergonómico', 299.00, 40, '/img/mouse.png'),
(2, 'Playera Básica', 'Playera de algodón 100%, varios colores', 199.00, 100, '/img/playera.png'),
(2, 'Chamarra Impermeable', 'Chamarra ligera resistente al agua', 749.00, 30, '/img/chamarra.png'),
(3, 'Lámpara LED de Escritorio', 'Lámpara regulable con puerto USB', 349.00, 20, '/img/lampara.png'),
(3, 'Set de Vasos', 'Juego de 6 vasos de vidrio', 250.00, 50, '/img/vasos.png'),
(4, 'Balón de Fútbol', 'Balón oficial talla 5', 450.00, 35, '/img/balon.png');

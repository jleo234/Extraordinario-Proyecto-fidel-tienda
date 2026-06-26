# Tianguis Digital — Tienda en Línea

Proyecto práctico desarrollado para la materia **Desarrollo e Implementación de Sistemas**. Consiste en una aplicación web de comercio electrónico (e-commerce) que integra registro e inicio de sesión de usuarios, catálogo dinámico de productos, gestión de carrito de compras, procesamiento de checkout y control automático de inventario. El sistema está construido con una arquitectura moderna utilizando **Node.js + Express** en el backend y **MySQL** gestionado localmente.

> La documentación detallada (con diagramas de arquitectura, especificación de requisitos y modelado completo de datos) se encuentra disponible en el archivo [`docs/Proyecto_Desarrollo_e_Implementacion_de_Sistemas.docx`](./docs/Proyecto_Desarrollo_e_Implementacion_de_Sistemas.docx). Este documento sirve como guía rápida para el despliegue y puesta en marcha del proyecto.

---

## Tabla de contenido

- [Introducción](#introducción)
- [Resumen del sistema](#resumen-del-sistema)
- [Requisitos](#requisitos)
- [Casos de uso](#casos-de-uso)
- [Entidades y diagrama entidad-relación](#entidades-y-diagrama-entidad-relación)
- [Arquitectura del sistema](#arquitectura-del-sistema)
- [Diseño de interfaz](#diseño-de-interfaz)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Instalación y configuración](#instalación-y-configuración)
- [Uso y operación del sistema](#uso-y-operación-del-sistema)
- [Base de datos](#base-de-datos)
- [Conclusión](#conclusión)

---

## Introducción

Tianguis Digital es una solución de software que cubre el flujo completo de una compra en línea. Permite a los clientes crear una cuenta, autenticarse de manera segura, explorar un catálogo interactivo de productos con filtros avanzados, gestionar sus artículos en un carrito interactivo, registrar sus direcciones de entrega y consolidar su orden mediante un proceso de checkout que actualiza el inventario en tiempo real.

---

## Resumen del sistema

- **Autenticación Segura:** Registro e inicio de sesión con cifrado de contraseñas mediante hash síncrono (bcrypt) y manejo de sesiones con JSON Web Tokens (JWT).
- **Catálogo Dinámico:** Navegación de productos con filtros por categoría y ordenamiento personalizado por precio o nombre.
- **Carrito Persistente:** Gestión del estado del carrito por usuario (operaciones para agregar, modificar cantidades y remover elementos).
- **Procesamiento de Pedidos:** Flujo de checkout que genera la orden de compra y descuenta el stock de productos de manera segura dentro de una transacción SQL.
- **Historial:** Sección dedicada para que cada usuario consulte sus compras previas.

---

## Requisitos

### Funcionales
1. Registro de clientes y perfiles de usuario.
2. Inicio de sesión seguro.
3. Catálogo público de productos consultable sin autenticación.
4. Filtros y ordenamiento del catálogo en el frontend.
5. Carrito de compras reactivo (agregar, actualizar y eliminar ítems).
6. Módulo de gestión para direcciones de envío.
7. Confirmación de compra (proceso de checkout).
8. Actualización automática y síncrona del inventario disponible.
9. Historial de pedidos realizados.

### No funcionales
- **Seguridad:** Resguardo de credenciales con bcrypt y protección de endpoints del lado del servidor mediante middlewares de JWT.
- **Consistencia:** Uso estricto de transacciones SQL durante el checkout para evitar la corrupción de stock o pedidos incompletos.
- **Optimización:** Conexión eficiente a la base de datos mediante un pool de conexiones reutilizables.
- **Mantenibilidad:** Separación clara de responsabilidades siguiendo el patrón de rutas, controladores y middlewares.

### Técnicos

| Componente | Tecnología | Versión recomendada |
|---|---|---|
| Entorno de ejecución | Node.js | 18.x o superior |
| Framework backend | Express.js | 4.19.x |
| Base de datos | MySQL (vía XAMPP / MariaDB) | 8.0 / 10.11+ |
| Cliente de BD | `mysql2` (promesas) | 3.10.x |
| Autenticación | `jsonwebtoken` + `bcryptjs` | 9.x / 2.4.x |
| Frontend | HTML5, CSS3, JavaScript (Vanilla) | Estándar moderno |

---

## Casos de uso

![Diagrama de casos de uso](./docs/diagramas/diagrama_casos_de_uso.png)

| Caso de uso | Actor | Descripción |
|---|---|---|
| Registrarse | Cliente | Crea una cuenta proporcionando sus datos personales básicos. |
| Iniciar sesión | Cliente | Se autentica en la plataforma mediante correo y contraseña. |
| Consultar catálogo | Cliente / Visitante | Explora el listado general de artículos disponibles. |
| Filtrar/ordenar productos | Cliente / Visitante | Acota los resultados visuales según su preferencia o categoría. |
| Agregar al carrito | Cliente | Añade un producto y define la cantidad dentro de su carrito activo. |
| Modificar cantidad | Cliente | Actualiza las unidades de un artículo directamente desde el carrito. |
| Eliminar del carrito | Cliente | Retira un artículo de la lista actual de compras. |
| Registrar dirección | Cliente | Guarda una dirección física para la entrega de mercancía. |
| Confirmar compra | Cliente | Valida la orden, genera el pedido y descuenta el stock correspondiente. |
| Consultar historial | Cliente | Revisa el estatus y detalle de sus transacciones anteriores. |

---

## Entidades y diagrama entidad-relación

![Diagrama entidad-relación](./docs/diagramas/diagrama_entidad_relacion.png)

El modelo relacional está compuesto por 8 tablas interconectadas: `usuarios`, `direcciones`, `categorias`, `productos`, `carritos`, `carrito_items`, `pedidos` y `pedido_items`. Las restricciones de integridad y la estructura exacta se encuentran descritas en el script de inicialización [`backend/src/db/schema.sql`](./backend/src/db/schema.sql).

---

## Arquitectura del sistema

![Diagrama de arquitectura](./docs/diagramas/diagrama_arquitectura.png)

El sistema se diseñó bajo una arquitectura clásica de tres capas independiente:
- **Capa de Presentación:** Interfaz construida en HTML, CSS y JavaScript Vanilla (ubicada en `frontend/public`), la cual se comunica de manera asíncrona con el backend mediante la API nativa `fetch`.
- **Capa de Lógica de Negocio:** Servidor estructurado en Node.js y Express (ubicado en `backend/src`), encargado de interceptar las peticiones, validar la seguridad mediante middlewares e invocar los controladores correspondientes.
- **Capa de Datos:** Persistencia administrada en un motor relacional MySQL, utilizando pools de conexión para maximizar el rendimiento de las consultas.

---

## Diseño de interfaz

El prototipo visual fue desarrollado con un enfoque responsivo y limpio bajo la identidad de "Tianguis Digital". Cuenta con una paleta cromática cálida (tonos arena, terracota y verde aguacate) y una cuidada selección tipográfica (Fraunces para títulos, Inter para textos generales y JetBrains Mono para elementos numéricos), garantizando una experiencia de usuario fluida tanto en dispositivos móviles como en computadoras de escritorio.

---

## Estructura del proyecto
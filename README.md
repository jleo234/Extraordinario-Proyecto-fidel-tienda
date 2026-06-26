# Tianguis Digital — Tienda en Línea

Proyecto de la materia **Desarrollo e Implementación de Sistemas**. Es un sistema de tienda en línea (e-commerce) que cuenta con registro e inicio de sesión de usuarios, catálogo de productos, carrito de compras y control de inventario. 

El backend está hecho con **Node.js y Express**, y la base de datos funciona con **MySQL**.

> **Nota:** El documento de Word con toda la teoría del proyecto (diagramas, casos de uso, requisitos y el modelo de la base de datos) se encuentra dentro de la carpeta `docs`. Aquí abajo solo dejo los pasos para poder correr el proyecto en la computadora.

## Resumen de lo que hace el sistema

- Registro y login de usuarios (las contraseñas se guardan encriptadas).
- Catálogo de productos que se puede filtrar y ordenar.
- Carrito de compras funcional para cada usuario.
- Opción para registrar direcciones de envío.
- Simulación de compra que descuenta los productos del inventario en la base de datos.
- Historial de pedidos.

## Herramientas utilizadas

- **Backend:** Node.js, Express.js.
- **Base de datos:** MySQL (corriendo en XAMPP).
- **Seguridad:** jsonwebtoken (JWT) para las sesiones y bcryptjs para las contraseñas.
- **Frontend:** HTML, CSS y JavaScript puro.

## Pasos para instalar y correr el proyecto localmente

### 1. Preparar la Base de Datos
1. Abre XAMPP y enciende los módulos de **Apache** y **MySQL**.
2. Entra a `http://localhost/phpmyadmin` en tu navegador.
3. El código para crear las tablas y los productos de prueba está en el archivo `backend/src/db/schema.sql`. Copia todo ese código, pégalo en la pestaña SQL de phpMyAdmin y ejecútalo.

### 2. Configurar el Backend
Abre la terminal en la carpeta del proyecto y entra a la carpeta del backend:
```bash
cd backend
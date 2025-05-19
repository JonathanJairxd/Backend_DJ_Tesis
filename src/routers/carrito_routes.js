import { Router } from 'express';
import { agregarAlCarrito, obtenerCarrito, actualizarCantidad, eliminarDelCarrito } from '../controllers/carrito_controller.js';
import verificarAutenticacion from '../middlewares/autenticacion.js';

const router = Router();

// Ruta para agregar un producto al carrito
router.post('/carrito/agregar', verificarAutenticacion, agregarAlCarrito);

// Ruta para obtener el carrito de un cliente
router.get('/carrito', verificarAutenticacion, obtenerCarrito);

// Ruta para actualizar la cantidad de un producto en el carrito
router.put('/carrito/actualizar', verificarAutenticacion, actualizarCantidad);

// Ruta para eliminar un producto del carrito
router.delete('/carrito/eliminar/:productoId', verificarAutenticacion, eliminarDelCarrito);

export default router;

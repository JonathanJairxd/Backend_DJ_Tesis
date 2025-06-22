import { Router } from 'express';
import { agregarAlCarrito, obtenerCarrito, actualizarCantidad, eliminarDelCarrito } from '../controllers/carrito_controller.js';
import verificarAutenticacion from '../middlewares/autenticacion.js';

const router = Router();

// Agregar productos al carrito
router.post('/carrito/agregar', verificarAutenticacion, agregarAlCarrito);

// Visualizar el carrito de un cliente
router.get('/carrito', verificarAutenticacion, obtenerCarrito);

// Actualizar la cantidad de un producto en el carrito
router.put('/carrito/actualizar', verificarAutenticacion, actualizarCantidad);

// Eliminar un producto del carrito
router.delete('/carrito/eliminar/:productoId', verificarAutenticacion, eliminarDelCarrito);

export default router;

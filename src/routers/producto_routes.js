import {Router} from 'express';
import multer from 'multer';
import { storageProductos } from '../config/cloudinary.js';
import { actualizarProducto, detalleProducto, eliminarProducto, listarProducto, registrarProducto } from '../controllers/producto_controller.js';
import verificarAutenticacion from '../middlewares/autenticacion.js';

const router = Router();
// Para guardar las fotos en cloudinary
const uploadProducto = multer({ storage: storageProductos });

// Registro de productos
router.post('/producto/registro', verificarAutenticacion, uploadProducto.single('imagen'), registrarProducto);
// Visualizar el listado de productos (admin - clientes)
router.get('/producto/listar', verificarAutenticacion ,listarProducto);
// Visualizar el detalle de productos
router.get('/producto/detalle/:id', verificarAutenticacion ,detalleProducto);
// Actualizar productos
router.put('/producto/actualizar/:id', verificarAutenticacion, uploadProducto.single('imagen') ,actualizarProducto);
// Eliminar productos
router.delete('/producto/eliminar/:id',verificarAutenticacion,eliminarProducto);


export default router;
import { Router } from 'express';
import multer from 'multer';
import { storageComprobantesPago, storageComprobantesEnvio} from '../config/cloudinary.js';
import { finalizarCompra, actualizarEstadoCompra, obtenerHistorialCompras} from '../controllers/compra_controller.js';
import verificarAutenticacion from '../middlewares/autenticacion.js'; 

const router = Router();

// Configuracion de Multer para comporbantes de pago
const uploadComprobantePago = multer({ storage: storageComprobantesPago });

// Configuracion de Multer para comprobantes de envio de los productos
const uploadComprobanteEnvio = multer({ storage: storageComprobantesEnvio });

// Ruta para finalizar una compra (convertir el carrito en una compra)
router.post('/compras/finalizar', verificarAutenticacion, uploadComprobantePago.single('comprobantePago') ,finalizarCompra);

// Ruta para que el administrador pueda actualizar el estado de una compra (de 'pendiente' a 'enviado')
router.put('/compras/estado/:id', verificarAutenticacion, uploadComprobanteEnvio.single('comprobanteEnvio') ,actualizarEstadoCompra);

// Ruta para obtener el historial de compras de un cliente
router.get('/compras/historial',verificarAutenticacion, obtenerHistorialCompras);


export default router;

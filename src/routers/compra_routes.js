import { Router } from 'express';
import multer from 'multer';
import { storage } from '../config/cloudinary.js';
import { finalizarCompra, actualizarEstadoCompra, obtenerHistorialCompras} from '../controllers/compra_controller.js';
import verificarAutenticacion from '../middlewares/autenticacion.js'; // Aquí es donde se validará el rol de admin también

const router = Router();

// Configuración de Multer para la subida de archivos a Cloudinary
const upload = multer({ storage });

// Ruta para finalizar una compra (convertir el carrito en una compra)
router.post('/compras/finalizar', upload.single('comprobantePago'), verificarAutenticacion, finalizarCompra);

// Ruta para que el administrador pueda actualizar el estado de una compra (de 'pendiente' a 'enviado')
router.put('/compras/estado/:id', upload.single('comprobanteEnvio'), verificarAutenticacion, actualizarEstadoCompra);

// Ruta para obtener el historial de compras de un cliente
router.get('/compras/historial',verificarAutenticacion, obtenerHistorialCompras);


export default router;

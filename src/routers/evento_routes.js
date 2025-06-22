import { Router } from 'express';
import multer from 'multer';
import { storageDetalleEventos } from '../config/cloudinary.js'; 
import { registrarEvento, listarEventos, actualizarEvento, eliminarEvento, detalleEvento } from '../controllers/evento_controller.js';
import verificarAutenticacion from '../middlewares/autenticacion.js';

const router = Router();
const uploadDetalleEvento = multer({ storage: storageDetalleEventos });

// Registrar evento 
router.post('/evento/registro', verificarAutenticacion, uploadDetalleEvento.single('imagenEvento'), registrarEvento);

// Listar eventos (admin o cliente)
router.get('/evento/listar', verificarAutenticacion , listarEventos);

// Detallar eventos 
router.get('/evento/detalle/:id', verificarAutenticacion ,detalleEvento);

// Actualizar evento 
router.put('/evento/actualizar/:id', verificarAutenticacion, uploadDetalleEvento.single('imagenEvento'), actualizarEvento);

// Eliminar evento 
router.delete('/evento/eliminar/:id', verificarAutenticacion, eliminarEvento);

export default router;
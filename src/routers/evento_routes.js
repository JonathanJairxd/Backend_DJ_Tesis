import { Router } from 'express';
import multer from 'multer';
import { storageDetalleEventos } from '../config/cloudinary.js'; 
import {
    registrarEvento,
    listarEventos,
    actualizarEvento,
    eliminarEvento,
    detalleEvento
} from '../controllers/evento_controller.js';
import verificarAutenticacion from '../middlewares/autenticacion.js';

const router = Router();
const uploadDetalleEvento = multer({ storage: storageDetalleEventos });

// Registro de evento (requiere autenticación de admin)
router.post('/evento/registro', verificarAutenticacion, uploadDetalleEvento.single('imagenEvento'), registrarEvento);

// Listar todos los eventos (requiere autenticación)
router.get('/evento/listar', verificarAutenticacion , listarEventos);

// Detallar eventos con el id
router.get('/evento/detalle/:id', verificarAutenticacion ,detalleEvento)

// Actualizar evento (requiere autenticación de admin)
router.put('/evento/actualizar/:id', verificarAutenticacion, uploadDetalleEvento.single('imagenEvento'), actualizarEvento);

// Eliminar evento (requiere autenticación de admin)
router.delete('/evento/eliminar/:id', verificarAutenticacion, eliminarEvento);

export default router;
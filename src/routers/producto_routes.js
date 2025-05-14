import {Router} from 'express'
import multer from 'multer'
import { storage } from '../config/cloudinary.js'
import { actualizarProducto, detalleProducto, eliminarProducto, listarProducto, registrarProducto } from '../controllers/producto_controller.js'
import verificarAutenticacion from '../middlewares/autenticacion.js'

const router = Router()

const upload = multer({ storage })

router.post('/producto/registro', upload.single('imagen'), verificarAutenticacion,registrarProducto)
router.get('/producto/listar', verificarAutenticacion,listarProducto)
router.get('/producto/detalle/:id',verificarAutenticacion,detalleProducto)
router.put('/producto/actualizar/:id',upload.single('imagen'), verificarAutenticacion,actualizarProducto)
router.delete('/producto/eliminar/:id',verificarAutenticacion,eliminarProducto)



export default router
import {Router} from 'express'
import multer from 'multer'
import { storage } from '../config/cloudinary.js'
import { actualizarProducto, detalleProducto, eliminarProducto, listarProducto, registrarProducto } from '../controllers/producto_controller.js'
const router = Router()

const upload = multer({ storage })

router.post('/producto/registro', upload.single('imagen'), registrarProducto)
router.get('/producto/listar', listarProducto)
router.get('/producto/detalle/:id',detalleProducto)
router.put('/producto/actualizar/:id',upload.single('imagen'), actualizarProducto)
router.delete('/producto/eliminar/:id',eliminarProducto)



export default router
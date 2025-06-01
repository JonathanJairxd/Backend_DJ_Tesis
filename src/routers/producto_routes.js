import {Router} from 'express'
import multer from 'multer'
import { storageProductos } from '../config/cloudinary.js'
import { actualizarProducto, detalleProducto, eliminarProducto, listarProducto, registrarProducto } from '../controllers/producto_controller.js'
import verificarAutenticacion from '../middlewares/autenticacion.js'

const router = Router()

const uploadProducto = multer({ storage: storageProductos })

router.post('/producto/registro', verificarAutenticacion, uploadProducto.single('imagen'), registrarProducto)
router.get('/producto/listar', verificarAutenticacion ,listarProducto)
router.get('/producto/detalle/:id', verificarAutenticacion ,detalleProducto)
router.put('/producto/actualizar/:id', verificarAutenticacion, uploadProducto.single('imagen') ,actualizarProducto)
router.delete('/producto/eliminar/:id',verificarAutenticacion,eliminarProducto)



export default router
import {Router} from 'express'
import { actualizarPassword, actualizarPerfil, comprobarTokenPasword, login, nuevoPassword, perfil, recuperarPassword } from '../controllers/administrador_controller.js'
import verificarAutenticacion from '../middlewares/autenticacion.js'

const router = Router()

// Autenticacion del administrador DJ
router.post('/admin/login',login)

// Información del administrador
router.get('/admin/perfil', verificarAutenticacion, perfil)
router.put('/admin/actualizarperfil/:id', verificarAutenticacion,actualizarPerfil)

// Cambio de contraseña
router.put('/admin/actualizarpassword', verificarAutenticacion, actualizarPassword)

// Recuperar contraseña
router.post('/admin/recuperar-password',recuperarPassword)
router.get('/admin/recuperar-password/:token',comprobarTokenPasword)
router.post('/admin/nuevo-password/:token',nuevoPassword)




export default router
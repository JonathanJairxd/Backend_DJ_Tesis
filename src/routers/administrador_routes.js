import {Router} from 'express'
import { actualizarPassword, actualizarPerfil, comprobarTokenPasword, login, nuevoPassword, perfil, recuperarPassword } from '../controllers/administrador_controller.js'
import verificarAutenticacion from '../middlewares/autenticacion.js';

const router = Router();

// Iniciar sesión
router.post('/admin/login',login);

// Visualizar perfil
router.get('/admin/perfil', verificarAutenticacion, perfil);
//Actualizar perfil
router.put('/admin/actualizarperfil/:id', verificarAutenticacion,actualizarPerfil);
// Actualizar contraseña
router.put('/admin/actualizarpassword', verificarAutenticacion, actualizarPassword);

// Recuperar contraseña
router.post('/admin/recuperar-password',recuperarPassword);
// Comprobar token para recuperar contraseña
router.get('/admin/recuperar-password/:token',comprobarTokenPasword);
// Añadir nueva contraseña
router.post('/admin/nuevo-password/:token',nuevoPassword);


export default router;
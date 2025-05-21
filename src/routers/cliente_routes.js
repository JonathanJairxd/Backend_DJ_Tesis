import { Router } from 'express';
import { actualizarCliente, actualizarPassword, comprobarTokenPassword, confirmarEmail, detalleCliente, eliminarCliente, listarClientes, loginCliente, nuevoPassword, perfilCliente, recuperarPassword, reenviarConfirmacionEmail, registrarCliente } from '../controllers/cliente_controller.js';
import verificarAutenticacion from '../middlewares/autenticacion.js';
const router = Router()

router.post('/cliente/registro', registrarCliente)
router.get("/cliente/confirmar/:token", confirmarEmail)

router.post("/cliente/reenviar-confirmacion", reenviarConfirmacionEmail);

router.post('/cliente/login', loginCliente)
router.get('/cliente/perfil', verificarAutenticacion ,perfilCliente)
router.get('/cliente/listar', verificarAutenticacion, listarClientes)
router.get('/cliente/detalle/:id', verificarAutenticacion, detalleCliente)
router.put('/cliente/actualizar/:id', verificarAutenticacion, actualizarCliente)
router.delete('/cliente/eliminar/:id', verificarAutenticacion, eliminarCliente)

//Cambio de contraseña
router.put('/cliente/actualizarpassword', verificarAutenticacion, actualizarPassword)

// Recuperar contraseña
router.post('/cliente/recuperar-password', recuperarPassword)
router.get('/cliente/recuperar-password/:token', comprobarTokenPassword)
router.post('/cliente/nuevo-password/:token', nuevoPassword)


export default router

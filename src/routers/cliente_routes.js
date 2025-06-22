import { Router } from 'express';
import multer from 'multer';
import { storageClientes } from '../config/cloudinary.js';
import { actualizarCliente, actualizarPassword, actualizarPushToken, comprobarTokenPassword, confirmarEmail, detalleCliente, eliminarCliente, listarClientes, loginCliente, nuevoPassword, perfilCliente, recuperarPassword, reenviarConfirmacionEmail, registrarCliente } from '../controllers/cliente_controller.js';
import verificarAutenticacion from '../middlewares/autenticacion.js';

const router = Router()
// Para guardar las foto del perfil en cloudianry
const uploadCliente = multer({ storage: storageClientes });

// Registro del cliente
router.post('/cliente/registro', registrarCliente);
// Confirmar la cuenta (email)
router.get("/cliente/confirmar/:token", confirmarEmail);
// Reeviar correo para confirmar la cuenta
router.post("/cliente/reenviar-confirmacion", reenviarConfirmacionEmail);
// Iniciar sesión
router.post('/cliente/login', loginCliente);

// Visualizar perfil
router.get('/cliente/perfil', verificarAutenticacion ,perfilCliente);
// Visualizar lista de clientes (Admin)
router.get('/cliente/listar', verificarAutenticacion, listarClientes);
// Visualizar el detalle de clientes (Admin)
router.get('/cliente/detalle/:id', verificarAutenticacion, detalleCliente);

//Actualizar perfil
router.put('/cliente/actualizar/:id', verificarAutenticacion, uploadCliente.single('fotoPerfil') , actualizarCliente);
// Eliminar cliente (Admin) o Eliminar cuenta (Cliente)
router.delete('/cliente/eliminar/:id', verificarAutenticacion, eliminarCliente);

// Actualizar contraseña
router.put('/cliente/actualizarpassword', verificarAutenticacion, actualizarPassword);

// Recuperar contraseña
router.post('/cliente/recuperar-password', recuperarPassword);
// Comprobar token para recuperar contraseña
router.get('/cliente/recuperar-password/:token', comprobarTokenPassword);
// Añadir nueva contraseña
router.post('/cliente/nuevo-password/:token', nuevoPassword);

// Ruta para actualizar el token de notificación
router.put('/cliente/actualizar-push-token', verificarAutenticacion, actualizarPushToken);


export default router;

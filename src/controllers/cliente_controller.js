import Cliente from "../models/Cliente.js";
import { sendMailToCliente, sendMailToRecoveryPassword } from "../config/nodemailer.js";
import mongoose from "mongoose";
import generarJWT from "../helpers/crearJWT.js";

// Registro Clientes
const registrarCliente = async (req, res) => {
    // Verificar que se hayan enviado datos
    if (!req.body || Object.values(req.body).every(valor =>
        valor === null || valor === undefined ||
        (typeof valor === 'string' && valor.trim() === '')
    )) {
        return res.status(400).json({ msg: "Datos inválidos. Asegúrate de enviar todos los campos requeridos" });
    }

    const { email, password, confirmarPassword } = req.body;

    // Verificar que todos los campos estén llenos
    if (Object.values(req.body).some(valor => typeof valor === 'string' && valor.trim() === '')) {
        return res.status(400).json({ msg: "Lo sentimos, debes llenar todos los campos" });
    }

    // Verificar la contraseña añadida en el registro
    if (password !== confirmarPassword) {
        return res.status(400).json({ msg: "Las contraseñas no coinciden" });
    }

    try {
        
        const verificarEmailBDD = await Cliente.findOne({ email });
        
        if (verificarEmailBDD) {
            return res.status(400).json({ msg: "Lo sentimos, el correo ya se encuentra registrado" });
        }

        // Crear nuevo cliente
        const nuevoCliente = new Cliente(req.body);
        nuevoCliente.password = await nuevoCliente.encrypPassword(password);
        const token = nuevoCliente.crearToken();
        await sendMailToCliente(email, token);

        // Guardar cliente en la base de datos
        await nuevoCliente.save();

        res.status(200).json({ msg: "Revisa tu correo electrónico para confirmar tu cuenta" });
    } catch (error) {
        return res.status(500).json({ msg: "Hubo un error al intentar registrar una cuenta. Por favor, inténtalo de nuevo más tarde" });
    }
}

// Confirmar cuenta (email)
const confirmarEmail = async (req, res) => {
    
    try {
        // Buscar el cliente en la base de datos usando el token recibido
        const clienteBDD = await Cliente.findOne({ token: req.params.token });

        // Verificar si el token ya fue utilizado o no existe
        if (!clienteBDD) {
            return res.status(400).json({ msg: "Token inválido o la cuenta ya fue confirmada" });
        }
        
        // Eliminar el token del cliente ya que ha sido validado
        clienteBDD.token = null
        // Marcar la cuenta como confirmada
        clienteBDD.confirmarEmail = true

        await clienteBDD.save()

        res.status(200).json({ msg: "Token confirmado, ya puedes iniciar sesión" });

    } catch (error) {
        return res.status(500).json({ msg: "Hubo un error al intentar confirmar la cuenta. Por favor, inténtalo de nuevo más tarde" });
    }

}

// Reevenviar email para confrimr cuenta
const reenviarConfirmacionEmail = async (req, res) => {
    // Verificar que se hayan enviado datos
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ msg: "Datos inválidos. Asegúrate de enviar todos los campos requeridos" });
    }

    const { email } = req.body;

    // Validar campo vacío
    if (!email) {
        return res.status(400).json({ msg: "El campo correo es obligatorio" });
    }

    try {

        // Buscar al cliente por email
        const clienteBDD = await Cliente.findOne({ email });

        if (!clienteBDD) {
            return res.status(400).json({ msg: "No se encontró un cliente con ese correo" });
        }

        // Verificar si ya confirmó su email
        if (clienteBDD.confirmarEmail) {
            return res.status(400).json({ msg: "La cuenta ya ha sido confirmada" });
        }

        // Generar un nuevo token y guardarlo
        const nuevoToken = clienteBDD.crearToken();
        clienteBDD.token = nuevoToken;
        await clienteBDD.save();

        // Enviar el correo
        await sendMailToCliente(email, nuevoToken);

        res.status(200).json({ msg: "Se ha reenviado el correo de confirmación" });

    } catch (error) {
        return res.status(500).json({ msg: "Hubo un error al intentar reenviar la confirmación de la cuenta al correo. Por favor, inténtalo de nuevo más tarde" });
    }
}

// Iniciar sesión
const loginCliente = async (req, res) => {
    // Verificar que se hayan enviado datos
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ msg: "Datos inválidos. Asegúrate de enviar todos los campos requeridos" });
    }

    const { email, password } = req.body;

    // Verificar que todos los campos estén llenos
    if (Object.values(req.body).includes(""))
        return res.status(400).json({ msg: "Lo sentimos, debes llenar todos los campos" });

    try {
        // Buscar al cliente en la base de datos
        const clienteBDD = await Cliente.findOne({ email });

        // Verifica si la cuenta fue confirmada o no
        if (clienteBDD?.confirmarEmail === false)
            return res.status(401).json({ msg: "Lo sentimos, debe verificar su cuenta" });


        if (!clienteBDD) {
            return res.status(404).json({ msg: "Lo sentimos, el email no se encuentra registrado" });
        }

        // Verificar si el password es correcto
        const verificarPassword = await clienteBDD.matchPassword(password);
        if (!verificarPassword) {
            return res.status(401).json({ msg: "Lo sentimos, la contraseña es incorrecta" });
        }

        
        const token = generarJWT(clienteBDD._id, "Cliente");

        // Extraer datos del cliente
        const { nombre, telefono, direccion, provincia, ciudad, _id } = clienteBDD;

        res.status(200).json({
            token,
            _id: clienteBDD._id,
            nombre,
            email,
            telefono,
            direccion,
            provincia,
            ciudad,
            email: clienteBDD.email
        });

    } catch (error) {
        return res.status(500).json({ msg: "Hubo un error al intentar iniciar sesión. Por favor, inténtalo de nuevo más tarde" });
    }
}

// Visualizar el perfil (clientes)
const perfilCliente = (req, res) => {
    // Verificar que el cliente con el id del token exista en la base de datos
    // Se usa tambien para verificar el token de acuerdo al rol que le es permitido
    if (!req.clienteBDD) {
        return res.status(401).json({ msg: "Acceso denegado. Solo los clientes pueden ver su propio perfil" });
    }

    try {

        delete req.clienteBDD.token
        delete req.clienteBDD.confirmEmail
        delete req.clienteBDD.createdAt
        delete req.clienteBDD.updatedAt
        delete req.clienteBDD.__v

        res.status(200).json(req.clienteBDD)

    } catch (error) {
        return res.status(500).json({ msg: "Hubo un error al intentar mostrar perfil del cliente. Por favor, inténtalo de nuevo más tarde" });
    }
}

// Listar clientes (Solo para el administrador)
const listarClientes = async (req, res) => {

    if (!req.administradorBDD) {
        return res.status(403).json({ msg: "Acceso denegado. Solo el administrador puede listar clientes" });
    }

    try {
        const clientes = await Cliente.find().select("-createdAt -updatedAt -__v -password -token -confirmarEmail -direccion");

        res.status(200).json(clientes);
    } catch (error) {
        res.status(500).json({ msg: "Hubo un error al intentar listar clientes. Por favor, inténtalo de nuevo más tarde" });
    }
}

// Detalle de los clientes (Solo el administrador)
const detalleCliente = async (req, res) => {
    if (!req.administradorBDD) {
        return res.status(403).json({ msg: "Acceso denegado. Solo el administrador puede detallar clientes" });
    }

    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ msg: `Lo sentimos, no existe el cliente con ID: ${id}` });
        }

        const cliente = await Cliente.findById(id).select("-createdAt -updatedAt -__v -token -confirmarEmail -password");

        res.status(200).json(cliente)

    } catch (error) {
        res.status(500).json({ msg: "Hubo un error al intentar detallar un cliente. Por favor, inténtalo de nuevo más tarde" });
    }
}

// Eliminar cliente (solo el administrador)
const eliminarCliente = async (req, res) => {
    const { id } = req.params; 

    // Verificar si el usuario es administrador o cliente
    if (!req.administradorBDD && !req.clienteBDD) {
        return res.status(403).json({ msg: "Acceso denegado. Debes estar autenticado para realizar esta acción" });
    }

    // Si el usuario es administrador, puede eliminar cualquier cuenta
    if (req.administradorBDD) {
    }
    // Si el usuario es el cliente, solo puede eliminar su propia cuenta
    else if (req.clienteBDD && req.clienteBDD._id.toString() === id) {
    } else {
        // Si el cliente intenta eliminar la cuenta de otro
        return res.status(403).json({ msg: "Acceso denegado. Solo puedes eliminar tu propia cuenta" });
    }

    // Verificar que el ID proporcionado sea válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ msg: `Lo sentimos, el ID: ${id} no es válido` });
    }

    try {

        // Verificar si el cliente existe en la base de datos
        const cliente = await Cliente.findById(id);
        if (!cliente) {
            return res.status(404).json({ msg: `El cliente con ID: ${id} no existe` });
        }

        try {
            await Cliente.findByIdAndDelete(id);
        } catch (error) {
            return res.status(500).json({ msg: "Hubo un error al eliminar la cuenta" });
        }

        // Mensajes dependiendo de quien elimino la cuenta
        if (req.administradorBDD) {
            return res.status(200).json({ msg: "Cuenta de cliente eliminada exitosamente" });
        }
        else {
            return res.status(200).json({ msg: "Tu cuenta ha sido eliminada exitosamente" });
        }

    } catch (error) {
        res.status(500).json({ msg: "Hubo un error al intentar eliminar un cliente. Por favor, inténtalo de nuevo más tarde" })
    }
}

// Actualizar perfil (clientes)
const actualizarCliente = async (req, res) => {

    if (!req.clienteBDD) {
        return res.status(403).json({ msg: "Acceso denegado. Solo los clientes pueden ver su propio perfil" });
    }

    // Verificar que se hayan enviado datos
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ msg: "Datos inválidos. Asegúrate de enviar todos los campos requeridos" });
    }

    const { id } = req.params
    // Para no tomar en cuenta si el campo de la foto esta vacio o no
    const { fotoPerfil, ...restoCampos } = req.body;

    if (Object.values(restoCampos).some(valor => typeof valor === 'string' && valor.trim() === ""))
        return res.status(400).json({ msg: "Lo sentimos, debes llenar todos los campos" });

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ msg: `Lo sentimos, no existe un usuario con ID: ${id}` });
    }

    try {

        // Verificar si el cliente existe en la base de datos
        const cliente = await Cliente.findById(id);
        if (!cliente) {
            return res.status(404).json({ msg: `Usuario con ID: ${id} no encontrado o ya fue eliminado` });
        }

        // Si hay imagen, actualizarla
        if (req.file) {
            cliente.fotoPerfil = req.file.secure_url || req.file.path || null;
        }

        // Si se ha enviado null o alguna indicación para eliminar la foto
        if (req.body.eliminarFoto === "true") {
            cliente.fotoPerfil = null;  // Se elimina la foto
        }

        await Cliente.findByIdAndUpdate(id, { ...req.body, fotoPerfil: cliente.fotoPerfil });

        res.status(200).json({ msg: "Actualización exitosa" })

    } catch (error) {
        return res.status(500).json({ msg: "Hubo un error al intentar actualizar la info del cliente. Por favor, inténtalo de nuevo más tarde" });
    }
}

// Actualizar contraseña
const actualizarPassword = async (req, res) => {
    if (!req.clienteBDD) {
        return res.status(403).json({ msg: "Acceso denegado. Solo los clientes pueden actualizar su contraseña" });
    }

    // Verificar que se hayan enviado datos
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ msg: "Datos inválidos. Asegúrate de enviar todos los campos requeridos" });
    }

    try {
        const { passwordactual, passwordnuevo } = req.body;

        // Validar que se proporcionen ambas contraseñas
        if (!passwordactual || !passwordnuevo) {
            return res.status(400).json({ msg: "Por favor, ingrese tanto la contraseña actual como la nueva contraseña" });
        }

        const clienteBDD = await Cliente.findById(req.clienteBDD._id);

        if (!clienteBDD)
            return res.status(404).json({ msg: `Lo sentimos, no existe un usuario con ID ${req.clienteBDD._id}` });

        const verificarPassword = await clienteBDD.matchPassword(req.body.passwordactual);

        if (!verificarPassword)
            return res.status(401).json({ msg: "Lo sentimos, el password actual no es el correcto" });

        clienteBDD.password = await clienteBDD.encrypPassword(req.body.passwordnuevo);

        await clienteBDD.save();

        res.status(200).json({ msg: "Password actualizado correctamente" });

    } catch (error) {
        return res.status(500).json({ msg: "Hubo un error al intentar actualizar la contraseña. Por favor, inténtalo de nuevo más tarde" });
    }
}

// Recuperar contraseña
const recuperarPassword = async (req, res) => {
    // Verificar que se hayan enviado datos
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ msg: "Datos inválidos. Asegúrate de enviar todos los campos requeridos" });
    }

    try {
        const { email } = req.body

        // Verificar que se hayan enviado datos
        if (Object.values(req.body).includes(""))
            return res.status(400).json({ msg: "Lo sentimos, debes llenar todos los campos" });

        // Validar si el correo existe en la base de datos
        const clienteBDD = await Cliente.findOne({ email });
        if (!clienteBDD)
            return res.status(401).json({ msg: "Lo sentimos, el email no está registrado" });

        const token = clienteBDD.crearToken();
        clienteBDD.token = token;
        await sendMailToRecoveryPassword(email, token, false);
        await clienteBDD.save();

        res.status(200).json({ msg: "Revisa tu correo electrónico para restablecer tu cuenta" });

    } catch (error) {
        return res.status(500).json({ msg: "Hubo un error al intentar recuperar la contraseña. Por favor, inténtalo de nuevo más tarde" });
    }
}

// Comprobar el token para recuperar contraseña
const comprobarTokenPassword = async (req, res) => {
    try {

        // Verificar que el token exista
        if (!req.params.token)
            return res.status(404).json({ msg: "Lo sentimos, no se puede validar la cuenta" });


        // Comprobar si el token es válido
        const clienteBDD = await Cliente.findOne({ token: req.params.token });
        if (clienteBDD?.token !== req.params.token)
            return res.status(401).json({ msg: "Lo sentimos, el token no es válido" });

        await clienteBDD.save();

        res.status(200).json({ msg: "Token confirmado, ya puedes crear tu nueva contraseña" });

    } catch (error) {
        return res.status(500).json({ msg: "Hubo un error al intentar comprobar el token para recuperar la contraseña. Por favor, inténtalo de nuevo más tarde" });
    }
}

// Añadir nueva contraseña
const nuevoPassword = async (req, res) => {
    // Verificar que se hayan enviado datos
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ msg: "Datos inválidos. Asegúrate de enviar todos los campos requeridos" });
    }

    try {
        const { password, confirmpassword } = req.body;
        // Verificar campos vacios
        if (Object.values(req.body).includes(""))
            return res.status(404).json({ msg: "Lo sentimos, debes llenar todos los campos" });

        // Confirmar si las contraseñas son iguales
        if (password !== confirmpassword)
            return res.status(400).json({ msg: "Lo sentimos, las contraseñas no coinciden" });

        const clienteBDD = await Cliente.findOne({ token: req.params.token });
        if (clienteBDD?.token !== req.params.token)
            return res.status(401).json({ msg: "Lo sentimos, el token no es válido o ha expirado" });

        clienteBDD.token = null;
        clienteBDD.password = await clienteBDD.encrypPassword(password);
        await clienteBDD.save();

        res.status(200).json({ msg: "Felicitaciones, ya puedes iniciar sesión con tu nuevo password" });

    } catch (error) {
        return res.status(500).json({ msg: "Hubo un error al intentar ingresar una nueva contraseña. Por favor, inténtalo de nuevo más tarde" });
    }
}

// Actualizar el token de notificación push para la app movil(Expo Push Token)
const actualizarPushToken = async (req, res) => {
    const { expoPushToken } = req.body;

    // Validaciones esenciales
    if (!expoPushToken || typeof expoPushToken !== 'string' || !expoPushToken.startsWith('ExponentPushToken[')) {
        return res.status(400).json({ msg: 'Token inválido o no proporcionado correctamente' });
    }

    try {
        // Para evitar actualizaciones innecesarias
        const cliente = await Cliente.findById(req.clienteBDD._id);
        if (!cliente) return res.status(404).json({ msg: 'Cliente no encontrado' });

        if (cliente.expoPushToken === expoPushToken) {
            return res.status(200).json({ msg: 'Token ya actualizado', ok: true });
        }

        cliente.expoPushToken = expoPushToken;
        await cliente.save();

        res.status(200).json({ msg: 'Token actualizado correctamente', ok: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Hubo un error al intentar guardar el token de notificación' });
    }
}


export {
    registrarCliente,
    confirmarEmail,
    reenviarConfirmacionEmail,
    loginCliente,
    perfilCliente,
    listarClientes,
    detalleCliente,
    actualizarCliente,
    eliminarCliente,
    recuperarPassword,
    comprobarTokenPassword,
    nuevoPassword,
    actualizarPassword,
    actualizarPushToken
}

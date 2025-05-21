import Cliente from "../models/Cliente.js"
import { sendMailToCliente, sendMailToRecoveryPassword } from "../config/nodemailer.js"
import mongoose from "mongoose"
import generarJWT from "../helpers/crearJWT.js"


const registrarCliente = async (req, res) => {
    const { email, password, confirmarPassword } = req.body;

    // Validar que no haya campos vacíos
    if (Object.values(req.body).includes("")) {
        return res.status(400).json({ msg: "Lo sentimos, debes llenar todos los campos" })
    }

    // Verificar la contraseña añadida en el registro
    if (password !== confirmarPassword) {
        return res.status(400).json({ msg: "Las contraseñas no coinciden" });
    }

    // Obtener el usuario de la BDD en base al email
    const verificarEmailBDD = await Cliente.findOne({ email })
    // Verificar si el email ya está registrado
    if (verificarEmailBDD) {
        return res.status(400).json({ msg: "Lo sentimos, el email ya se encuentra registrado" })
    }

    // Crear nuevo cliente
    const nuevoCliente = new Cliente(req.body);
    // Encriptar el password
    nuevoCliente.password = await nuevoCliente.encrypPassword(password)
    //Crear el token
    const token = nuevoCliente.crearToken()
    // Enviar correo de bienvenida con la contraseña
    await sendMailToCliente(email, token)

    // Guardar cliente en la base de datos
    await nuevoCliente.save()

    res.status(200).json({ msg: "Revisa tu correo electrónico para confirmar tu cuenta" })
}

const confirmarEmail = async (req, res) => {

    // Verificar si el token esta presente en los parametros de la URL
    if (!req.params.token) {
        return res.status(400).json({ msg: "Lo sentimos, no se puede validar la cuenta" })
    }
    // Buscar el cliente en la base de datos usando el token recibido
    const clienteBDD = await Cliente.findOne({ token: req.params.token })

    // Verificar si el token ya fue utilizado o no existe
    if (!clienteBDD) {
        return res.status(404).json({ msg: "No se encontró un cliente con ese token" })
    }
    // Verificar si la cuenta ya está confirmada
    if (clienteBDD.confirmarEmail) {
        return res.status(400).json({ msg: "La cuenta ya ha sido confirmada" });
    }
    // Eliminar el token del cliente ya que ha sido validado
    clienteBDD.token = null
    // Marcar la cuenta como confirmada
    clienteBDD.confirmarEmail = true

    await clienteBDD.save()

    res.status(200).json({ msg: "Token confirmado, ya puedes iniciar sesión" })

}

const loginCliente = async (req, res) => {
    const { email, password } = req.body

    // Verificar que todos los campos estén llenos
    if (Object.values(req.body).includes(""))
        return res.status(400).json({ msg: "Lo sentimos, debes llenar todos los campos" })

    // Buscar al cliente en la base de datos
    const clienteBDD = await Cliente.findOne({ email });

    // Verifica si la cuenta fue confirmada o no
    if (clienteBDD?.confirmarEmail === false) 
        return res.status(403).json({ msg: "Lo sentimos, debe verificar su cuenta" })

    
    if (!clienteBDD) {
        return res.status(404).json({ msg: "Lo sentimos, el email no se encuentra registrado" })
    }

    // Verificar si el password es correcto
    const verificarPassword = await clienteBDD.matchPassword(password);
    if (!verificarPassword) {
        return res.status(401).json({ msg: "Lo sentimos, la contraseña es incorrecta" })
    }

    // Generar token JWT
    const token = generarJWT(clienteBDD._id, "Cliente")

    // Extraer datos del cliente
    const { nombre, telefono, direccion, provincia, ciudad, _id } = clienteBDD;

    // Respuesta exitosa
    res.status(200).json({
        token,
        nombre,
        email,
        telefono,
        direccion,
        provincia,
        ciudad,
        _id,
        email: clienteBDD.email
    });
}

const perfilCliente = (req, res) => {
    // Verificar que el cliente con el id del token exista en la base de datos
    // Se usa tambien para verificar el token de acuerdo al rol que le es permitido
    if (!req.clienteBDD) {
        return res.status(404).json({ msg: "Acceso denegado. Solo los clientes pueden ver su propio perfil" });
    }
    delete req.clienteBDD.token
    delete req.clienteBDD.confirmEmail
    delete req.clienteBDD.createdAt
    delete req.clienteBDD.updatedAt
    delete req.clienteBDD.__v

    res.status(200).json(req.clienteBDD)
}

const listarClientes = async (req, res) => {

    if (!req.administradorBDD) {
        return res.status(404).json({ msg: "Acceso denegado. Solo el administrador puede listar clientes" });
    }

    try {
        const clientes = await Cliente.find({ status: true }).select("-createdAt -updatedAt -__v -password -token -confirmEmail -direccion -ciudad")

        res.status(200).json(clientes);
    } catch (error) {
        res.status(500).json({ msg: "Hubo un error al obtener la lista de clientes" })
    }
}

const detalleCliente = async (req, res) => {

    if (!req.administradorBDD) {
        return res.status(404).json({ msg: "Acceso denegado. Solo el administrador puede detallar clientes" });
    }

    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ msg: `Lo sentimos, no existe el cliente con ID: ${id}` });
    }

    const cliente = await Cliente.findById(id).select("-createdAt -updatedAt -__v -token -confirmEmail -password")

    res.status(200).json(cliente)
}

const eliminarCliente = async (req, res) => {
    const { id } = req.params; // Obtener el ID de la ruta

    // Verificar si el usuario es administrador o cliente
    if (!req.administradorBDD && !req.clienteBDD) {
        return res.status(401).json({ msg: "Acceso denegado. Debes estar autenticado para realizar esta acción" });
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

    // Verificar si el cliente existe en la base de datos
    const cliente = await Cliente.findById(id);
    if (!cliente) {
        return res.status(404).json({ msg: `El cliente con ID: ${id} no existe` });
    }

    // Verificar si la cuenta ya ha sido eliminada (status: false)
    if (cliente.status === false) {
        return res.status(404).json({ msg: `La cuenta con ID: ${id} ya ha sido eliminada` });
    }

    // Realizar la eliminación (cambiar el estado a false)
    try {
        await Cliente.findByIdAndUpdate(id, { status: false });
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
};
// Actualizar 
const actualizarCliente = async (req, res) => {

    if (!req.clienteBDD) {
        return res.status(404).json({ msg: "Acceso denegado. Solo los clientes pueden ver su propio perfil" });
    }

    const { id } = req.params

    if (Object.values(req.body).includes(""))
        return res.status(400).json({ msg: "Lo sentimos, debes llenar todos los campos" })

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ msg: `Lo sentimos, no existe un usuario con ID: ${id}` })
    }

    // Verificar si el cliente existe en la base de datos
    const cliente = await Cliente.findById(id);
    if (!cliente) {
        return res.status(404).json({ msg: `Usuario con ID: ${id} no encontrado o ya fue eliminado` })
    }

    await Cliente.findByIdAndUpdate(id, req.body)

    res.status(200).json({ msg: "Actualización exitosa" })
}

const actualizarPassword = async (req, res) => {

    if (!req.clienteBDD) {
        return res.status(404).json({ msg: "Acceso denegado. Solo los clientes pueden actualizar su contraseña" });
    }

    const clienteBDD = await Cliente.findById(req.clienteBDD._id)

    if (!clienteBDD)
        return res.status(404).json({ msg: `Lo sentimos, no existe un usuario con ID ${req.clienteBDD._id}` })

    const verificarPassword = await clienteBDD.matchPassword(req.body.passwordactual)

    if (!verificarPassword)
        return res.status(404).json({ msg: "Lo sentimos, el password actual no es el correcto" })

    clienteBDD.password = await clienteBDD.encrypPassword(req.body.passwordnuevo)

    await clienteBDD.save()

    res.status(200).json({ msg: "Password actualizado correctamente" })
}


// Recuperar contrseña

const recuperarPassword = async (req, res) => {
    // Datos del request
    const { email } = req.body

    // Validar campos vacios
    if (Object.values(req.body).includes(""))
        return res.status(404).json({ msg: "Lo sentimos, debes llenar todos los campos" })

    // Validar si el correo existe en la base de datos
    const clienteBDD = await Cliente.findOne({ email })
    if (!clienteBDD)
        return res.status(404).json({ msg: "Lo sentimos, el email no está registrado" })

    // Interaccion con la base de datos
    const token = clienteBDD.crearToken()
    clienteBDD.token = token
    await sendMailToRecoveryPassword(email, token, false)
    await clienteBDD.save();

    res.status(200).json({ msg: "Revisa tu correo electrónico para restablecer tu cuenta" })
}

const comprobarTokenPassword = async (req, res) => {
    // Verificar que el token exista
    if (!req.params.token)
        return res.status(404).json({ msg: "Lo sentimos, no se puede validar la cuenta" })


    // Comprobar si el token es válido
    const clienteBDD = await Cliente.findOne({ token: req.params.token })
    if (clienteBDD?.token !== req.params.token)
        return res.status(404).json({ msg: "Lo sentimos, el token no es válido jjxd" })

    await clienteBDD.save()

    res.status(200).json({ msg: "Token confirmado, ya puedes crear tu nuevo password" })
}

const nuevoPassword = async (req, res) => {
    const { password, confirmpassword } = req.body;
    // Verificar campos vacios
    if (Object.values(req.body).includes(""))
        return res.status(404).json({ msg: "Lo sentimos, debes llenar todos los campos" });

    // Confirmar si las contraseñas son iguales
    if (password !== confirmpassword)
        return res.status(404).json({ msg: "Lo sentimos, las contraseñas no coinciden" });

    const clienteBDD = await Cliente.findOne({ token: req.params.token });
    if (clienteBDD?.token !== req.params.token)
        return res.status(404).json({ msg: "Lo sentimos, el token no es válido o ha expirado" });

    clienteBDD.token = null;
    clienteBDD.password = await clienteBDD.encrypPassword(password);
    await clienteBDD.save();

    res.status(200).json({ msg: "Felicitaciones, ya puedes iniciar sesión con tu nuevo password" });
}


export {
    registrarCliente,
    confirmarEmail,
    loginCliente,
    perfilCliente,
    listarClientes,
    detalleCliente,
    actualizarCliente,
    eliminarCliente,
    recuperarPassword,
    comprobarTokenPassword,
    nuevoPassword,
    actualizarPassword
}

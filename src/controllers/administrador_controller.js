import Administrador from '../models/Administrador.js';
import dotenv from 'dotenv'
import { sendMailToRecoveryPassword } from "../config/nodemailer.js";
import generarJWT from "../helpers/crearJWT.js"
import mongoose from 'mongoose';

dotenv.config()

const login = async (req, res) => {
    // Se toman los datos del request
    const { email, password } = req.body

    // Verificar si se enviaron todos los campos
    if (!email || !password) {
        return res.status(400).json({ msg: "Lo sentimos, debes llenar todos los campos" })
    }

    try {
        // Buscar administrador en la base de datos
        let administradorBDD = await Administrador.findOne({ email })

        // Si no existe, crearlo SOLO si las credenciales coinciden con el .env
        if (!administradorBDD) {
            if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
                const newAdmin = new Administrador({
                    nombre: "Edwin",
                    apellido: "Ashqui",
                    email: process.env.ADMIN_EMAIL,
                    password: await new Administrador().encrypPassword(process.env.ADMIN_PASSWORD),
                });

                await newAdmin.save();
                //Agregar token
                const token = generarJWT(newAdmin._id, "Administrador");

                return res.status(201).json({
                    msg: "Administrador creado y autenticado",
                    token, // se devuelve el token cuando se inicia sesion
                    adminInfo: newAdmin
                });

            } else {
                return res.status(404).json({ msg: "Credenciales Incorrectas" })
            }
        }

        // Verificar la contraseña
        const verificarPassword = await administradorBDD.matchPassword(password);
        if (!verificarPassword) {
            return res.status(401).json({ msg: "Lo sentimos la contraseña  es incorrecta" });
        }

        // Mostrar los datos del administrador autenticado
        const token = generarJWT(administradorBDD._id, "Administrador")
        const { nombre, apellido, direccion, telefono, _id, descripcion } = administradorBDD;
        res.status(200).json({
            token,
            nombre,
            apellido,
            direccion,
            telefono,
            descripcion,
            _id,
            email: administradorBDD.email,
            rol: "Administrador"
        })

    } catch (error) {
        return res.status(500).json({ msg: "Hubo un error al intentar iniciar sesión. Por favor, inténtalo de nuevo más tarde" })
    }
}

const perfil = (req, res) => {
    // Verificar que el cliente con el id del token exista en la base de datos
    // Se usa tambien para verificar el token de acuerdo al rol que le es permitido
    if (!req.administradorBDD) {
        return res.status(404).json({ msg: "Acceso denegado. Solo el administrador puede ver su propio perfil" });
    }

    try {

        delete req.administradorBDD.token
        delete req.administradorBDD.createdAt
        delete req.administradorBDD.updatedAt
        delete req.administradorBDD.__v
        req.administradorBDD.rol = "Administrador"
        res.status(200).json(req.administradorBDD)

    } catch (error) {
        return res.status(500).json({ msg: "Hubo un error al intentar mostrar perfil. Por favor, inténtalo de nuevo más tarde" })
    }
}

// Actualizar
const actualizarPerfil = async (req, res) => {
    if (!req.administradorBDD) {
        return res.status(404).json({ msg: "Acceso denegado. Solo el Administrador puede actualizar su propio perfil" });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
        return res.status(404).json({ msg: `Lo sentimos, debe ser un ID válido` })

    if (Object.values(req.body).includes(""))
        return res.status(400).json({ msg: "Lo sentimos, debes llenar todos los campos" })

    if (!/^\d{10}$/.test(req.body.telefono)) {
        return res.status(400).json({ msg: "El número de teléfono debe contener 10 digitos" });
    }

    try {

        const administradorBDD = await Administrador.findById(id)

        if (!administradorBDD)
            return res.status(404).json({ msg: `Lo sentimos, no existe el administrador con ID ${id}` })

        if (administradorBDD.email !== req.body.email) {
            const administradorBDDMail = await Administrador.findOne({ email: req.body.email })
            if (administradorBDDMail) {
                return res.status(404).json({ msg: "Lo sentimos, el correo electrónico ya se encuentra registrado" })
            }
        }

        administradorBDD.nombre = req.body.nombre || administradorBDD?.nombre
        administradorBDD.apellido = req.body.apellido || administradorBDD?.apellido
        administradorBDD.direccion = req.body.direccion || administradorBDD?.direccion
        administradorBDD.telefono = req.body.telefono || administradorBDD?.telefono
        administradorBDD.email = req.body.email || administradorBDD?.email
        administradorBDD.descripcion = req.body.descripcion || administradorBDD?.descripcion

        await administradorBDD.save();

        res.status(200).json({ msg: "Perfil actualizado correctamente" });

    } catch (error) {
        return res.status(500).json({ msg: "Hubo un error al intentar actualizar el perfil . Por favor, inténtalo de nuevo más tarde" })
    }
}

const actualizarPassword = async (req, res) => {
    if (!req.administradorBDD) {
        return res.status(404).json({ msg: "Acceso denegado. Solo el administrador puede actualizar su contraseña" });
    }

    try {

        const { passwordactual, passwordnuevo } = req.body;

        // Validar que se proporcionen ambas contraseñas
        if (!passwordactual || !passwordnuevo) {
            return res.status(400).json({ msg: "Por favor, ingrese tanto la contraseña actual como la nueva contraseña" });
        }

        const administradorBDD = await Administrador.findById(req.administradorBDD._id);

        if (!administradorBDD)
            return res.status(404).json({ msg: `Lo sentimos, no existe un administrador con ID ${req.administradorBDD._id}` });

        const verificarPassword = await administradorBDD.matchPassword(passwordactual);

        if (!verificarPassword)
            return res.status(404).json({ msg: "Lo sentimos, la contraseña actual no es la correcta" });

        administradorBDD.password = await administradorBDD.encrypPassword(passwordnuevo);

        await administradorBDD.save();

        res.status(200).json({ msg: "Contraseña actualizada correctamente" });

    } catch (error) {
        return res.status(500).json({ msg: "Hubo un error al intentar actualizar la contraseña. Por favor, inténtalo de nuevo más tarde" })
    }
}

// Recuperar contraseña
const recuperarPassword = async (req, res) => {

    try {
        // Datos del request
        const { email } = req.body

        // Validar campos vacios
        if (Object.values(req.body).includes(""))
            return res.status(404).json({ msg: "Lo sentimos, debes llenar todos los campos" })
        //Validar si el correo existe en la base de datos
        const administradorBDD = await Administrador.findOne({ email })
        if (!administradorBDD)
            return res.status(404).json({ msg: "Lo sentimos, el correo electrónico es incorrecto" })

        // Interaccion con la base de datos
        const token = administradorBDD.crearToken()
        administradorBDD.token = token
        await sendMailToRecoveryPassword(email, token, true)
        await administradorBDD.save()

        res.status(200).json({ msg: "Revisa tu correo electrónico para restablecer tu cuenta" })

    } catch (error) {
        return res.status(500).json({ msg: "Hubo un error al intentar recuperar la contraseña. Por favor, inténtalo de nuevo más tarde" })
    }
}

const comprobarTokenPasword = async (req, res) => {

    try {
        // Verificar que el token exista
        if (!req.params.token)
            return res.status(404).json({ msg: "Lo sentimos, no se puede validar la cuenta" })

        // Comprobar si el token es válido
        const administradorBDD = await Administrador.findOne({ token: req.params.token })
        if (administradorBDD?.token !== req.params.token)
            return res.status(404).json({ msg: "Lo sentimos, el token no es válido" })

        await administradorBDD.save()

        res.status(200).json({ msg: "Token confirmado, ya puedes crear tu nueva contraseña" })

    } catch (error) {
        return res.status(500).json({ msg: "Hubo un error al intentar comprobar el token para recuperar la contraseña. Por favor, inténtalo de nuevo más tarde" })
    }
}

const nuevoPassword = async (req, res) => {

    try {
        const { password, confirmpassword } = req.body
        // Verificar campos vacios
        if (Object.values(req.body).includes(""))
            return res.status(404).json({ msg: "Lo sentimos, debes llenar todos los campos" })

        // Confirmar si las contraseñas son iguales
        if (password !== confirmpassword)
            return res.status(404).json({ msg: "Lo sentimos, las contraseñas no coinciden" })

        const AdministradorBDD = await Administrador.findOne({ token: req.params.token })
        if (AdministradorBDD?.token !== req.params.token)
            return res.status(404).json({ msg: "Lo sentimos, el token no es válido o ha expirado" })

        AdministradorBDD.token = null;
        AdministradorBDD.password = await AdministradorBDD.encrypPassword(password)
        await AdministradorBDD.save();

        res.status(200).json({ msg: "Felicitaciones, ya puedes iniciar sesión con tu nueva contraseña" })

    } catch (error) {
        return res.status(500).json({ msg: "Hubo un error al intentar ingresar una nueva contraseña. Por favor, inténtalo de nuevo más tarde" })
    }
}


export {
    login,
    perfil,
    actualizarPerfil,
    actualizarPassword,
    recuperarPassword,
    comprobarTokenPasword,
    nuevoPassword
}
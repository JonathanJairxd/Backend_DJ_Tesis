import { Schema, model } from 'mongoose';
import bcrypt from "bcryptjs";

const clienteSchema = new Schema({
    nombre: {
        type: String,
        required: true,
        trim: true // elimina espacios innecesarios
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    telefono: {
        type: String,
        required: true,
        trim: true
    },
    direccion: {
        type: String,
        required: true,
        trim: true
    },
    provincia: {
        type: String,
        required: true,
        trim: true
    },
    ciudad: {
        type: String,
        required: true,
        trim: true
    },
    fotoPerfil: {
        type: String,
        default: null
    }
    ,
    status: {
        type: Boolean,
        default: true
    },
    token: {
        type: String,
        default: null
    },
    confirmarEmail: {
        type: Boolean,
        default: false
    },
    expoPushToken: { // Campo para guardar el token de las notificaciones para la app móvil
        type: String,
        default: null,
    }
}, {
    timestamps: true
});

// Método para cifrar el password del cliente
clienteSchema.methods.encrypPassword = async function (password) {
    const salt = await bcrypt.genSalt(10)
    const passwordEncryp = await bcrypt.hash(password, salt)
    return passwordEncryp
}

// Método para verificar si el password ingresado es el mismo de la BDD
clienteSchema.methods.matchPassword = async function (password) {
    const response = await bcrypt.compare(password, this.password)
    return response
}

clienteSchema.methods.crearToken = function () {
    const tokenGenerado = this.token = Math.random().toString(36).slice(2)
    return tokenGenerado
}

// Se exporta el modelo
export default model('Cliente', clienteSchema)

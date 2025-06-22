import { Schema, model } from 'mongoose';

const productoSchema = new Schema({
    nombreDisco: {
        type: String,
        required: true,
        trim: true
    },
    artista: {
        type: String,
        required: true,
        trim: true
    },
    precio: {
        type: Number,
        required: true
    },
    genero: {
        type: String,
        required: true,
        trim: true
    },
    stock: {
        type: Number,
        required: true,
        default: 0 // Valor por defecto en caso de que no haya stock
    },
    imagen: {
        type: String,
        required: true
    }
}, {
    timestamps: true
})

// Se exporta el modelo
export default model('Producto', productoSchema)

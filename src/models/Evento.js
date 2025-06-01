import { Schema, model } from 'mongoose';

const eventoSchema = new Schema({
    nombreEvento: {
        type: String,
        required: true,
        trim: true
    },
    fechaEvento: {
        type: Date,  // Usamos tipo Date para mejor manejo
        required: true
    },
    imagenEvento: {
        type: String,  // Aquí va la ruta o URL de la imagen subida
        required: true
    }
}, {
    timestamps: true
});

export default model('Evento', eventoSchema);

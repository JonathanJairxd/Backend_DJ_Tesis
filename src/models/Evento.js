import { Schema, model } from 'mongoose';

const eventoSchema = new Schema({
    nombreEvento: {
        type: String,
        required: true,
        trim: true
    },
    fechaEvento: {
        type: Date,  
        required: true
    },
    imagenEvento: {
        type: String,  // Se guarda la url de la imagen
        required: true
    }
}, {
    timestamps: true
});

export default model('Evento', eventoSchema);

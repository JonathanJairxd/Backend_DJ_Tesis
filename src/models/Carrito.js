import { Schema, model } from 'mongoose';

const carritoSchema = new Schema({
  cliente: {
    type: Schema.Types.ObjectId, // Cliente asociado al carrito
    ref: 'Cliente',
    required: true,
  },
  productos: [
    {
      producto: {
        type: Schema.Types.ObjectId,
        ref: 'Producto',
        required: true,
      },
      cantidad: {
        type: Number,
        required: true,
        min: 1,
      },
    }
  ],
  total: {
    type: Number,
    required: true,
    default: 0,
  }
}, {
  timestamps: true
});

// Se exporta el modelo
export default model('Carrito', carritoSchema);

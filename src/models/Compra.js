import mongoose from "mongoose";

const compraSchema = new mongoose.Schema({
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cliente",
    required: true,
  },
  productos: [
    {
      producto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Producto",
        required: true,
      },
      cantidad: {
        type: Number,
        required: true,
      },
      precio: {  // Precio del producto al momento de la compra
        type: Number,
        required: true,
      }
    }
  ],
  total: {
    type: Number,
    required: true,
  },
  costoEnvio: {
    type: Number,
    required: true,
  },
  tipoPago: {
    type: String,
    enum: ["efectivo", "transferencia"],
    required: true,
  },
  comprobantePago: {
    type: String, // Se guardara la ruta de la imagen si es transferencia
    default: null,
  },
  estado: {
    type: String,
    enum: ['pendiente', 'enviado'],
    default: 'pendiente',  // Estado inicial de la compra
  },
  direccionEnvio: {
    type: String,
    required: true,  // direccion donde el producto sera enviado
  },
  comprobanteEnvio: {
    type: String, // Se guardara la ruta de la imagen del comrpobante del envio
    default: null, 
  },
  fechaCompra: {
    type: Date,
    default: Date.now,
  },
  fechaEnvio: {
    type: Date,
    default: null, // Se llena solo cuando el pedido se marca como 'enviado'
  }
});

export default mongoose.model("Compra", compraSchema);

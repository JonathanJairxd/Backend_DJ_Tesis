import mongoose from "mongoose";

const compraSchema = new mongoose.Schema({
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cliente",
    required: true,
  },
  nombreCliente: {
    type: String,
    required: true
  },
  telefonoCliente: {
    type: Number,
    required: true
  },
  productos: [
    {
      producto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Producto",
        required: true,
      },
      nombre:{
        type: String,
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
  direccionEnvio: {
    callePrincipal: { type: String },
    calleSecundaria: { type: String },
    numeracion: { type: String },
    referencia: { type: String },
    provincia: { type: String },
    ciudad: { type: String },
    cedula: { type: String},
    nombreRecibe : {type: String}
  },
  zonaEnvio: {
    type: String,
    enum: ["quito", "provincia"],
    required: true,
  },
  metodoEnvio: {
    type: String,
    enum: ["servientrega", "encuentro-publico"],
    required: true,
  },
  costoEnvio: {
    type: Number,
    required: true,
  },
  formaPago: {
    type: String,
    required: true
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
  total: {
    type: Number,
    required: true,
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

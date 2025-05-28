import Compra from "../models/Compra.js";
import Carrito from "../models/Carrito.js";

// Obtener historial de compras del cliente
const obtenerHistorialCompras = async (req, res) => {

    try {
        let compras;

        if (req.administradorBDD) {
            // Si es admin se muestran todas las compras, con info del cliente
            compras = await Compra.find()
                .populate("cliente", "nombre email")
                .populate("productos.producto", "nombre precio")
                .select("fechaCompra tipoPago total productos cliente estado");

        } else if (req.clienteBDD) {

            compras = await Compra.find({ cliente: req.clienteBDD._id })
                .populate("productos.producto", "nombre precio")
                .select("fechaCompra total productos tipoPago estado");
        }

        if (compras.length === 0) {
            return res.status(404).json({ msg: "No tienes compras previas." });
        }

        res.status(200).json(compras);
    } catch (error) {
        res.status(500).json({ msg: "Error al obtener el historial de compras", error });
    }
};

// Finalizar compra: Convertir el carrito en una compra
// Finalizar compra: Convertir el carrito en una compra
const finalizarCompra = async (req, res) => {
    if (!req.clienteBDD) {
        return res.status(403).json({ msg: "Acceso denegado. Solo los clientes pueden realizar compras." });
    }

    // Obtener dirección de envío y tipo de pago desde el cuerpo de la solicitud
    const { direccionEnvio, tipoPago } = req.body;

    // Verificar que la dirección y el tipo de pago sean válidos
    if (!direccionEnvio || !tipoPago) {
        return res.status(400).json({ msg: "La dirección de envío y el tipo de pago son obligatorios." });
    }

    // Verificar si el pago es por transferencia, y si lo es, verificar que se haya subido el comprobante de pago
    if (tipoPago === "transferencia" && !req.file) {
        return res.status(400).json({ msg: "El comprobante de pago es obligatorio cuando el pago es por transferencia." });
    }

    // Subir la imagen del comprobante de pago a Cloudinary (si es transferencia)
    let comprobantePagoURL = null;
    if (tipoPago === "transferencia") {
        comprobantePagoURL = req.file.path; // URL de la imagen subida a Cloudinary
    }

    // Buscar el carrito del cliente
    const carrito = await Carrito.findOne({ cliente: req.clienteBDD._id })
        .populate("productos.producto", "-__v -createdAt -updatedAt");

    if (!carrito || carrito.productos.length === 0) {
        return res.status(404).json({ msg: "No tienes productos en tu carrito." });
    }

    let totalCompra = 0;
    const productosCompra = [];

    // Verificar si hay suficiente stock para los productos en el carrito
    for (let item of carrito.productos) {
        const producto = item.producto;

        if (producto.stock < item.cantidad) {
            return res.status(400).json({
                msg: `No hay suficiente stock para el producto ${producto.nombreDisco}. Solo quedan ${producto.stock} unidades disponibles.`
            });
        }

        // Si hay stock suficiente, agregamos el producto a la compra
        totalCompra += producto.precio * item.cantidad;
        productosCompra.push({
            producto: producto._id,
            cantidad: item.cantidad,
            precio: producto.precio,  // Guardamos el precio actual
        });

        // Reducir el stock del producto
        producto.stock -= item.cantidad;
        await producto.save();
    }

    // Crear una nueva compra
    const nuevaCompra = new Compra({
        cliente: req.clienteBDD._id,
        productos: productosCompra,
        total: totalCompra,
        costoEnvio: 0,  // Puedes agregar la lógica para calcular el costo de envío si es necesario
        tipoPago,
        direccionEnvio,
        comprobantePago: comprobantePagoURL,  // Guardar el comprobante de pago solo si es por transferencia
        estado: "pendiente",  // Estado inicial como pendiente
        fechaCompra: new Date(),
    });

    // Guardar la compra
    await nuevaCompra.save();

    // Limpiar el carrito después de la compra
    await Carrito.findByIdAndDelete(carrito._id);

    res.status(200).json({ msg: "Compra realizada con éxito", compra: nuevaCompra });
};

// Actualizar estado de la compra (solo para el admin)
const actualizarEstadoCompra = async (req, res) => {
    if (!req.administradorBDD) {
        return res.status(403).json({ msg: "Acceso denegado. Solo el administrador puede actualizar el estado de la compra." });
    }

    const { id } = req.params;
    const { estado } = req.body;

    // Validación del estado
    if (!estado || !['pendiente', 'enviado'].includes(estado)) {
        return res.status(400).json({ msg: "Estado inválido. Debe ser 'pendiente' o 'enviado'." });
    }

    // Verificar si la compra existe
    const compra = await Compra.findById(id);
    if (!compra) {
        return res.status(404).json({ msg: "Compra no encontrada." });
    }

    // Si el estado cambia a 'enviado', verificamos que se haya subido el comprobante de envío
    if (estado === 'enviado' && !req.file) {
        return res.status(400).json({ msg: "El comprobante de envío es obligatorio cuando el estado es 'enviado'." });
    }

    // Si el estado cambia a 'enviado', subimos el comprobante de envío a Cloudinary
    if (estado === 'enviado') {
        compra.comprobanteEnvio = req.file.path;  // Guardamos la URL del comprobante de envío desde Cloudinary
        compra.fechaEnvio = new Date();  // Fecha de envío
    }

    // Actualizar el estado de la compra
    compra.estado = estado;

    await compra.save();

    res.status(200).json({ msg: "Estado de la compra actualizado con éxito.", compra });
};

export {
    obtenerHistorialCompras,
    finalizarCompra,
    actualizarEstadoCompra
};

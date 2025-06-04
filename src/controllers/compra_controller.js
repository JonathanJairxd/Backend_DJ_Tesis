import mongoose from 'mongoose';
import Compra from "../models/Compra.js";
import Carrito from "../models/Carrito.js";
import Producto from '../models/Producto.js';
import Cliente from '../models/Cliente.js';
import { sendNotificacionNuevaCompra, sendNotificacionPedidoEnviado, sendNotificacionCompraRealizadaEncuentro } from "../config/nodemailer.js"
// Para las notificaciones
import enviarNotificacionPush from '../helpers/notificacionPush.js';


// Finalizar compra: Convertir el carrito en una compra
// Finalizar compra: Convertir el carrito en una compra
const finalizarCompra = async (req, res) => {
    try {
        if (!req.clienteBDD) {
            return res.status(403).json({ msg: "Acceso denegado. Solo los clientes pueden realizar compras." });
        }

        // Obtener dirección de envío y tipo de pago desde el cuerpo de la solicitud
        let { direccionEnvio, zonaEnvio, metodoEnvio, formaPago } = req.body;

        // Verificar que la dirección y el tipo de pago sean válidos
        if (!zonaEnvio || !metodoEnvio) {
            return res.status(400).json({ msg: "La zona de envio y el método de envio son obligatorios" });
        }

        // Validar encuentro publico solo para Quito
        if (metodoEnvio === "encuentro-publico" && zonaEnvio.toLowerCase() !== "quito") {
            return res.status(400).json({ msg: "La opción de 'Encuentro Público' solo está disponible para la ciudad de Quito" });
        }

        // Si es servientrega, intentamos parsear la dirección que viene como texto JSON (Para probarle en el postman
        if (metodoEnvio === "servientrega" && typeof direccionEnvio === 'string') {
            try {
                direccionEnvio = JSON.parse(direccionEnvio);
            } catch (err) {
                return res.status(400).json({ msg: "La dirección de envío no tiene un formato JSON válido." });
            }
        }

        /// Si es servientrega, dirección y comprobante son obligatorios
        if (metodoEnvio === "servientrega") {
            if (!direccionEnvio) {
                return res.status(400).json({ msg: "La dirección de envío es obligatoria para Servientrega." });
            }

            const { callePrincipal, calleSecundaria, numeracion, referencia, provincia, ciudad } = direccionEnvio;

            if (!callePrincipal || !calleSecundaria || !numeracion || !referencia || !provincia || !ciudad) {
                return res.status(400).json({ msg: "Todos los campos de la dirección de envío son obligatorios para Servientrega" });
            }

            if (!req.file) {
                return res.status(400).json({ msg: "El comprobante de pago es obligatorio para Servientrega." });
            }
        }

        // Subir la imagen del comprobante de pago a Cloudinary (si es por servientrega (transferencia))
        let comprobantePagoURL = null;
        if (metodoEnvio === "servientrega") {
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
                nombre: producto.nombreDisco,
                cantidad: item.cantidad,
                precio: producto.precio,  // Guardamos el precio actual
            });
        }

        // Calcular costo adicional de envio si es Servientrega
        let costoEnvio = 0;
        if (metodoEnvio === "servientrega") {
            if (zonaEnvio.toLowerCase() === "quito") {
                costoEnvio = 3.50;
            } else {
                costoEnvio = 6.00;
            }
        }

        // Crear una nueva compra
        const nuevaCompra = new Compra({
            cliente: req.clienteBDD._id,
            nombreCliente: req.clienteBDD.nombre,
            telefonoCliente: req.clienteBDD.telefono,
            productos: productosCompra,
            total: totalCompra + costoEnvio,
            costoEnvio: costoEnvio,
            zonaEnvio,
            metodoEnvio,
            formaPago,
            direccionEnvio: metodoEnvio === "servientrega" ? direccionEnvio : null,
            comprobantePago: comprobantePagoURL,  // Guardar el comprobante de pago solo si es por servientrega
            estado: "pendiente",  // Estado inicial como pendiente
            fechaCompra: new Date(),
        });

        // Guardar la compra
        await nuevaCompra.save();

        const adminEmail = process.env.ADMIN_EMAIL;

        if (adminEmail) {
            await sendNotificacionNuevaCompra(adminEmail, req.clienteBDD.nombre, nuevaCompra.total, metodoEnvio);
        } else {
            console.warn("No se encontró el correo del administrador");
        }

        // Reducir el stock del producto
        for (let item of carrito.productos) {
            const producto = await Producto.findById(item.producto._id);
            producto.stock -= item.cantidad;
            await producto.save();
        }
        // Limpiar el carrito después de la compra
        await Carrito.findByIdAndDelete(carrito._id);

        res.status(200).json({ msg: "Compra realizada con éxito", compra: nuevaCompra });

    } catch (error) {
        res.status(400).json({ msg: "Hubo un error al intentar finalizar la compra. Por favor, inténtalo de nuevo más tarde" });
    }
};

// Obtener historial de compras del cliente
const listarHistorialCompras = async (req, res) => {

    try {
        let compras;

        if (req.administradorBDD) {
            // Si es admin se muestran todas las compras, con info del cliente
            compras = await Compra.find()
                .populate("cliente", "nombre email")
                /*.populate("productos.producto", "nombre precio")*/
                /*.select("fechaCompra zonaEnvio metodoEnvio total productos cliente estado");*/
                .select("fechaCompra total estado cliente");
        } else if (req.clienteBDD) {
            // Si es el cliente ve sus compras relizadas
            compras = await Compra.find({ cliente: req.clienteBDD._id })
                /*.populate("productos.producto", "nombre precio")
                .select("fechaCompra total productos zonaEnvio metodoEnvio estado");*/
                .select("fechaCompra total estado")
        } else {
            return res.status(403).json({ msg: "Lo sentimos, solo las personas autorizadas pueden acceder a esta información" });
        }

        if (compras.length === 0) {
            return res.status(404).json({ msg: "No tienes compras previas." });
        }

        res.status(200).json(compras);
    } catch (error) {
        res.status(500).json({ msg: "Hubo un error al intentar listar la compra. Por favor, inténtalo de nuevo más tarde" });
    }
};

const detalleHistorialCompras = async (req, res) => {
    const { id } = req.params;

    // Verificar si el id es válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ msg: `Lo sentimos, no existe la compra con ID: ${id}` });
    }

    try {
        // Buscar la compra en la base de datos
        const compra = await Compra.findById(id)
            .populate("cliente", "nombre email telefono direccion")
            .populate("productos.producto", "nombre precio descripcion imagen") // si guardas los productos como referencias
            .select("-updatedAt -__v");

        // Verificar si la compra existe
        if (!compra) {
            return res.status(404).json({ msg: `Compra con ID: ${id} no encontrada o ya fue eliminada` });
        }

        // Se verifica si es admin o no paraver el listado de todas las compras de los clientes
        if (req.administradorBDD) {
            // Admin puede ver todo 
        } else if (req.clienteBDD) {
            if (compra.cliente._id.toString() !== req.clienteBDD._id.toString()) {
                return res.status(403).json({ msg: "No tienes permiso para ver esta compra" });
            }
        } else {
            return res.status(403).json({ msg: "Lo sentimos, solo las personas autorizadas pueden acceder a esta información" });
        }

        // Devolver detalles de la compra
        res.status(200).json(compra);

    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Hubo un error al intentar detallar la compra. Por favor, inténtalo de nuevo más tarde" });
    }
};

// Actualizar estado de la compra (solo para el admin)
const actualizarEstadoCompra = async (req, res) => {
    if (!req.administradorBDD) {
        return res.status(403).json({ msg: "Acceso denegado. Solo el administrador puede actualizar el estado de la compra." });
    }

    try {
        const { id } = req.params;
        const { estado } = req.body;

        // Validación del estado
        if (!estado || !['pendiente', 'enviado'].includes(estado)) {
            return res.status(400).json({ msg: "Estado inválido. Debe ser 'pendiente' o 'enviado'." });
        }

        // Verificar si la compra existe
        const compra = await Compra.findById(id).populate("cliente", "nombre email");
        if (!compra) {
            return res.status(404).json({ msg: "Compra no encontrada." });
        }

        // Validar que 'encuentro-publico' solo se use en Quito
        if (compra.metodoEnvio === "encuentro-publico" && compra.zonaEnvio !== "quito") {
            return res.status(400).json({ msg: "El método 'Encuentro Público' solo está disponible para compras dentro de la ciudad de Quito." });
        }

        // Si el estado es 'enviado', validar según método de envío
        if (estado === 'enviado') {
            if (compra.metodoEnvio === "servientrega" && !req.file) {
                return res.status(400).json({
                    msg: "El comprobante de envío es obligatorio para envíos por Servientrega."
                });
            }

            if (compra.metodoEnvio === "encuentro-publico" && req.file) {
                return res.status(400).json({
                    msg: "No debes subir un comprobante de envío para métodos de tipo 'Encuentro Público'."
                });
            }

            // Actualizar comprobante y fecha de envío
            if (compra.metodoEnvio === "servientrega") {
                compra.comprobanteEnvio = req.file.path;
                compra.fechaEnvio = new Date(); // Se cambia cuando se marca como enviado
            }
        }

        // Actualizar el estado de la compra
        compra.estado = estado;

        await compra.save();

        // Enviar notificación al correo del cliente solo si el estado es 'enviado'
        if (estado === 'enviado') {
            const clienteEmail = compra.cliente?.email;
            const clienteNombre = compra.cliente?.nombre;
            const clienteId = compra.cliente?._id;

            // Aseguramos tener el método de envío de la compra
            const metodoEnvio = compra.metodoEnvio;

            if (clienteEmail) {
                if (metodoEnvio === "servientrega") {
                    // Enviar correo estándar para envío
                    await sendNotificacionPedidoEnviado(clienteEmail, clienteNombre, compra._id.toString());
                } else if (metodoEnvio === "encuentro-publico") {
                    // Enviar correo personalizado para encuentro público
                    await sendNotificacionCompraRealizadaEncuentro(clienteEmail, clienteNombre, compra._id.toString());
                } else {
                    console.warn("Método de envío desconocido");
                }
            } else {
                console.warn("No se encontró email del cliente para enviar notificación.");
            }

            // Enviar notificación push al movil del cliente
            const cliente = await Cliente.findById(clienteId); // Importa el modelo Cliente si no lo tienes aquí

            // Validar que el cliente exista y tenga token
            if (cliente && cliente.expoPushToken) {
                let mensajePush = '';

                if (metodoEnvio === "servientrega") {
                    mensajePush = 'Tu disco de vinilo ya está en camino.';
                } else if (metodoEnvio === "encuentro-publico") {
                    mensajePush = 'Tu disco de vinilo se entrego de manera exitosa.';
                }

                await enviarNotificacionPush(
                    cliente.expoPushToken,
                    'Pedido Enviado',
                    mensajePush
                );
            }
        }

        res.status(200).json({ msg: "Estado de la compra actualizado con éxito.", compra });

    } catch (error) {
        console.log(error)
        res.status(400).json({ msg: "Hubo un error al intentar actualizar el estado de una compra. Por favor, inténtalo de nuevo más tarde" });
    }

};

export {
    listarHistorialCompras,
    detalleHistorialCompras,
    finalizarCompra,
    actualizarEstadoCompra
};

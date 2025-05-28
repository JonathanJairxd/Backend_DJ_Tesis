import Carrito from "../models/Carrito.js";
import Producto from "../models/Producto.js";
import mongoose from "mongoose";

// Agregar producto al carrito
const agregarAlCarrito = async (req, res) => {
    if (!req.clienteBDD) {
        return res.status(403).json({ msg: "Acceso denegado. Solo los clientes pueden agregar productos al carrito" });
    }

    try {

        const { productos } = req.body; // Lista de productos a agregar

        if (!productos || productos.length === 0) {
            return res.status(400).json({ msg: "El carrito debe contener al menos un producto" });
        }

        let carrito = await Carrito.findOne({ cliente: req.clienteBDD._id });

        if (!carrito) {
            carrito = new Carrito({
                cliente: req.clienteBDD._id,
                productos: [],
                total: 0,
            });
        }

        for (let prod of productos) {
            const { productoId, cantidad } = prod;

            if (!productoId || !cantidad) {
                return res.status(400).json({ msg: "El producto y la cantidad son obligatorios" });
            }

            if (!mongoose.Types.ObjectId.isValid(productoId)) {
                return res.status(400).json({ msg: "ID de producto no válido" });
            }

            // Verificamos si el producto existe
            const producto = await Producto.findById(productoId);
            if (!producto) {
                return res.status(404).json({ msg: `Producto con ID: ${productoId} no encontrado` });
            }

            if (producto.stock < cantidad) {
                return res.status(400).json({ msg: `No hay suficiente stock para el producto ${producto.nombreDisco}` });
            }

            // Comprobamos si el producto ya está en el carrito
            const existe = carrito.productos.find(p => p.producto.toString() === productoId);
            if (existe) {
                return res.status(400).json({ msg: `El producto ${producto.nombreDisco} ya está en el carrito` });
            }

            // Agregar el producto al carrito
            carrito.productos.push({ producto: productoId, cantidad });
            carrito.total += producto.precio * cantidad;
        }

        await carrito.save();
        res.status(200).json({ msg: "Productos agregados al carrito correctamente" });

    } catch (error) {
        return res.status(500).json({ msg: "Hubo un error al intentar agregar un producto al carrito. Por favor, inténtalo de nuevo más tarde" })
    }
};

// Obtener carrito del cliente
const obtenerCarrito = async (req, res) => {
    if (!req.clienteBDD) {
        return res.status(403).json({ msg: "Acceso denegado. Solo los clientes pueden ver su carrito" });
    }

    try {

        const carrito = await Carrito.findOne({ cliente: req.clienteBDD._id })
            .populate("productos.producto", "-__v -createdAt -updatedAt");

        if (!carrito || carrito.productos.length === 0) {
            return res.status(404).json({ msg: "No tienes productos en el carrito" });
        }

        res.status(200).json(carrito);

    } catch (error) {
        return res.status(500).json({ msg: "Hubo un error al intentar obtener los productos del carrito. Por favor, inténtalo de nuevo más tarde" })
    }
};

// Actualizar cantidad de un producto en el carrito
const actualizarCantidad = async (req, res) => {

    if (!req.clienteBDD) {
        return res.status(403).json({ msg: "Acceso denegado.  Solo los clientes pueden actualizar la cantidad del producto" });
    }

    try {

        const { productoId, nuevaCantidad } = req.body;

        if (!productoId || !nuevaCantidad) {
            return res.status(400).json({ msg: "Todos los campos son obligatorios" });
        }

        if (!mongoose.Types.ObjectId.isValid(productoId)) {
            return res.status(400).json({ msg: "ID de producto no válido" });
        }

        const carrito = await Carrito.findOne({ cliente: req.clienteBDD._id });
        if (!carrito) {
            return res.status(404).json({ msg: "Carrito no encontrado" });
        }

        const item = carrito.productos.find(p => p.producto.toString() === productoId);
        if (!item) {
            return res.status(404).json({ msg: "Producto no está en tu carrito" });
        }

        const producto = await Producto.findById(productoId);
        if (!producto) {
            return res.status(404).json({ msg: "Producto no existe" });
        }

        if (producto.stock < nuevaCantidad) {
            return res.status(400).json({ msg: "No hay suficiente stock disponible" });
        }

        carrito.total -= item.cantidad * producto.precio;
        item.cantidad = nuevaCantidad;
        carrito.total += nuevaCantidad * producto.precio;

        await carrito.save();
        res.status(200).json({ msg: "Cantidad actualizada correctamente" });

    } catch (error) {
        return res.status(500).json({ msg: "Hubo un error al intentar actualizar la cantidad de un producto del carrito. Por favor, inténtalo de nuevo más tarde" })
    }
};

// Eliminar producto del carrito
const eliminarDelCarrito = async (req, res) => {

    if (!req.clienteBDD) {
        return res.status(403).json({ msg: "Acceso denegado. Solo los clientes pueden eliminar productos del carrito" });
    }

    try {
        const { productoId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productoId)) {
            return res.status(400).json({ msg: "ID de producto no válido" });
        }

        const carrito = await Carrito.findOne({ cliente: req.clienteBDD._id });
        if (!carrito) {
            return res.status(404).json({ msg: "Carrito no encontrado" });
        }

        const item = carrito.productos.find(p => p.producto.toString() === productoId);
        if (!item) {
            return res.status(404).json({ msg: "Producto no está en tu carrito" });
        }

        const producto = await Producto.findById(productoId);
        carrito.total -= item.cantidad * producto.precio;
        carrito.productos = carrito.productos.filter(p => p.producto.toString() !== productoId);

        await carrito.save();
        res.status(200).json({ msg: "Producto eliminado del carrito correctamente" });

    } catch (error) {
        return res.status(500).json({ msg: "Hubo un error al intentar eliminar productos del carrito. Por favor, inténtalo de nuevo más tarde" })
    }
};

export {
    agregarAlCarrito,
    obtenerCarrito,
    actualizarCantidad,
    eliminarDelCarrito
};

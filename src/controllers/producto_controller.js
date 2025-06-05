import Producto from "../models/Producto.js"
import mongoose from "mongoose"

const registrarProducto = async (req, res) => {

    // Verificar que el cliente con el id del token exista en la base de datos
    // Se usa tambien para verificar el token de acuerdo al rol que le es permitido
    if (!req.administradorBDD) {
        return res.status(404).json({ msg: "Acceso denegado. Solo el administrador puede registrar productos" });
    }

    try {

        const { nombreDisco, artista, precio, genero, generoPersonalizado, stock } = req.body

        //Para que se pueda pedir la imagen
        const imagen = req.file?.path

        if (!imagen) {
            return res.status(400).json({ msg: "La imagen es obligatoria" })
        }

        // Validar que no haya campos vacios
        if (Object.values(req.body).includes("")) {
            return res.status(400).json({ msg: "Lo sentimos, debes llenar todos los campos" })
        }

        // Validar que el precio y el stock sean numeros validos
        if (isNaN(precio) || isNaN(stock)) {
            return res.status(400).json({ msg: "El precio y el stock deben ser números válidos" })
        }

        // Generos predefinidos
        const generosPermitidos = ['Electrónica', 'House', 'Tecno', 'Rock', 'Pop', 'Reggae', 'Funk', 'Hip-Hop', 'Latino', 'Otro']

        if (!generosPermitidos.includes(genero)) {
            return res.status(400).json({ msg: "Género no válido" });
        }

        // Si el genero es "Otro", se debe ingresar un nuevo genero
        if (genero === "Otro") {
            if (!generoPersonalizado || generoPersonalizado.trim() === "") {
                return res.status(400).json({ msg: "Debes escribir un género personalizado" });
            }
            // Reemplaza el valor de "genero" directamente
            req.body.genero = generoPersonalizado.trim();
        }

        // Verificar si el producto ya esta registrado en la base de datos
        const verificarProductoBDD = await Producto.findOne({ nombreDisco })
        if (verificarProductoBDD) {
            return res.status(400).json({ msg: "Lo sentimos, el producto ya se encuentra registrado" })
        }

        // Crear el nuevo producto
        const nuevoProducto = new Producto({
            nombreDisco,
            artista,
            precio,
            genero: req.body.genero,
            stock,
            imagen
        })

        // Guardar el producto en la base de datos
        await nuevoProducto.save()

        // Se responde con exito y los detalles del producto registrado 
        res.status(200).json({ msg: "Producto registrado con éxito" })

    } catch (error) {
        return res.status(400).json({ msg: "Hubo un error al intentar registrar un producto. Por favor, inténtalo de nuevo más tarde" })
    }

}

const listarProducto = async (req, res) => {
    try {
        if (req.administradorBDD) {
            // El administrador ve información resumida
            const productos = await Producto.find()
                .select("nombreDisco artista precio stock");

            return res.status(200).json(productos);
        }

        if (req.clienteBDD) {
            // El cliente ve mas detalles
            const productos = await Producto.find()
                .select("-createdAt -updatedAt -__v");

            return res.status(200).json(productos);
        }

        return res.status(401).json({ msg: "Acceso denegado. Debes iniciar sesión como administrador o cliente para ver los productos" });

    } catch (error) {
        res.status(400).json({ msg: "Hubo un error al intentar obtener la lista de productos" })
    }
}

const detalleProducto = async (req, res) => {

    if (!req.administradorBDD && !req.clienteBDD) {
        return res.status(401).json({ msg: "Acceso denegado. Debes iniciar sesión como administrador o cliente para ver los detalles de los productos" });
    }

    try {

        const { id } = req.params

        // Verificar si el id es valido
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ msg: `Lo sentimos, no existe el producto con ID: ${id}` })
        }

        // Buscar el producto en la base de datos
        const producto = await Producto.findById(id).select("-createdAt -updatedAt -__v")

        // // Verificar si el producto existe en la base de datos () si se encontro
        if (!producto) {
            return res.status(404).json({ msg: `Producto con ID: ${id} no encontrado o ya fue eliminado` })
        }

        // Detalles del producto
        res.status(200).json(producto)

    } catch (error) {
        res.status(400).json({ msg: "Hubo un error al intentar detallar un producto. Por favor, inténtalo de nuevo más tarde" })
    }
}


const actualizarProducto = async (req, res) => {

    if (!req.administradorBDD) {
        return res.status(404).json({ msg: "Acceso denegado. Solo el administrador puede actualizar productos" });
    }

    const { id } = req.params

    if (req.body && Object.values(req.body).includes("")) {
        return res.status(400).json({ msg: "Lo sentimos, debes llenar todos los campos" })
    }

    // Verificar que el id sea valido
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ msg: `Lo sentimos, no existe el producto con ID: ${id}` })
    }

    try {

        // Verificar si el producto existe en la base de datos
        const producto = await Producto.findById(id);
        if (!producto) {
            return res.status(404).json({ msg: `Producto con ID: ${id} no encontrado o ya fue eliminado` })
        }

        // {new:true} : indica a Mongoose que despues de actualizar un documento
        // devuelva la version mas reciente que se actualizo

        // Generos predefinidos
        const generosPermitidos = ['Electrónica', 'House', 'Tecno', 'Rock', 'Pop', 'Reggae', 'Funk', 'Hip-Hop', 'Latino', 'Otro']

        // Si el género no es válido, responder con error
        if (!generosPermitidos.includes(req.body.genero)) {
            return res.status(400).json({ msg: "Género no válido" });
        }

        // Si el género es "Otro", debe ingresar un nuevo género personalizado
        if (req.body.genero === "Otro") {
            if (!req.body.generoPersonalizado || req.body.generoPersonalizado.trim() === "") {
                return res.status(400).json({ msg: "Debes escribir un género personalizado" });
            }
            // Reemplaza el valor de "genero" con el personalizado
            req.body.genero = req.body.generoPersonalizado.trim();
        }

        // Si hay una imagen nueva, actualiza la imagen
        if (req.file) {
            producto.imagen = req.file.path; // o filename : para que se vea el nombre de la imagen
        }

        // Actualizar el producto con los datos que se desee
        await Producto.findByIdAndUpdate(id, { ...req.body, imagen: producto.imagen }, { new: true });

        res.status(200).json({ msg: "Producto actualizado con éxito" })

    } catch (error) {
        return res.status(400).json({ msg: "Hubo un error al intentar actualizar la info de un producto. Por favor, inténtalo de nuevo más tarde" });
    }

}

const eliminarProducto = async (req, res) => {

    if (!req.administradorBDD) {
        return res.status(404).json({ msg: "Acceso denegado. Solo el administrador puede eliminar productos" });
    }

    try {

        const { id } = req.params

        // Verificar que el id sea valido
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ msg: `Lo sentimos, no existe el producto con ID: ${id}` })
        }

        // Verificar si el producto existe en la base de datos (si ya fue eliminado)
        const producto = await Producto.findById(id);
        if (!producto) {
            return res.status(404).json({ msg: `El producto con ID: ${id} no existe` });
        }

        // Se elimina el producto de la base de datos
        await Producto.findByIdAndDelete(id)

        res.status(200).json({ msg: "Producto eliminado exitosamente" })

    } catch (error) {
        res.status(400).json({ msg: "Hubo un error al intentar eliminar un producto. Por favor, inténtalo de nuevo más tarde" })
    }

}



export {
    registrarProducto,
    listarProducto,
    detalleProducto,
    actualizarProducto,
    eliminarProducto
}
import Evento from '../models/Evento.js';
import mongoose from 'mongoose';

// Registrar evento 
const registrarEvento = async (req, res) => {
    if (!req.administradorBDD) {
        return res.status(403).json({ msg: "Acceso denegado. Solo el administrador puede registrar eventos" });
    }

    try {

        const { nombreEvento, fechaEvento } = req.body;
        const imagenEvento = req.file?.path;

        if (!imagenEvento) {
            return res.status(400).json({ msg: "La imagen del evento es obligatoria" });
        }

        if (!nombreEvento || !fechaEvento) {
            return res.status(400).json({ msg: "Todos los campos son obligatorios" });
        }

        // Validar el formato de la fecha (YYYY-MM-DD)
        const fecha = new Date(fechaEvento);
        if (isNaN(fecha.getTime())) {
            return res.status(400).json({ msg: "La fecha no tiene un formato válido" });
        }

        // Validar si ya existe un evento con el mismo nombre
        const verificarEventoExistente = await Evento.findOne({ nombreEvento });

        if (verificarEventoExistente) {
            return res.status(400).json({ msg: "Lo sentimos, el producto ya se encuentra registrado con el mismo nombre" });
        }


        const nuevoEvento = new Evento({
            nombreEvento,
            fechaEvento,
            imagenEvento
        });

        await nuevoEvento.save();

        res.status(201).json({ msg: "Evento registrado con éxito." });
    } catch (error) {
        res.status(500).json({ msg: "Hubo un error al intentar registrar el evento. Por favor, inténtalo de nuevo más tarde" });
    }
};

// Listar todos los eventos 
const listarEventos = async (req, res) => {
    // Verificar si el usuario es administrador o cliente autenticado
    if (!req.administradorBDD && !req.clienteBDD) {
        return res.status(401).json({ msg: "Acceso denegado. Debes iniciar sesión como administrador o cliente para ver los eventos" });
    }

    try {
        const eventos = await Evento.find().select("-createdAt -updatedAt -__v");
        res.status(200).json(eventos);

    } catch (error) {
        res.status(500).json({ msg: "Hubo un error al intentar listar los eventos. Por favor, inténtalo de nuevo más tarde" });
    }
};

// Detallar un evento 
const detalleEvento = async (req, res) => {
    if (!req.administradorBDD && !req.clienteBDD) {
        return res.status(401).json({ msg: "Acceso denegado. Debes iniciar sesión como administrador o cliente para ver los detalles del evento" });
    }

    try {
        const { id } = req.params;

        // Validar si el ID es válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ msg: `Lo sentimos, no existe el evento con ID: ${id}` });
        }

        // Buscar el evento por ID
        const evento = await Evento.findById(id).select("-createdAt -updatedAt -__v");

        // Verificar si el evento fue encontrado
        if (!evento) {
            return res.status(404).json({ msg: `Evento con ID: ${id} no encontrado o ya fue eliminado` });
        }

        res.status(200).json(evento);

    } catch (error) {
        res.status(400).json({ msg: "Hubo un error al intentar detallar un evento. Por favor, inténtalo de nuevo más tarde" });
    }
};


// Actualizar evento
const actualizarEvento = async (req, res) => {
    if (!req.administradorBDD) {
        return res.status(403).json({ msg: "Acceso denegado. Solo el administrador puede actualizar eventos" });
    }

    try {
        const { id } = req.params;
        const { nombreEvento, fechaEvento } = req.body;

        // Validar campos obligatorios
        if (req.body && Object.values(req.body).includes("")) {
            return res.status(400).json({ msg: "Lo sentimos, debes llenar todos los campos" })
        }
        // Verificar si el ID es válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ msg: "ID de evento inválido" });
        }

        // Verificar si el evento existe
        const evento = await Evento.findById(id);
        if (!evento) {
            return res.status(404).json({ msg: `Evento con ID: ${id} no encontrado o eliminado` });
        }

        // Validar el formato de la fecha (YYYY-MM-DD)
        const fecha = new Date(fechaEvento);
        if (isNaN(fecha.getTime())) {
            return res.status(400).json({ msg: "La fecha no tiene un formato válido" });
        }

        // Actualizar imagen si viene nueva
        if (req.file) {
            evento.imagenEvento = req.file.path;
        }

        // Actualizar campos
        evento.nombreEvento = nombreEvento;
        evento.fechaEvento = fechaEvento;

        // Guardar cambios
        await evento.save();

        res.status(200).json({ msg: "Evento actualizado con éxito" });

    } catch (error) {
        res.status(500).json({ msg: "Hubo un error al intentar actualizar el evento. Por favor, inténtalo de nuevo más tarde" });
    }
};

// Eliminar evento 
const eliminarEvento = async (req, res) => {
    if (!req.administradorBDD) {
        return res.status(403).json({ msg: "Acceso denegado. Solo el administrador puede eliminar eventos" });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: "ID de evento inválido" });
    }

    try {
        const eventoEliminado = await Evento.findByIdAndDelete(id);

        if (!eventoEliminado) {
            return res.status(404).json({ msg: "Evento no encontrado" });
        }

        res.status(200).json({ msg: "Evento eliminado con éxito." });
    } catch (error) {
        res.status(500).json({ msg: "Hubo un error al intentar eliminar el evento. Por favor, inténtalo de nuevo más tarde" });
    }
};

export {
    registrarEvento,
    listarEventos,
    detalleEvento,
    actualizarEvento,
    eliminarEvento
};
// Requerir los módulos
import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors';

// Se importa las rutas
import routerAdministrador from './routers/administrador_routes.js';

import routerClientes from './routers/cliente_routes.js';

import routerProducto from './routers/producto_routes.js';

import routerCarrito from './routers/carrito_routes.js';

import routerCompra from './routers/compra_routes.js';

// Inicializaciones
const app = express()
dotenv.config()

// Configuraciones 
app.set('port',process.env.port || 3000)
app.use(cors())

// Middlewares 
app.use(express.json())


// Variables globales


// Rutas 
app.get('/',(req,res)=>{
    res.send("Server on")
})

// Ruta del administrador
app.use('/api',routerAdministrador)

// Ruta del cliente
app.use('/api',routerClientes)

// Ruta del producto
app.use('/api',routerProducto)

// Ruta del carrito de compras
app.use('/api',routerCarrito)

// Ruta de las compras
app.use('/api',routerCompra)

// Rutas no encontradas
app.use((req,res)=>res.status(404).send("Endpoint no encontrado - 404"))


// Exportar la instancia de express por medio de app
export default  app
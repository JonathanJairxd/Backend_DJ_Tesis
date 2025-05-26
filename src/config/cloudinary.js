// config/cloudinary.js
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// Storage para los productos
const storageProductos = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'productos',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
})

// Storage para las fotos de los clientes (perfil)
const storageClientes = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'clientes',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
})

// Storage para los comprobantes de pago de la compra
const storageComprobantesPago = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'comprobantes_pago',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
})

// Storage para los comprobantes de envio de los productos
const storageComprobantesEnvio = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'comprobantes_envio',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
})


export { cloudinary, storageProductos, 
  storageClientes, 
  storageComprobantesPago , 
  storageComprobantesEnvio }

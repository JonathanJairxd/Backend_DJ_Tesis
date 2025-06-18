// tests/unitarias/carritoAgregar.test.js
import request from 'supertest';
import app from '../../src/server.js';
import mongoose from 'mongoose';
import Cliente from '../../src/models/Cliente.js';
import Producto from '../../src/models/Producto.js';
import Carrito from '../../src/models/Carrito.js';

jest.mock('../../src/config/nodemailer.js', () => ({
  sendMailToCliente: jest.fn(() => Promise.resolve("Correo simulado")),
}));

describe('POST /api/carrito/agregar', () => {
  let clienteToken;
  let clienteId;
  let producto;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URL_TEST || 'mongodb://localhost:27017/tienda_test');
  });

  beforeEach(async () => {
    await Cliente.deleteMany({});
    await Producto.deleteMany({});
    await Carrito.deleteMany({});

    // Registrar cliente
    const clienteData = {
      nombre: "Cliente Test",
      email: "cliente@test.com",
      password: "123456",
      telefono: "123456789",
      direccion: "Calle Falsa 123",
      provincia: "Pichincha",
      ciudad: "Quito",
      confirmarEmail: true
    };

    const cliente = new Cliente(clienteData);
    cliente.password = await cliente.encrypPassword(clienteData.password);
    await cliente.save();

    clienteId = cliente._id;

    // Login para obtener token
    const loginRes = await request(app)
      .post('/api/cliente/login')
      .send({
        email: "cliente@test.com",
        password: "123456"
      });

    clienteToken = loginRes.body.token;

    // Crear producto para agregar al carrito
    producto = await Producto.create({
      nombreDisco: "Disco de prueba",
      artista: "Artista Test",
      precio: 10,
      stock: 100,
      descripcion: "Disco de prueba para carrito",
      imagen: "https://ejemplo.com/portada.jpg", 
      genero: "Rock",
      formato: "Vinilo",
      estado: true
    });
  });

  afterEach(async () => {
    await Cliente.deleteMany({});
    await Producto.deleteMany({});
    await Carrito.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('Debería agregar un producto al carrito correctamente', async () => {
    const res = await request(app)
      .post('/api/carrito/agregar')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({
        productos: [
          {
            productoId: producto._id.toString(),
            cantidad: 2
          }
        ]
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.msg).toBe("Productos agregados al carrito correctamente");

    const carrito = await Carrito.findOne({ cliente: clienteId });
    expect(carrito).not.toBeNull();
    expect(carrito.productos.length).toBe(1);
    expect(carrito.total).toBe(20); 
  });

  ('No debería permitir agregar un producto inexistente', async () => {
    const res = await request(app)
      .post('/api/carrito/agregar')
      .itset('Authorization', `Bearer ${clienteToken}`)
      .send({
        productos: [
          {
            productoId: new mongoose.Types.ObjectId(), 
            cantidad: 1
          }
        ]
      });

    expect(res.statusCode).toBe(404);
    expect(res.body.msg).toContain("Producto con ID");
  });

});
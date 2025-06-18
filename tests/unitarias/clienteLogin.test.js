import request from 'supertest';
import app from '../../src/server.js';
import mongoose from 'mongoose';
import Cliente from '../../src/models/Cliente.js';

jest.mock('../../src/config/nodemailer.js', () => ({
  sendMailToCliente: jest.fn(),
  sendMailToRecoveryPassword: jest.fn()
}));

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URL_TEST || 'mongodb://localhost:27017/tienda_test');
});

beforeEach(async () => {
  await Cliente.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('POST /api/cliente/login', () => {

  it('Debería iniciar sesión correctamente con credenciales válidas', async () => {
    // Crear cliente usando el modelo y encriptar la contraseña manualmente
    const clienteData = {
      nombre: "Juan Login",
      email: "juanlogin@test.com",
      password: "123456", 
      telefono: "123456789",
      direccion: "Calle Falsa 123",
      provincia: "Pichincha",
      ciudad: "Quito",
      confirmarEmail: true
    };

    // Encriptar la contraseña antes de guardar
    const cliente = new Cliente(clienteData);
    cliente.password = await cliente.encrypPassword(clienteData.password); 
    await cliente.save();

    const res = await request(app)
      .post('/api/cliente/login')
      .send({
        email: "juanlogin@test.com",
        password: "123456"
      });

    expect(res.statusCode).toBe(200); 
    expect(res.body).toHaveProperty('token');
    expect(res.body.email).toBe("juanlogin@test.com");
    expect(res.body.nombre).toBe("Juan Login");
  });

});
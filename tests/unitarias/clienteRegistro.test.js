import request from 'supertest';
import app from '../../src/server.js'; // Ajusta la ruta si no es exacta
import mongoose from 'mongoose';
import Cliente from '../../src/models/Cliente.js';

jest.mock('../../src/config/nodemailer.js', () => ({
  sendMailToCliente: jest.fn(() => Promise.resolve("Correo simulado")),
  sendMailToRecoveryPassword: jest.fn(() => Promise.resolve("Recuperación simulada")),
}));

// Limpia la base de datos antes y después de los tests
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URL_TEST || 'mongodb://localhost:27017/tienda_test');
});

afterEach(async () => {
  await Cliente.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('POST /api/cliente/registro', () => {

  it('Debería registrar correctamente a un cliente nuevo', async () => {
    const nuevoCliente = {
      nombre: "Jonathan Test",
      telefono: "123456789",
      direccion: "Calle Falsa 123",
      provincia: "Pichincha",
      ciudad: "Quito",
      email: "jonathan@test.com",
      password: "123456",
      confirmarPassword: "123456"
    };

    const res = await request(app)
      .post('/api/cliente/registro')
      .send(nuevoCliente);

    expect(res.statusCode).toBe(200);
    expect(res.body.msg).toBe("Revisa tu correo electrónico para confirmar tu cuenta");

    // Verifica si el cliente fue creado en la base de datos
    const clienteBDD = await Cliente.findOne({ email: nuevoCliente.email });
    expect(clienteBDD).not.toBeNull();
    expect(clienteBDD.nombre).toBe("Jonathan Test");
  }, 10000);

  it('Debería fallar si falta algún campo', async () => {
    const res = await request(app)
      .post('/api/cliente/registro')
      .send({
        nombre: "",
        telefono: "123456789",
        direccion: "Calle Falsa 123",
        provincia: "Pichincha",
        ciudad: "Quito",
        email: "incompleto@test.com",
        password: "123456",
        confirmarPassword: "123456"
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.msg).toBe("Lo sentimos, debes llenar todos los campos");
  });

  it('Debería fallar si las contraseñas no coinciden', async () => {
    const res = await request(app)
      .post('/api/cliente/registro')
      .send({
        nombre: "Nombre",
        telefono: "123456789",
        direccion: "Calle Falsa 123",
        provincia: "Pichincha",
        ciudad: "Quito",
        email: "fail@test.com",
        password: "123456",
        confirmarPassword: "654321"
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.msg).toBe("Las contraseñas no coinciden");
  });

  it('Debería fallar si el correo ya está registrado', async () => {
    // Creamos primero un cliente
    await Cliente.create({
      nombre: "Cliente Existente",
      telefono: "123456789",
      direccion: "Calle Falsa 123",
      provincia: "Pichincha",
      ciudad: "Quito",
      email: "repetido@test.com",
      password: "123456",
      confirmarPassword: "123456"
    });

    const res = await request(app)
      .post('/api/cliente/registro')
      .send({
        nombre: "Otro",
        telefono: "123456789",
        direccion: "Otra calle",
        provincia: "Pichincha",
        ciudad: "Quito",
        email: "repetido@test.com",
        password: "123456",
        confirmarPassword: "123456"
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.msg).toBe("Lo sentimos, el correo ya se encuentra registrado");
  });

});

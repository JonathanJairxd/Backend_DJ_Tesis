import nodemailer from "nodemailer"
import dotenv from 'dotenv'
dotenv.config()

let transporter = nodemailer.createTransport({
    service: 'gmail',
    host: process.env.HOST_MAILTRAP,
    port: process.env.PORT_MAILTRAP,
    auth: {
        user: process.env.USER_MAILTRAP,
        pass: process.env.PASS_MAILTRAP,
    }
});


// Mandar mensaje para recueprar la contraseña
const sendMailToRecoveryPassword = async (userMail, token, isAdmin = true) => {
    const url = isAdmin ? "recuperar-password" : "cliente/recuperar-password"

    let info = await transporter.sendMail({
        from: 'sistemaGestionDj@gmail.com',
        to: userMail,
        subject: "Recuperación de contraseña - Sistema de gestión de Edwin DJ",
        html: `
        <h1>Recupera tu contraseña</h1>
        <p>Hola, hemos recibido una solicitud para recuperar tu contraseña en el sistema de gestión de Edwin DJ.</p>
        <p>Si fuiste tú quien hizo esta solicitud, haz clic en el siguiente enlace para restablecer tu contraseña:</p>
        <a href="${process.env.URL_BACKEND}/${url}/${token}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Restablecer contraseña</a>
        <p>Si no solicitaste este cambio, puedes ignorar este correo. No se realizarán cambios en tu cuenta.</p>
        <hr>
        <footer>
            <p>Gracias por usar el sistema de gestión de Edwin DJ. ¡Estamos aquí para ayudarte!</p>
        </footer>
    `
    });
    console.log("Mensaje enviado satisfactoriamente: ", info.messageId);
}

// Validar la cuenta del cliente
const sendMailToCliente = async (userMail, token) => {
    console.log("Correo a enviar: " ,userMail)

    let info = await transporter.sendMail({
        from: 'admin@djapp.com',
        to: userMail,
        subject: "Correo de Confirmación de Cuenta",
        html: `
        <h1>¡Bienvenido a la plataforma de Edwin Dj 🎧🎶</h1>
        <hr>
        <p> ¡Gracias por registrate! Para activar tu cuenta, haz click en el siguiente enlace</p>
        <a href=${process.env.URL_BACKEND}cliente/confirmar/${encodeURIComponent(token)}>Confirmar mi cuenta</a>
        <hr>
        <footer>🎵 ¡Disfruta de la mejor música con nosotros! 🎵</footer>
        `
    });

    console.log("Mensaje enviado satisfactoriamente: ", info.messageId);
}



export {
    sendMailToRecoveryPassword,
    sendMailToCliente
}

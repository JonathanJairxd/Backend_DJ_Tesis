import nodemailer from "nodemailer"
import dotenv from 'dotenv'
dotenv.config()

let transporter = nodemailer.createTransport({
    service: 'gmail',
    host: process.env.HOST_SMTP,
    port: process.env.PORT_SMTP,
    auth: {
        user: process.env.USER_SMTP,
        pass: process.env.PASS_SMTP,
    }
});


// Mandar mensaje para recueprar la contraseña
const sendMailToRecoveryPassword = async (userMail, token, isAdmin = true) => {
    const url = isAdmin ? "admin/recuperar-password" : "cliente/recuperar-password"

    let info = await transporter.sendMail({
        from: `"Sistema de Edwin DJ 🎵" <${process.env.USER_SMTP}>`,
        to: userMail,
        subject: "Recuperación de contraseña - Sistema de Edwin DJ",
        html: `
        <h2>¡Hola!</h2>
        <p>Hemos recibido una solicitud para recuperar tu contraseña en el sistema de gestión de Edwin DJ.</p>
        <p>Si fuiste tú quien hizo esta solicitud, haz clic en el siguiente enlace para restablecer tu contraseña:</p>
        <a href="${process.env.URL_FRONTEND}${url}/${token}" class="button">Restablecer contraseña</a>
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
        from: `"Sistema de Edwin DJ 🎵" <${process.env.USER_SMTP}>`,
        to: userMail,
        subject: "Confirmación de Cuenta - Sistema de Edwin DJ",
        html: `
        <h1>¡Bienvenido! Es un placer tenerte en nuestra comunidad 🎧🎶</h1>
        <hr>
        <p> ¡Gracias por registrate! Para activar tu cuenta, haz click en el siguiente enlace</p>
        <a href="${process.env.URL_FRONTEND}cliente/confirmar/${encodeURIComponent(token)}" class="button">Confirmar mi cuenta</a>
        <hr>
        <footer>🎵 ¡Explora nuestra colección de vinilos y mantente al tanto de los mejores eventos! 🎵</footer>
        `
    });

    console.log("Mensaje enviado satisfactoriamente: ", info.messageId);
}

// Notificar al admin cuando hay nueva compra
const sendNotificacionNuevaCompra = async (adminEmail, clienteNombre, total, metodoEnvio) => {
    try {
        await transporter.sendMail({
            from: `"Sistema de Edwin DJ 🎵" <${process.env.USER_SMTP}>`,
            to: adminEmail,
            subject: "🎉 Nueva compra realizada",
            html: `
                <h2>Hola 👋</h2>
                <p>Un cliente acaba de realizar una nueva compra.</p>
                <p><strong>Cliente:</strong> ${clienteNombre}</p>
                <p><strong>Total:</strong> $${total}</p>
                <p><strong>Método de envío:</strong> ${
                    metodoEnvio === "servientrega" 
                        ? "Servientrega (transferencia)" 
                        : "Encuentro Público (efectivo)"
                }</p>
                <a href="${process.env.URL_FRONTEND}login" class="button"">Ir a Login</a>
                <hr />
                <p>Sistema de Edwin DJ - Notificación automática</p>
            `,
        });
        console.log("Correo enviado al admin");
    } catch (error) {
        console.error("Error al enviar correo al admin:", error);
    }
};


// Notificar al cliente cuando el pedido se envía por servientrega
const sendNotificacionPedidoEnviado = async (clienteEmail, nombreCliente, total) => {
    try {
        await transporter.sendMail({
            from: `"Sistema de Edwin DJ 🎵" <${process.env.USER_SMTP}>`,
            to: clienteEmail,
            subject: "📦 Tu pedido ha sido enviado",
            html: `
                <h2>¡Hola ${nombreCliente}!</h2>
                <p>Tu pedido ya fue enviado y está en camino.</p>
                <p><strong>Método de envío:</strong> Servientrega (transferencia)</p>
                <p><strong>Total Pagado:</strong> $${total}</p>
                <p>Si tienes alguna duda o necesitas más información, no dudes en contactarnos.</p>
                <hr />
                <p><strong>Sistema de Edwin DJ</strong> - ¡Gracias por tu compra! 🎵</p>
                <p><em>🎶 Nos alegra ser parte de tu colección</em></p>
            `,
        });
        console.log("Correo enviado al cliente");
    } catch (error) {
        console.error("Error al enviar correo al cliente:", error);
    }
};

// Notificar al cliente cuando el pedido es Encuentro Publico
const sendNotificacionCompraRealizadaEncuentro = async (clienteEmail, nombreCliente, total) => {
    try {
        await transporter.sendMail({
            from: `"Sistema de Edwin DJ 🎵" <${process.env.USER_SMTP}>`,
            to: clienteEmail,
            subject: "🤝 Tu compra ha sido entregada ",
            html: `
                <h2>¡Hola ${nombreCliente}!</h2>
                <p>Tu compra ha sido entregada exitosamente.</p>
                <p><strong>Método de envío:</strong> Encuentro Público (efectivo)</p>
                <p><strong>Total Pagado:</strong> $${total}</p>
                <p>Si tienes alguna duda o necesitas más información, no dudes en contactarnos.</p>
                <hr />
                <p><strong>Sistema de Edwin DJ</strong> - ¡Gracias por tu compra! 🎵</p>
                <p><em>🎶 Nos alegra ser parte de tu colección</em></p>
            `,
        });
        console.log("Correo de compra (encuentro público) enviado al cliente");
    } catch (error) {
        console.error("Error al enviar correo de compra (encuentro público):", error);
    }
};



export {
    sendMailToRecoveryPassword,
    sendMailToCliente,
    sendNotificacionNuevaCompra,
    sendNotificacionPedidoEnviado,
    sendNotificacionCompraRealizadaEncuentro
}

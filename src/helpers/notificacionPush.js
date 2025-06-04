import fetch from 'node-fetch';

const enviarNotificacionPush = async (token, title, body) => {
  const message = {
    to: token,
    sound: 'default',
    title,
    body,
    data: { extraData: 'info' },
  };

  try {
    await fetch('https://exp.host/--/api/v2/push/send',  {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error('Error al enviar notificación push:', error);
  }
};

export default enviarNotificacionPush;
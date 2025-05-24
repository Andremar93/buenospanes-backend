const axios = require("axios");

const sendPushNotification = async (expoPushToken, title, body, data = {}) => {
    try {
        const response = await axios.post("https://exp.host/--/api/v2/push/send", {
            to: expoPushToken,
            sound: "default",
            title,
            body,
            data,
        }, {
            headers: {
                "Content-Type": "application/json",
            },
        });
        console.log("Notificación enviada:", response.data);
    } catch (error) {
        console.error("Error al enviar la notificación:", error.response?.data || error.message);
    }
};

module.exports = sendPushNotification;

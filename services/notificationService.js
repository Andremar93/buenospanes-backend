import { Expo } from 'expo-server-sdk';
import User from '../models/User.js';  // Ajusta la ruta a tu modelo User

const expo = new Expo();

export const sendNotificationToAllUsers = async ({ title, body }) => {
    try {
        // Obtener usuarios que tengan token de expo
        const users = await User.find({ expoPushToken: { $exists: true, $ne: null } });

        const messages = users.map(user => {
            const pushToken = user.expoPushToken;
            if (!Expo.isExpoPushToken(pushToken)) return null;
            return {
                to: pushToken,
                sound: 'default',
                title,
                body,
                data: { withSome: 'data' },
            };
        }).filter(Boolean);

        const chunks = expo.chunkPushNotifications(messages);
        for (let chunk of chunks) {
            try {
                await expo.sendPushNotificationsAsync(chunk);
            } catch (error) {
                console.error('Error enviando notificación:', error);
            }
        }
    } catch (err) {
        console.error('Error en sendNotificationToAllUsers:', err);
    }
};

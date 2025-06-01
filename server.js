import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import invoiceRoutes from './routes/invoices.js';
import expenseRoutes from './routes/expenses.js';
import exchangeRate from './routes/exchangeRate.js'
import incomeRoutes from './routes/incomes.js'
import auth from './middleware/auth.js';
import { sendNotificationToAllUsers } from './services/notificationService.js';
// Configuración de dotenv
dotenv.config();

// Crear servidor Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI, {
    dbName: 'panaderia',
})
    .then(() => console.log("✅ Conectado a MongoDB"))
    .catch((error) => console.error("Error al conectar a MongoDB:", error));

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('Servidor funcionando correctamente');
});

// Ruta de Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) {
            console.log('Usuario no encontrado');
            return res.status(400).json({ error: 'Usuario no encontrado' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Contraseña incorrecta' });
        }
        console.log("LOGIN FROM SEND NOTIFICATION")
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});


//Expenses API
app.use('/expenses', auth, expenseRoutes);

//Exchange Rate API
app.use('/exchange-rate', auth, exchangeRate);

// Rutas de facturas
app.use('/invoices', auth, invoiceRoutes);

// Rutas de Incomes
app.use('/incomes', auth, incomeRoutes);

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ mensaje: "Ocurrió un error en el servidor", error: err.message });
});


app.get("/ping", (req, res) => {
    res.status(200).send("pong");
});

// Push notifications
app.post('/register-push-token', auth, async (req, res) => {
    const token = req.body.expoPushToken;
    const userId = req.user.id;

    console.log(">> /register-push-token llamado");
    console.log("Token recibido:", token);
    console.log("Usuario autenticado:", userId);
    console.log("req.body",JSON.stringify(req.body));

    try {
        await User.findByIdAndUpdate(
            userId,
            { expoPushToken: token },
            { upsert: true }
        );
        res.sendStatus(200);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error actualizando el token de notificaciones' });
    }
});

app.get('/send-demo-notification', async (req, res) => {
    try {
      const title = "Notificación de prueba";
      const body = "Este es un mensaje de prueba";
  
      await sendNotificationToAllUsers({ title, body });
      res.status(200).json({ message: 'Notificación enviada con éxito' });
    } catch (error) {
      console.error('Error enviando notificación de prueba:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  

// Puerto de ejecución
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

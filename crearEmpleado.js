// Crear un archivo llamado createUser.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createEmployee } from './controllers/employeeController.js';

// Configurar dotenv
dotenv.config();

// Configurar conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("✅ Conectado a MongoDB"))
    .catch((error) => console.error("Error al conectar a MongoDB:", error));

const crearEmpleado = async () => {


    try {

        const response = await createEmployee({
            name: 'Mariana',
            weeklySalary: 50
        });

        console.log(response)
    } catch {
        console.error('Error al crear el empleado:', error);
    } finally {
        mongoose.connection.close();
    }
};

crearEmpleado();

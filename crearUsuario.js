// Crear un archivo llamado createUser.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Configurar dotenv
dotenv.config();

// Configurar conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((error) => console.error("Error al conectar a MongoDB:", error));

// Crear el modelo de usuario
import User from './models/User.js'; // Asegúrate de tener el modelo User con extensión .js

const createUser = async () => {
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = await bcrypt.hash('12345', salt);

  const newUser = new User({
    username: 'miUsuario',
    password: '12345'
  });

  try {
    await newUser.save();
    console.log('Usuario creado exitosamente');
  } catch (error) {
    console.error('Error al crear usuario:', error);
  } finally {
    mongoose.connection.close();
  }
};

createUser();

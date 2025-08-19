import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';

// Importar configuración
import config from './config/config.js';

// Importar middleware de errores
import {
  errorHandler,
  notFound,
  methodNotAllowed
} from './middleware/errorHandler.js';

// Importar rutas principales
import routes from './routes/index.js';

// Crear servidor Express
const app = express();

// Middleware de seguridad
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ['self'],
        styleSrc: ['self', 'unsafe-inline'],
        scriptSrc: ['self'],
        imgSrc: ['self', 'data:', 'https:']
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// Configuración de CORS
app.use(
  cors({
    origin: config.server.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMax,
  message: {
    error: 'Demasiadas peticiones desde esta IP',
    message: 'Por favor, intente nuevamente más tarde',
    retryAfter: Math.ceil(config.security.rateLimitWindowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting solo para rutas protegidas, no para autenticación
app.use('/api/expenses', limiter);
app.use('/api/exchange-rate', limiter);
app.use('/api/invoices', limiter);
app.use('/api/incomes', limiter);
app.use('/api/employees', limiter);

// Middleware de compresión
app.use(compression());

// Middleware para parsear JSON
app.use(
  express.json({
    limit: config.security.maxRequestSize
  })
);

// Middleware para parsear URL encoded
app.use(
  express.urlencoded({
    extended: true,
    limit: config.security.maxRequestSize
  })
);

// Conectar a MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(config.database.uri, {
      dbName: config.database.dbName,
      ...config.database.options
    });
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error);
    process.exit(1);
  }
};

// Manejar eventos de conexión de MongoDB
mongoose.connection.on('error', (err) => {
  console.error('❌ Error de conexión MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB desconectado');
});

// Manejar señales de terminación
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('✅ Conexión MongoDB cerrada por terminación de la aplicación');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error al cerrar conexión MongoDB:', err);
    process.exit(1);
  }
});

// Rutas de la API
app.use('/api', routes);

// Middleware para rutas no encontradas
app.use('*', notFound);

// Middleware para métodos HTTP no permitidos
app.use(methodNotAllowed);

// Middleware de manejo de errores (debe ser el último)
app.use(errorHandler);

// Puerto de ejecución
const PORT = config.server.port;

// Inicializar servidor
const startServer = async () => {
  try {
    // Conectar a la base de datos
    await connectDB();

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`🌍 Entorno: ${config.server.nodeEnv}`);
      console.log(`📊 Base de datos: ${config.database.dbName}`);
      console.log(`🔐 JWT expira en: ${config.jwt.expiresIn}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error);
    process.exit(1);
  }
};

// Iniciar servidor
startServer();

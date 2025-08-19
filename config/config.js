// config/config.js
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configuración de la aplicación
const config = {
  // Configuración del servidor
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || '*'
  },

  // Configuración de la base de datos
  database: {
    uri: process.env.MONGO_URI,
    dbName: process.env.MONGO_DB_NAME || 'panaderia',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: process.env.MONGO_MAX_POOL_SIZE || 10,
      serverSelectionTimeoutMS:
        process.env.MONGO_SERVER_SELECTION_TIMEOUT || 5000,
      socketTimeoutMS: process.env.MONGO_SOCKET_TIMEOUT || 45000
    }
  },

  // Configuración de JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'buenospanes-backend',
    audience: process.env.JWT_AUDIENCE || 'buenospanes-frontend'
  },

  // Configuración de seguridad
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    rateLimitWindowMs:
      parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100, // 100 requests por ventana
    maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb'
  },

  // Configuración de Google Sheets
  google: {
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_id: process.env.GOOGLE_CLIENT_ID
    },
    spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  },

  // Configuración de logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: process.env.LOG_ENABLE_CONSOLE !== 'false',
    enableFile: process.env.LOG_ENABLE_FILE === 'true',
    logFile: process.env.LOG_FILE || 'logs/app.log'
  }
};

// Función para validar configuración requerida
const validateConfig = () => {
  const required = ['MONGO_URI', 'JWT_SECRET'];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Variables de entorno requeridas faltantes: ${missing.join(', ')}`
    );
  }

  // Validar configuración de Google si está habilitada
  if (process.env.GOOGLE_ENABLED === 'true') {
    const googleRequired = [
      'GOOGLE_CLIENT_EMAIL',
      'GOOGLE_PRIVATE_KEY',
      'GOOGLE_SPREADSHEET_ID'
    ];

    const googleMissing = googleRequired.filter((key) => !process.env[key]);
    if (googleMissing.length > 0) {
      throw new Error(
        `Variables de Google requeridas faltantes: ${googleMissing.join(', ')}`
      );
    }
  }
};

// Función para obtener configuración por entorno
const getConfig = () => {
  try {
    validateConfig();
    return config;
  } catch (error) {
    console.error('Error en configuración:', error.message);
    process.exit(1);
  }
};

// Función para obtener configuración de desarrollo
const getDevConfig = () => {
  if (config.server.nodeEnv === 'development') {
    return {
      ...config,
      database: {
        ...config.database,
        options: {
          ...config.database.options
          // Opciones adicionales para desarrollo
        }
      }
    };
  }
  return config;
};

export default getConfig();
export { getDevConfig, validateConfig };

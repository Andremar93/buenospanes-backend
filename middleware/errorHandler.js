// middleware/errorHandler.js

// Clase personalizada para errores de la aplicación
export class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Errores comunes predefinidos
export const ErrorTypes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  INVALID_INPUT: 'INVALID_INPUT',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
};

// Mapeo de códigos de error HTTP
const getHttpStatus = (errorCode) => {
  const statusMap = {
    [ErrorTypes.VALIDATION_ERROR]: 400,
    [ErrorTypes.AUTHENTICATION_ERROR]: 401,
    [ErrorTypes.AUTHORIZATION_ERROR]: 403,
    [ErrorTypes.NOT_FOUND]: 404,
    [ErrorTypes.DUPLICATE_ENTRY]: 409,
    [ErrorTypes.INVALID_INPUT]: 400,
    [ErrorTypes.DATABASE_ERROR]: 500,
    [ErrorTypes.EXTERNAL_SERVICE_ERROR]: 502,
    [ErrorTypes.RATE_LIMIT_EXCEEDED]: 429
  };

  return statusMap[errorCode] || 500;
};

// Middleware principal de manejo de errores
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log del error para debugging
  console.error('Error Handler:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    error = new AppError(message, 400, ErrorTypes.VALIDATION_ERROR);
  }

  // Error de ID de MongoDB inválido
  if (err.name === 'CastError') {
    const message = 'Recurso no encontrado';
    error = new AppError(message, 404, ErrorTypes.NOT_FOUND);
  }

  // Error de duplicación (código 11000 de MongoDB)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `El campo ${field} ya existe con el valor: ${err.keyValue[field]}`;
    error = new AppError(message, 409, ErrorTypes.DUPLICATE_ENTRY);
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token inválido';
    error = new AppError(message, 401, ErrorTypes.AUTHENTICATION_ERROR);
  }

  // Error de JWT expirado
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expirado';
    error = new AppError(message, 401, ErrorTypes.AUTHENTICATION_ERROR);
  }

  // Error de sintaxis JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    const message = 'JSON inválido en el cuerpo de la petición';
    error = new AppError(message, 400, ErrorTypes.INVALID_INPUT);
  }

  // Error de límite de tamaño de archivo
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'El archivo es demasiado grande';
    error = new AppError(message, 400, ErrorTypes.INVALID_INPUT);
  }

  // Error de límite de archivos
  if (err.code === 'LIMIT_FILE_COUNT') {
    const message = 'Demasiados archivos';
    error = new AppError(message, 400, ErrorTypes.INVALID_INPUT);
  }

  // Error de límite de campos
  if (err.code === 'LIMIT_FIELD_COUNT') {
    const message = 'Demasiados campos';
    error = new AppError(message, 400, ErrorTypes.INVALID_INPUT);
  }

  // Error de límite de partes
  if (err.code === 'LIMIT_PART_COUNT') {
    const message = 'Demasiadas partes';
    error = new AppError(message, 400, ErrorTypes.INVALID_INPUT);
  }

  // Error de límite de headers
  if (err.code === 'LIMIT_HEADER_COUNT') {
    const message = 'Demasiados headers';
    error = new AppError(message, 400, ErrorTypes.INVALID_INPUT);
  }

  // Error de límite de URL
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Archivo inesperado';
    error = new AppError(message, 400, ErrorTypes.INVALID_INPUT);
  }

  // Determinar el status code
  const statusCode = error.statusCode || getHttpStatus(error.errorCode) || 500;

  // Determinar el mensaje
  const message = error.message || 'Error interno del servidor';

  // Respuesta de error
  const errorResponse = {
    success: false,
    error: {
      message,
      code: error.errorCode || 'INTERNAL_SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: error
      })
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  res.status(statusCode).json(errorResponse);
};

// Middleware para manejar rutas no encontradas
export const notFound = (req, res, _next) => {
  const error = new AppError(
    `Ruta no encontrada: ${req.originalUrl}`,
    404,
    ErrorTypes.NOT_FOUND
  );
  _next(error);
};

// Middleware para manejar métodos HTTP no permitidos
export const methodNotAllowed = (req, res, _next) => {
  const error = new AppError(
    `Método HTTP ${req.method} no permitido para ${req.originalUrl}`,
    405,
    'METHOD_NOT_ALLOWED'
  );
  _next(error);
};

// Wrapper para manejar errores en funciones async
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

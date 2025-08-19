// middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const auth = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.header('Authorization');

    if (!authHeader) {
      return res.status(401).json({
        error: 'Acceso denegado',
        message: 'Token de autorización requerido'
      });
    }

    // Verificar formato del token
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Formato de token inválido',
        message: 'El token debe comenzar con "Bearer "'
      });
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    if (!token) {
      return res.status(401).json({
        error: 'Token vacío',
        message: 'Token no proporcionado'
      });
    }

    try {
      // Verificar token
      const verified = jwt.verify(token, process.env.JWT_SECRET);

      // Verificar que el usuario aún existe en la base de datos
      const user = await User.findById(verified.id).select('-password');
      if (!user) {
        return res.status(401).json({
          error: 'Usuario no encontrado',
          message: 'El usuario asociado al token ya no existe'
        });
      }

      // Verificar que el usuario esté activo (puedes agregar un campo 'active' al modelo)
      // if (!user.active) {
      //     return res.status(401).json({
      //         error: 'Usuario inactivo',
      //         message: 'El usuario ha sido desactivado'
      //     });
      // }

      // Agregar información del usuario al request
      req.user = {
        id: verified.id,
        userType: verified.userType,
        username: verified.username
      };

      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expirado',
          message:
            'El token de acceso ha expirado. Por favor, inicie sesión nuevamente.',
          code: 'TOKEN_EXPIRED'
        });
      }



      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: 'Token inválido',
          message: 'El token proporcionado no es válido',
          code: 'INVALID_TOKEN'
        });
      }

      throw jwtError;
    }
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error durante la verificación de autenticación'
    });
  }
};

export default auth;

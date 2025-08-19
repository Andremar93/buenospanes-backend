import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Validación básica de entrada
const validateLoginInput = (username, password) => {
  const errors = [];
  if (!username || username.trim().length < 3) {
    errors.push('El nombre de usuario debe tener al menos 3 caracteres');
  }

  // if (!password || password.length <= 5) {
  //   errors.push('La contraseña debe tener al menos 5 caracteres');
  // }

  return errors;
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validar entrada
    const validationErrors = validateLoginInput(username, password);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: validationErrors
      });
    }

    // Buscar usuario
    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Usuario o contraseña incorrectos'
      });
    }

    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Usuario o contraseña incorrectos'
      });
    }

    // Generar token con información mínima necesaria
    const payload = {
      id: user._id,
      userType: user.userType,
      username: user.username
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      issuer: 'buenospanes-backend',
      audience: 'buenospanes-frontend'
    });

    // Generar refresh token
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Respuesta exitosa
    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          userType: user.userType
        }
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error durante el proceso de autenticación'
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token requerido'
      });
    }

    // Verificar refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    // Buscar usuario
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        error: 'Usuario no encontrado'
      });
    }

    // Generar nuevo token
    const newToken = jwt.sign(
      {
        id: user._id,
        userType: user.userType,
        username: user.username
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: 'buenospanes-backend',
        audience: 'buenospanes-frontend'
      }
    );

    res.json({
      success: true,
      message: 'Token renovado exitosamente',
      data: {
        token: newToken,
        user: {
          id: user._id,
          username: user.username,
          userType: user.userType
        }
      }
    });
  } catch (error) {
    console.error('Error en refresh token:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Refresh token inválido'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Refresh token expirado'
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

export const logout = async (req, res) => {
  try {
    // En una implementación más robusta, aquí podrías:
    // - Agregar el token a una blacklist
    // - Invalidar el refresh token

    res.json({
      success: true,
      message: 'Logout exitoso'
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

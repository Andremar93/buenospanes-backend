// routes/auth.js
import express from 'express';
import { login, refreshToken, logout } from '../controllers/authController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Ruta de login
router.post('/login', asyncHandler(login));

// Ruta para renovar token
router.post('/refresh', asyncHandler(refreshToken));

// Ruta de logout
router.post('/logout', asyncHandler(logout));

export default router;
